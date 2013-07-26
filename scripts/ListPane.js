this.ListPane = (function(){

	var ListPane = Backbone.View.extend({

		events: {
			"click .people li": "onRowClick"
		},

		initialize: function(){
			_.bindAll(this);

			this.ol = null;
			this.searchBox = new SearchBox();
			this.tagGrid = new TagGrid({ collection: this.collection });

			this.collection.on('reset', this.addMany);
			// this.searchBox.on('change:query', this.filterByName);
			mediator.subscribe('change:query', this.filterByName);
			mediator.subscribe('filterByTag', this.filterByTag);
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.$el.append(this.searchBox.render());

				this.ol = $('<ol>', { class: 'people' });
				this.$el.append(this.ol);

				this.$el.append(this.tagGrid.render());
			}
			return this.el;
		},

		addMany: function(coll){
			var insertFragment = document.createDocumentFragment();

			coll.each(function(model){
				var personView = new PersonRow({ model: model });
				insertFragment.appendChild(personView.render());
			});

			this.ol.append(insertFragment);
		},

		filterByName: function(query){
			query = query.toLowerCase().trim();

			this.ol.children().removeClass('filtered_name');

			if(query.length){
				var peopleToHide = this.collection.filter(function(person){
					return person.get('fullname').toLowerCase().indexOf(query) === -1;
				});

				_.each(peopleToHide, function(personToHide){
					var view = personToHide.views.listPaneRow;
					view.$el.addClass('filtered_name');
				});
			}
		},

		filterByTag: function(params){
			var tagsToShow = params.tagsToShow;

			var peopleToHide = this.collection.filter(function(person){
				var personTags = person.get('tags');
				return !personTags || !personTags.length || _.intersection(personTags, tagsToShow).length === 0;
			});

			this.ol.children().removeClass('filtered_tag');
			_.each(peopleToHide, function(personToHide){
				var view = personToHide.views.listPaneRow;
				view.$el.addClass('filtered_tag');
			});
		},

		onRowClick: function(event){
			var model = $(event.currentTarget).data('model');
			mediator.publish("activatePerson", model);
		}
	});

	var PersonRow = Backbone.View.extend({
		tagName: 'li',
		className: 'person',

		initialize: function(){
			_.bindAll(this);

			this.nameEl = null;

			this.model.views = this.model.views || {};
			this.model.views.listPaneRow = this;

			this.$el.data('model', this.model);
		},

		render: function(){
			if(this.$el.is(':empty')){
				var fullname = this.model.get('fullname');
				this.$el.append($('<img>', {
					src: this.model.getPhotoPath(),
					alt: fullname
				}));

				this.nameEl = $('<div>', {
					class: 'name',
					text: fullname
				});
				this.$el.append(this.nameEl);
			}
			return this.el;
		}
	});

	var SearchBox = Backbone.View.extend({
		className: 'queryContainer',

		events: {
			'keyup input.query': 'changeQuery'
		},

		initialize: function(){
			_.bindAll(this);
			this.textField = null;
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.textField = $('<input>', { type: 'text', placeholder: 'Search', class: 'query', autocomplete: 'false' });
				this.$el.append(this.textField);
			}
			return this.el;
		},

		changeQuery: _.throttle(function(event){
			// this.trigger('change:query', event.target.value);
			mediator.publish('change:query', event.target.value);
		}, 50)
	});

	var TagGrid = Backbone.View.extend({
		className: 'tags',

		events: {
			'click .tag': 'onTagClick'
		},

		initialize: function(){
			_.bindAll(this);

			this.filterState = {};
			this.collection.on('reset', this.populate);
		},

		render: function(){
			_(this.filterState)
				// .where({ tagGridEl: null })
				.filter(function(tagFilterState){
					return !tagFilterState.tagGridEl && tagFilterState.tagName != 'other';
				})
				.each(function(tagFilterState){
					var tagEl = $('<a>')
						.attr('href', '#')
						.addClass('tag')
						.data('tagName', tagFilterState.tagName)
						.text(tagFilterState.tagName);
					tagFilterState.tagGridEl = tagEl;
					this.$el.append(tagEl);
				}, this);

			_.each(this.filterState, function(tagFilterState){
				tagFilterState.tagGridEl && tagFilterState.tagGridEl.toggleClass('filtered', tagFilterState.isFiltered);
			}, this);

			return this.el;
		},

		populate: function(coll){
			var tagNames = _(coll.pluck('tags')).flatten().compact().unique().sortBy().value();
			_.extend(this.filterState, _.zipObject(tagNames.map(function(tagName){
				return [tagName, {
					tagName: tagName,
					tagGridEl: null,
					isFiltered: false
				}];
			})));
			this.render();
		},

		onTagClick: function(event){
			event.preventDefault();

			if(!this._isAnyTagFiltered()){ //case c
				_.each(this.filterState, function(tagFilterState){
					tagFilterState.isFiltered = true;
				});
			}

			var tagFilterState = this.filterState[$(event.currentTarget).data('tagName')];
			tagFilterState.isFiltered = !tagFilterState.isFiltered;

			if(this._isEveryTagFiltered()){ //case b
				_.each(this.filterState, function(tagFilterState){
					tagFilterState.isFiltered = false;
				});
			}

			this.render();

			mediator.publish("filterByTag", {
				tagsToShow: _(this.filterState)
					.where({ isFiltered: false })
					.pluck('tagName')
					.value()
			});
		},

		_isAnyTagFiltered: function(){
			return _.any(this.filterState, 'isFiltered');
		},

		_isEveryTagFiltered: function(){
			return _.all(this.filterState, 'isFiltered');
		}
	});

	return ListPane;

})();