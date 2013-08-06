this.Editor = (function(){
	
	var Editor = Backbone.View.extend({
		
		events: {
			"click .save": "save",
			"change input": "onDirtyChange"
		},

		initialize: function(){
			_.bindAll(this);
			mediator.subscribe("activatePerson", onActivatePerson);
		},

		render: function(){
			if(this.model){
				_(['fullname', 'title', 'office', 'desk', 'email', 'linkedInId', 'mobilePhone', 'workPhone', 'tags']).forEach(function(fieldName){
					this.$('input[name='+fieldName']').val(this.model.get(fieldName));
				});

				this.$('.photo').attr('src', this.model.getPhotoPath());
			}

			this.$el.toggle(!!this.model);
		},

		onActivatePerson: function(model){
			this.model = model;
			this.render();
		},

		save: function(event){
			if(this.model.isNew()){
				this.collection.create(this.model, { success: this.onSave });
			} else {
				this.model.save({}, { success: this.onSave });
			}
		},

		onSave: function(result){
			this.setDirty(false);
		},

		onDirtyChange: function(event){
			if(event){
				var changeSet = {};
				var currentTarget = $(event.currentTarget);
				var attributeName = currentTarget.attr('name');
				changeSet[attributeName] = currentTarget.val();

				this.model.set(changeSet);
			}
			this.$('.formControls').toggle(this.model.hasChanged);
		}
	});

	return Editor;

})();