this.Editor = (function(){
	
	var Editor = Backbone.View.extend({
		
		events: {
			"click input[type=submit]": "save",
			"change input": "onDirtyChange"
		},

		initialize: function(){
			_.bindAll(this);
			mediator.subscribe("activatePerson", this.onActivatePerson);
		},

		render: function(){
			if(this.model){
				_(['fullname', 'title', 'desk', 'email', 'linkedInId', 'mobilePhone', 'workPhone', 'tags', 'office']).forEach(function(fieldName){
					var target = this.$('input[name='+fieldName+']');
					var value = this.model.get(fieldName);

					if(target.is(':radio')){
						target.val([value]);
					} else {
						target.val(value);
					}
				}, this);

				this.$('img.photo').attr('src', this.model.getPhotoPath());
			}

			this.$el.toggle(!!this.model);
			this.onDirtyChange();
		},

		onActivatePerson: function(model){
			this.model = model;
			this.render();
		},

		save: function(event){
			event.preventDefault();
			alert(JSON.stringify(this.model.toJSON()));
			/*if(this.model.isNew()){
				this.collection.create(this.model, { success: this.onSave });
			} else {
				this.model.save({}, { success: this.onSave });
			}*/
		},

		onSave: function(result){
			this.onDirtyChange();
		},

		onDirtyChange: function(event){
			if(event){
				var changeSet = {};
				var currentTarget = $(event.currentTarget);
				var attributeName = currentTarget.attr('name');
				var attributeValue;

				if(currentTarget.is(':checkbox')){
					attributeValue = _.map(this.$('input[name='+currentTarget.attr('name')+']:checked'), function(item){ return $(item).val(); });
				} else if(currentTarget.is(':radio')) {
					attributeValue = this.$('input[name='+currentTarget.attr('name')+']:checked').val();
				} else {
					attributeValue = currentTarget.val();
				}

				changeSet[attributeName] = attributeValue;
				this.model.set(changeSet);
				console.log(JSON.stringify(this.model.changedAttributes()));
			}
			this.$('.formControls').toggle(!!this.model.hasChanged()); //suspicious of this logic
		}
	});

	return Editor;

})();