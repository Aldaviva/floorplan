this.Editor = (function(){
	
	var Editor = Backbone.View.extend({
		
		events: {
			"click [type=submit]": "save",
			"change input": "onDirtyChange",
			"keyup input": function(){ this.renderFormControls(true); },
			"click .contact .view_profile": "viewLinkedInProfile"
		},

		initialize: function(){
			_.bindAll(this);
			mediator.subscribe("activatePerson", this.onActivatePerson);
		},

		fieldVal: function(name, value){
			var target = this.$('input[name='+name+']');

			if(arguments.length == 2){
				if(target.is(':radio')){
					target.val([value]);
				} else {
					target.val(value);
				}

			} else if(arguments.length == 1) {
				var attributeValue;
				if(target.is(':checkbox')){
					attributeValue = _.map(target.filter(':checked'), function(item){
						return $(item).val();
					});
				} else if(target.is(':radio')) {
					attributeValue = target.filter(':checked').val();
				} else {
					attributeValue = target.val();
				}

			}

		},

		render: function(){
			if(this.model){
				_(['fullname', 'title', 'desk', 'mobilePhone', 'workPhone', 'tags', 'office']).forEach(function(fieldName){
					var target = this.$('input[name='+fieldName+']');
					var value = this.model.get(fieldName);

					if(target.is(':radio')){
						target.val([value]);
					} else {
						target.val(value);
					}
				}, this);

				var linkedInId = this.model.get('linkedInId');
				var linkedInComplete = 'linkedin.com/profile/view?id='+linkedInId;
				this.fieldVal('linkedInId', (linkedInId) ? linkedInComplete : '');
				this.$('.contact .view_profile')
					.attr('href', (linkedInId) ? ('http://www.linkedin.com/profile/view?id='+linkedInId) : '#')
					.toggle(!!linkedInId);

				var emailLocalPart = this.model.get('email');
				var emailComplete = emailLocalPart + ((emailLocalPart||'').indexOf('@') == -1 ? '@bluejeans.com' : '');
				this.fieldVal('email', (emailLocalPart) ? emailComplete : '');

				this.$('.photo img').attr('src', this.model.getPhotoPath());
			}

			this.$el.toggle(!!this.model);
			this.renderFormControls();
		},

		onActivatePerson: function(model){
			this.model = model;
			this.render();
			window.scrollTo(0,0);
		},

		save: function(event){
			event.preventDefault();
			// alert(JSON.stringify(this.model.toJSON()));
			this.renderFormControls(false);
			if(this.model.isNew()){
				this.collection.create(this.model, { success: this.onSave });
			} else {
				this.model.save({}, { success: this.onSave });
			}
		},

		onSave: function(result){
			this.render();
		},

		onDirtyChange: function(event){
			var changeSet = {};
			var currentTarget = $(event.currentTarget);
			var attributeName = currentTarget.attr('name');
			var attributeValue;

			if(attributeName == 'linkedInId'){
				var matches = currentTarget.val().match(/linkedin\.com\/profile\/view\?id=(\d+)/);
				attributeValue = (matches) ? matches[1] : null;
			} else if(attributeName == 'email'){
				attributeValue = currentTarget.val().replace(/@((bluejeansnet\.com)|(bjn\.vc)|(bluejeans\.((com)|(vc)|(net))))$/, '');
			} else if(currentTarget.is(':checkbox')){
				attributeValue = _.map(this.$('input[name='+attributeName+']:checked'), function(item){ return $(item).val(); });
			} else if(currentTarget.is(':radio')) {
				attributeValue = this.$('input[name='+attributeName+']:checked').val();
			} else {
				attributeValue = currentTarget.val();
				
				if(attributeValue === ''){
					attributeValue = null;
				}
			}

			changeSet[attributeName] = attributeValue;
			this.model.set(changeSet);
			console.log(JSON.stringify(this.model.changedAttributes() || "no change (model is identical)"));
			this.render(); //update coerced values
		},

		renderFormControls: function(isForceEnabled){
			var isEnabled = (_.isBoolean(isForceEnabled)) ? isForceEnabled : this.model.hasChanged();
			var saveButton = this.$('.formControls [type=submit]');

			if(isEnabled){
				saveButton.removeAttr('disabled');
			} else {
				saveButton.attr('disabled', 'disabled');
			}
		}
	});

	return Editor;

})();