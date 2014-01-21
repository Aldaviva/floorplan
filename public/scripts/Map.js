this.Map = (function(){

	var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	var STORM_API_ROOT = 'http://54.212.42.221/api/';

	/*
	 * options:	{
	 *     office: 'mv',
	 *     skipFilters: false,
	 *     skipEndpoints: false
	 * }
	 */
	var Map = Backbone.View.extend({

		events: {
			"click .photos image": 'onIconClick',
			"click .seats rect": 'onSeatClick'
		},

		initialize: function(){
			_.bindAll(this);

			this.collection.on('reset', this.addMany);
			this.collection.on('add', this.addOne);

			this.photosGroup = this.$('.photos');
			this.seatsGroup = this.$('.seats');
			this.activeRectangle = null;

			mediator.subscribe('activatePersonConfirmed', this.activatePersonConfirmed);
			if(!this.options.skipFilters){
				mediator.subscribe('filterByTag', this.filterByTag);
				mediator.subscribe('change:query', this.filterByName);
			}
		},

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

				if(!this.options.skipEndpoints){
					this.renderEndpointBadges();
					setInterval(this.renderEndpointBadges, 5*1000);
				}
			}
			return this.el;
		},

		addMany: function(coll){
			var iconsFragment = document.createDocumentFragment();

			coll.each(function(model){
				if(model.get('office') == this.options.office){
					iconsFragment.appendChild(this.createAndRenderPersonIcon(model));
				}
			}, this);

			this.photosGroup.append(iconsFragment);
		},

		addOne: function(person){
			if(person.get('office') == this.options.office){
				this.photosGroup.append(this.createAndRenderPersonIcon(person));
			}
		},

		createAndRenderPersonIcon: function(person){
			var personIcon = new PersonIcon({ model: person });
			return personIcon.render();
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
				view && svgAddClass(view.el, 'filtered_tag');
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
				view && svgAddClass(view.el, 'filtered_name');
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
			var activeSeatEl = this.seatsGroup.find('[class~=active]').get(0); //LOL chrome SVG attribute selectors
			activeSeatEl && svgRemoveClass(activeSeatEl, 'active');

			if(_.isNumber(desk)){
				svgAddClass(this.seatsGroup.find('[data-desk='+desk+']')[0], 'active');
			}
		},

		renderEndpointBadges: function(){
			var badgeEls = this.$('.endpointBadges rect');
			badgeEls.each(function(index, badgeEl){
				var endpointId = $(badgeEl).attr("endpoint:id");
				$.getJSON(STORM_API_ROOT+"endpoints/"+endpointId+"/status")
					.done(function(endpointStatus){
						var isAvailable = !endpointStatus.isCallActive && !endpointStatus.isReserved;
						var titleText;
						if(isAvailable){
							svgAddClass(badgeEl, 'available');
							svgRemoveClass(badgeEl, 'busy');
							titleText = "probably available";
						} else {
							svgAddClass(badgeEl, 'busy');
							svgRemoveClass(badgeEl, 'available');
							titleText = endpointStatus.isCallActive
								? "busy\n(call active)"
								: "busy\n(calendar reservation)";
						}
						setTitle(badgeEl, titleText);
					});
			});
		}
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
			this.model.on('change:photo', this.renderPhoto);

			this.iconSize = SEATS[this.model.get('office')].iconSize;
		},

		render: function(){
			if(this.$el.is(':empty')){
				setTitle(this.$el, this.model.get('fullname'));

				this.renderPhoto(this.model, this.model.getPhotoPath());
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

		renderPhoto: function(person, photoPath){
			this.el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', photoPath);
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

	function setTitle(el, titleText){
		var titleEl = $(el).children("title");
		if(!titleEl.length){
			titleEl = document.createElementNS(SVG_NAMESPACE, 'title');
			$(el).append(titleEl);
		}
		$(titleEl).text(titleText);
	}

	return Map;

})();