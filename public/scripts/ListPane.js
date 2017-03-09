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
			this.officeGrid = new OfficeGrid();

			this.collection.on('reset', this.addMany);
			this.collection.on('add', this.addOne);
			this.collection.on('destroy', this.removePerson);
			mediator.subscribe('change:query', this.filterByName);
			mediator.subscribe('filterByTag', this.filterByTag);

			mediator.subscribe('activatePersonConfirmed', this.onActivatePersonConfirmed);
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.$el.append(this.officeGrid.render());

				this.$el.append(this.searchBox.render());

				this.ol = $('<ol>', { class: 'people' });
				this.$el.append(this.ol);

				this.$el.append(this.tagGrid.render());
			}
			return this.el;
		},

		addMany: function(coll){
			var insertFragment = document.createDocumentFragment();

			coll.each(function(person){
				var personView = new PersonRow({ model: person });
				insertFragment.appendChild(personView.render());
			});

			this.ol.append(insertFragment);
		},

		addOne: function(person){
			var personView = new PersonRow({ model: person }).render();
			var indexToInsertAt = this.collection.sortedIndex(person);
			if(indexToInsertAt === 0){
				//insert before element 1
				$(personView).insertBefore(this.collection.at(1).views.listPaneRow.$el);
			} else {
				$(personView).insertAfter(this.collection.at(indexToInsertAt - 1).views.listPaneRow.$el);
				//insert after element n-1
			}
		},

		removePerson: function(person){
			person.views.listPaneRow.remove();
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

			var peopleToHide = (tagsToShow != null)
				? this.collection.filter(function(person){
						var personTags = person.get('tags');
						return !personTags || !personTags.length || _.intersection(personTags, tagsToShow).length === 0;
					})
				: [];

			this.ol.children().removeClass('filtered_tag');
			_.each(peopleToHide, function(personToHide){
				var view = personToHide.views.listPaneRow;
				view.$el.addClass('filtered_tag');
			});
		},

		onRowClick: function(event){
			var model = $(event.currentTarget).data('model');
			if(!model){
				model = new this.collection.model();
				// model.views = {};
				// model.views.listPaneRow = 
			}
			mediator.publish("activatePerson", model, { skipListScroll: true });
		},

		onActivatePersonConfirmed: function(person, opts){
			var rowViewEl;

			if(person.views){
				rowViewEl = person.views.listPaneRow.$el;
			} else {
				rowViewEl = this.ol.children().first();
			}

			rowViewEl
				.addClass('active')
				.siblings().removeClass('active');
			
			if(!opts.skipListScroll){
				var twoPeopleUpEl = rowViewEl.prev().prev().add(rowViewEl).get(0);
				twoPeopleUpEl && twoPeopleUpEl.scrollIntoView();
			}
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

			this.model.on('change:fullname', this.render);
			this.model.on('change:photo', this.renderPhoto);

			this.$el.data('model', this.model);
		},

		render: function(){
			var fullname = this.model.get('fullname');

			if(this.$el.is(':empty')){
				this.photoImg = $('<img>');
				this.renderPhoto(this.model, this.model.getPhotoPath());
				this.$el.append(this.photoImg);

				this.nameEl = $('<div>', {
					class: 'name'
				});
				this.$el.append(this.nameEl);
			}

			this.$('img').attr('alt', fullname);
			this.nameEl.text(fullname);

			return this.el;
		},

		renderPhoto: function(person, photoPath){
			this.photoImg.attr('src', photoPath);
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
				this.textField = $('<input>', { type: 'text', placeholder: 'Search', class: 'query', autocomplete: 'off', value: '' });
				this.$el.append(this.textField);
			}
			return this.el;
		},

		changeQuery: _.throttle(function(event){
			mediator.publish('change:query', event.target.value);
		}, 50)
	});

	var TAG_NAMES = {
		'biz'  : "Business Development",
		'des'  : "Design",
		'eng'  : "Engineering",
		'exe'  : "Executive",
		'fin'  : "Finance",
		'g&a'  : "General and Administrative Expense",
		'hr'   : "Human Resources",
		'it'   : "Information Technology",
		'mkt'  : "Marketing",
		'ops'  : "Operations",
		'pm'   : "Product Management",
		'qa'   : "Quality Assurance",
		'sale' : "Sales",
		'succ' : "Customer Success",
		'supp' : "Customer Support"
	};

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
				.filter(function(tagFilterState){
					return !tagFilterState.tagGridEl;
				})
				.each(function(tagFilterState){
					var tagEl = $('<a>')
						.attr({
							href  : '#',
							title : 'show/hide '+TAG_NAMES[tagFilterState.tagName] || tagFilterState.tagName
						})
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

			/*
			 * If we were showing all people, then clicking will first hide all people, so the following common logic can show only one tag
			 */
			if(!this._isAnyTagFiltered()){ //case c
				_.each(this.filterState, function(tagFilterState){
					tagFilterState.isFiltered = true;
				});
			}

			var tagFilterState = this.filterState[$(event.currentTarget).data('tagName')];
			tagFilterState.isFiltered = !tagFilterState.isFiltered;

			/*
			 * If no people would be shown, then show everybody
			 */
			if(this._isEveryTagFiltered()){ //case b
				_.each(this.filterState, function(tagFilterState){
					tagFilterState.isFiltered = false;
				});
			}

			this.render();

			/*
			 * For this event, tagsToShow = null means show everybody, and tagsToShow = [] means show nobody
			 */
			mediator.publish("filterByTag", {
				tagsToShow: (this._isAnyTagFiltered())
					? _(this.filterState)
						.where({ isFiltered: false })
						.pluck('tagName')
						.value()
					: null
			});
		},

		_isAnyTagFiltered: function(){
			return _.any(this.filterState, 'isFiltered');
		},

		_isEveryTagFiltered: function(){
			return _.all(this.filterState, 'isFiltered');
		}
	});

	var OfficeGrid = Backbone.View.extend({

		tagName: 'nav',

		initialize: function(){
			_.bindAll(this);
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.$el.append(
					$('<a>', { href: 'mv', title: 'view the Mountain View office', text: 'mv' }),
					$('<a>', { href: 'oc', title: 'view the Orange County office', text: 'oc' }),
					$('<a>', { href: 'sf', title: 'view the San Francisco office', text: 'sf' }),
					$('<a>', { href: 'ln', title: 'view the London office', text: 'ln' }),
					$('<a>', { href: 'blr', title: 'view the Bangalore office', text: 'blr' }),
					$('<a>', { href: 'aus', title: 'view Australia', text: 'aus' }),
					$('<a>', { href: 'remote', title: 'view remote workers', text: 'rm' })
				);
			}

			if(typeof floorplanParams != 'undefined'){
				this.$('a')
					.filter(function(){
						return ($(this).attr('href') == floorplanParams.officeId) ||
							(_.contains(['mv2', 'mv3'], floorplanParams.officeId) && $(this).attr('href') == 'mv');
					})
					.addClass('active');
			}

			return this.el;
		}
	});

	return ListPane;

})();
