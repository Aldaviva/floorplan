this.Map = (function(){

	var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	
	//see "seating chart.svg" which maps these entries (by index) to visual placement
	var SEAT_POSITIONS = [[235.598,161.071],[150.3,56.688],[150.3,83.688],[182,56.688],[150.3,108.868],[150.3,134.87],[182.001,108.868],[320.749,161.071],[292.365,161.071],[263.981,161.071],[235.598,295.586],[320.749,295.585],[292.365,295.586],[263.981,295.586],[235.598,344.552],[320.749,344.552],[292.365,344.552],[263.981,344.552],[235.598,369.981],[320.749,369.981],[292.365,369.981],[263.981,369.981],[232.149,419.926],[321.324,419.924],[368.931,416.551],[396.379,416.551],[291.599,419.926],[261.874,419.926],[423.618,478.309],[369.142,478.309],[205.712,478.309],[287.427,478.309],[314.665,478.309],[260.188,478.309],[232.95,478.309],[341.903,503.762],[423.618,503.762],[396.379,503.762],[369.142,503.762],[463.759,455.119],[548.909,455.119],[520.525,455.118],[492.142,455.118],[668.831,210.79],[642.831,210.79],[618.032,210.79],[668.831,293.793],[668.831,321.461],[618.032,321.461],[642.831,321.461],[668.831,266.125],[668.831,238.457],[590.581,279.959],[590.581,307.627],[590.581,252.292],[590.581,224.624],[470.08,417.552],[548.909,417.552],[522.633,417.551],[496.355,417.551],[470.08,377.302],[548.909,377.302],[522.633,377.301],[496.355,377.301],[470.08,351.802],[548.909,351.802],[522.633,351.801],[496.355,351.801],[470.08,309.802],[548.909,309.802],[522.633,309.801],[496.355,309.801],[548.909,284.676],[518.403,284.675],[487.896,284.675],[548.909,244.426],[518.403,244.425],[487.896,244.425],[548.909,219.176],[518.403,219.175],[548.909,179.093],[514.908,179.092],[487.896,219.175],[463.759,480.619],[548.909,480.619],[520.525,480.618],[492.142,480.618],[463.759,504.452],[548.909,504.452],[520.525,504.451],[492.142,504.451],[463.759,529.286],[548.909,529.286],[520.525,529.285],[548.909,554.642],[520.525,554.641],[492.142,529.285],[205.712,503.762],[287.427,503.762],[314.665,503.762],[260.188,503.762],[232.95,503.762],[314.665,554.641],[396.38,554.641],[423.618,554.641],[369.142,554.641],[341.903,554.641],[205.712,554.641],[287.427,554.641],[232.95,554.641],[235.598,211.076],[320.749,211.076],[292.365,211.076],[263.981,211.076],[235.598,270.157],[263.981,270.157],[292.365,270.157],[320.749,270.157],[235.598,236.505],[263.981,236.505],[292.365,236.505],[320.749,236.505],[178.474,491.036],[396.379,478.309],[178.474,554.641],[151.236,554.641]];

	var Map = Backbone.View.extend({

		events: {
			"click #photos image": 'onIconClick'
		},

		initialize: function(){
			_.bindAll(this);

			this.collection.on('reset', this.addMany);
			this.photosGroup = this.$('#photos');

			mediator.subscribe('filterByTag', this.filterByTag);
			mediator.subscribe('activatePerson', this.activatePerson);
			mediator.subscribe('change:query', this.filterByName);
		},

		render: function(){
			return this.el;
		},

		addMany: function(coll){
			var iconsFragment = document.createDocumentFragment();

			coll.each(function(model){
				var personIcon = new PersonIcon({ model: model });
				iconsFragment.appendChild(personIcon.render());
			});

			this.photosGroup.append(iconsFragment);
		},

		onIconClick: function(event){
			var model = $(event.currentTarget).data('model');
			mediator.publish("activatePerson", model);
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

		activatePerson: function(model){
			this.photosGroup.children().each(function(index, photoEl){
				photoEl.classList.remove('active');
			});
			model.views.mapIcon.el.classList.add('active');
		}
	});

	var PersonIcon = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this);
			this.setElement(document.createElementNS(SVG_NAMESPACE, 'image'));

			this.model.views = this.model.views || {};
			this.model.views.mapIcon = this;

			this.$el.data('model', this.model);
		},

		render: function(){
			// this.$el.attr('title', this.model.get('fullname'));
			var titleEl = document.createElementNS(SVG_NAMESPACE, 'title');
			$(titleEl).text(this.model.get('fullname'));
			this.$el.append(titleEl);

			var desk = this.model.get('desk');
			if(desk !== null){
				var coords = SEAT_POSITIONS[desk];
				this.$el.attr({
					width: 22.32,
					height: 22.32,
					x: coords[0],
					y: coords[1],
					'data-desk': desk
				});

				this.el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.model.getPhotoPath());
			}

			return this.el;
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
		el.className.baseVal = (el.className.baseVal + ' ' + classStr).trim();
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