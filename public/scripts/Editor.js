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

			this.photoData = null;
			this.initPhotoUploadControl();
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

				this.renderPhoto();
			}

			this.$el.toggle(!!this.model);
			this.renderFormControls();
		},

		/**
		 * @param canvas optional HTMLCanvasElement to be rendered instead of the official JPEG
		 */
		renderPhoto: function(canvas){
			//only use the server JPEG if we get no arguments and there is no pending photo upload
			if(!canvas && !this.photoData){
				var imgEl = this.photoUploadControl.find('img');
				if(!imgEl.length){
					imgEl = $('<img>');
					this.photoUploadControl.find('canvas').remove();
					this.photoUploadControl.prepend(imgEl);
				}

				imgEl.attr('src', this.model.getPhotoPath());

			} else if(_.isElement(canvas) && canvas.nodeName == 'CANVAS'){
				this.photoUploadControl.find('canvas, img').remove();
				this.photoUploadControl.prepend(canvas);
			}
		},

		onActivatePerson: function(model){
			this.clearPendingUploads();

			this.model = model;
			this.updatePhotoUploadUrl();

			this.render();
			window.scrollTo(0,0);
		},

		save: function(event){
			event.preventDefault();
			this.renderFormControls(false);
			console.log("user hit Save, disabling form controls");

			if(this.model.isNew()){
				this.collection.create(this.model, { success: this.onSave });
			} else {
				this.model.save({}, { success: this.onSave });
			}
		},

		onSave: function(result){
			this.updatePhotoUploadUrl();
			this.photoData && this.photoData.submit();

			console.log("save completed, submitting photo upload and immediately rendering");
			this.render();
		},

		onDirtyChange: function(event){
			var changeSet = {};
			var currentTarget = $(event.currentTarget);
			var attributeName = currentTarget.attr('name');
			var attributeValue;

			var validity = currentTarget[0].validity;
			if(validity.valid){
				this.$('.validationMessage').hide();

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
				// console.log(JSON.stringify(this.model.changedAttributes() || "no change (model is identical)"));
				this.render(); //update coerced values

			} else {
				this.$('.validationMessage').text(currentTarget.data('validation-failed-message')).show();
			}

			currentTarget.closest('label').toggleClass('invalid', !validity.valid);
		},

		renderFormControls: function(isForceEnabled){
			var isValid = this.el.checkValidity();

			var isEnabled = isValid && (_.isBoolean(isForceEnabled))
				? isForceEnabled
				: (this.model.hasChanged() || (this.photoData && this.photoData.state() != 'pending'));

			var saveButton = this.$('.formControls [type=submit]');

			if(isEnabled){
				saveButton.removeAttr('disabled');
			} else {
				saveButton.attr('disabled', 'disabled');
			}
		},

		initPhotoUploadControl: function(){
			this.photoUploadControl = this.$('.photo');
			var photoPreviewSize = this.photoUploadControl.find('img').width();

			this.photoUploadControl
				.fileupload({
					dataType              : 'json',
					autoUpload            : false,
					paramName             : 'photo',
					previewMaxWidth       : photoPreviewSize,
					previewMaxHeight      : photoPreviewSize,
					previewCrop           : true
				})
				.on({
					fileuploadadd         : this.onPhotoAdded,
					fileuploadfail        : this.onPhotoUploadFailure,
					fileuploaddone        : this.onPhotoUploadSuccess,
					fileuploadprocessdone : this.onPhotoPreviewReady
				});
		},

		clearPendingUploads: function(){
			this.photoData && this.photoData.abort();
			this.photoData = null;
		},

		onPhotoAdded: function(event, data){
			this.clearPendingUploads();
			this.photoData = data;
			this.renderFormControls();
		},

		onPhotoUploadFailure: function(event, data){
			console.error(data.errorThrown);
			console.error(data.jqXHR.responseText);
		},

		onPhotoUploadSuccess: function(event, data){
			this.clearPendingUploads();
			this.renderFormControls();

			console.info("Finished uploading "+data.files[0].name + " to "+data.result.files[0].url);

			var photoPath = this.model.getPhotoPath();
			$.get(photoPath)
				.done(_.bind(function(){
					this.renderPhoto();

					//hax to get all stale photos on the page to apply newly xhr-cached image
					$('img[src="'+photoPath+'"]').attr('src', photoPath);
				}, this));
		},

		onPhotoPreviewReady: function(event, data){
			var file = data.files[data.index];

			if(file.preview){
				this.renderPhoto(file.preview);
			}
		},

		updatePhotoUploadUrl: function(){
			try {
				this.photoUploadControl.fileupload('option', 'url', this.model.url() + '/photo');
			} catch (err){
				//we have loaded a new person with no id
				//ignore this error, because before we upload their photo, the model will have been saved to the server, it will have an id, and this method will have been run again to get the real value
			}
		}
	});

	return Editor;

})();