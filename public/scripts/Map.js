this.Map = (function(){

	var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

	/*
	 * options:	{
	 *     office: 'mv',
	 *     skipFilters: false
	 * }
	 */
	var Map = Backbone.View.extend({

		events: {
			"click #photos image": 'onIconClick',
			"click #seats rect": 'onSeatClick'
		},

		initialize: function(){
			_.bindAll(this);

			this.collection.on('reset', this.addMany);
			this.photosGroup = this.$('#photos');
			this.seatsGroup = this.$('#seats');
			this.activeRectangle = null;

			mediator.subscribe('activatePersonConfirmed', this.activatePersonConfirmed);
			if(!this.options.skipFilters){
				mediator.subscribe('filterByTag', this.filterByTag);
				mediator.subscribe('change:query', this.filterByName);
			}
		},

		// from the floorplan page, subscribe to certain topics
		// from the admin page, do other stuff

		render: function(){
			if(this.seatsGroup.is(':empty')){
				var seatData      = SEATS[this.options.office];
				var seatPositions = seatData.seatPositions;
				var numSeats      = seatPositions.length;
				var iconSize      = seatData.iconSize;

				var seatsFragment = document.createDocumentFragment();
				for(var seatIdx=0; seatIdx < numSeats; seatIdx++){
					var deskEl = document.createElementNS(SVG_NAMESPACE, 'rect');
					var coords = seatPositions[seatIdx];
					$(deskEl).attr({
						width: iconSize,
						height: iconSize,
						x: coords[0],
						y: coords[1],
						'data-desk': seatIdx
					});
					seatsFragment.appendChild(deskEl);
				}
				this.seatsGroup.append(seatsFragment);
			}
			/*if(!this.activeRectangle){
				this.activeRectangle = document.createElementNS(SVG_NAMESPACE, 'rect');
				$(this.activeRectangle).attr({
					width: ICON_SIZE,
					height: ICON_SIZE,
					x: 0,
					y: 0
				});
				svgAddClass(this.activeRectangle, 'activeRectangle');
				this.photosGroup.append(this.activeRectangle);
			}*/
			return this.el;
		},

		addMany: function(coll){
			var iconsFragment = document.createDocumentFragment();

			coll.each(function(model){
				if(model.get('office') == this.options.office){
					var personIcon = new PersonIcon({ model: model });
					iconsFragment.appendChild(personIcon.render());
				}
			}, this);

			this.photosGroup.append(iconsFragment);
		},

		onIconClick: function(event){
			var model = $(event.currentTarget).data('model');
			mediator.publish("map:clickPerson", model);
		},

		onSeatClick: function(event){
			var deskId = $(event.currentTarget).data('desk');
			this.renderActiveSeat(deskId);
			mediator.publish("map:clickDesk", deskId);
		},

		filterByTag: function(params){
			var tagsToShow = params.tagsToShow;

			var peopleToHide = (tagsToShow != null)
				? this.collection.filter(function(person){
						var personTags = person.get('tags');
						return !personTags || !personTags.length || _.intersection(personTags, tagsToShow).length === 0;
					})
				: [];

			this.photosGroup.children().each(function(index, photoEl){
				svgRemoveClass(photoEl, 'filtered_tag');
			});

			_.each(peopleToHide, function(personToHide){
				var view = personToHide.views.mapIcon;
				svgAddClass(view.el, 'filtered_tag');
			});
		},

		filterByName: function(query){
			query = query.toLowerCase().trim();

			var peopleToHide = this.collection.filter(function(person){
				return person.get('fullname').toLowerCase().indexOf(query) === -1;
			});

			this.photosGroup.children().each(function(index, photoEl){
				svgRemoveClass(photoEl, 'filtered_name');
			});

			_.each(peopleToHide, function(personToHide){
				var view = personToHide.views.mapIcon;
				svgAddClass(view.el, 'filtered_name');
			});
		},

		activatePersonConfirmed: function(model){
			if(model.get('office') == this.options.office){
				this.photosGroup.children().each(function(index, photoEl){
					svgRemoveClass(photoEl, 'active');
				});

				var activeEl = model.views.mapIcon.el;
				svgAddClass(activeEl, 'active');

				this.renderActiveSeat(model.get('desk'));
			}
		},

		renderActiveSeat: function(desk){
			console.log('renderActiveSeat', desk);
			var activeSeatEl = this.seatsGroup.find('[class~=active]').get(0); //LOL chrome SVG attribute selectors
			activeSeatEl && svgRemoveClass(activeSeatEl, 'active');

			if(_.isNumber(desk)){
				svgAddClass(this.seatsGroup.find('[data-desk='+desk+']')[0], 'active');
			}
		}

		/*moveActiveRectangleToDesk: function(deskId){
			var coords = SEAT_POSITIONS[deskId];
			$(this.activeRectangle).attr({
				x: coords[0],
				y: coords[1]
			});
		}*/
	});

	var PersonIcon = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this);
			this.setElement(document.createElementNS(SVG_NAMESPACE, 'image'));

			this.model.views = this.model.views || {};
			this.model.views.mapIcon = this;

			this.$el.data('model', this.model);

			this.model.on('change:office', this.onChangeOffice);
			this.model.on('change:desk', this.onChangeDesk);

			this.iconSize = SEATS[this.model.get('office')].iconSize;
		},

		render: function(){
			if(this.$el.is(':empty')){
				var titleEl = document.createElementNS(SVG_NAMESPACE, 'title');
				$(titleEl).text(this.model.get('fullname'));
				this.$el.append(titleEl);

				this.el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.model.getPhotoPath());
			}

			var desk = this.model.get('desk');
			var hasDesk = _.isNumber(desk);
			this.$el.toggle(hasDesk);
			if(hasDesk){
				var coords = this.getSeatPosition(desk);
				this.$el.attr({
					width: this.iconSize,
					height: this.iconSize,
					x: coords[0],
					y: coords[1],
					'data-desk': desk
				});
			}

			return this.el;
		},

		onChangeOffice: function(person, office){
			//probably just destroy this view
			//TODO the other map needs to be told to add a corresponding view
		},

		onChangeDesk: function(person, desk){
			this.render();
		},

		getSeatPosition: function(deskId){
			return SEATS[this.model.get('office')].seatPositions[deskId];
		}
	});

	/**
	 * Would love to use jQuery here, but jQuery's *Class() methods expect el.className to be a String.
	 * In SVG land, it's an SVGAnimatedString object, with baseVal and animVal children.
	 * Modern browsers expose el.classList with add() and remove(), but IE 10 does not, so we must reimplement.
	 *
	 * @param SVGElement el - element with the class attribute to modify; not jQuery-wrapped (ex: <image> element)
	 * @param String classStr - the class to add; separate multiple classes with whitespace (ex: "active hover")
	 */
	function svgAddClass(el, classStr){
		var oldClassList = el.className.baseVal.split(/\s/);
		var newClassList = _.compact(_.unique(oldClassList.concat(classStr.split(/\/s/))));
		el.className.baseVal = newClassList.join(" ");
	}

	/**
	 * Similar to svgAddClass, we cannot use jQuery or el.classList.
	 *
	 * @param SVGElement el - element with the class attribute to modify; not jQuery-wrapped (ex: some <image> element)
	 * @param String classStr - the class to remove; separate multiple classes with whitespace (ex: "active hover")
	 */
	function svgRemoveClass(el, classStr){
		var oldClassList = el.className.baseVal.split(/\s/);
		var newClassList = _.without.apply(null, [oldClassList].concat(classStr.split(/\s/)));
		el.className.baseVal = newClassList.join(" ");
	}

	return Map;

})();