this.Editor = (function(){
	
	var Editor = Backbone.View.extend({
		
		events: {
			"click [type=submit]": "save",
			"change input": "onDirtyChange",
			"keyup input": function(){ this.renderFormControls(true); },
			"click .contact .view_profile": "viewLinkedInProfile",
			"click .basics .remove": "removePerson",
			"click .desk.helper_link": "enlargeMap"
		},

		initialize: function(){
			_.bindAll(this);

			var officeIds = this.$('.office input[type=radio]').map(function(){ return $(this).attr('value'); });
			this.maps = _.zipObject(officeIds, _.map(officeIds, function(officeId){
				return new Map({
					el: $('.map.'+officeId)[0],
					collection: data.people,
					office: officeId,
					skipFilters: true,
					skipEndpoints: true
				});
			}));

			mediator.subscribe("activatePersonConfirmed", this.onActivatePersonConfirmed);
			mediator.subscribe("activatePerson", this.onActivatePerson);
			mediator.subscribe("map:clickDesk", this.onClickDesk);

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
				this.$('.contact .search')
					.attr('href', 'http://www.linkedin.com/vsearch/p?keywords='+encodeURIComponent(this.model.get('fullname'))+'&openAdvancedForm=true')
					.toggle(!linkedInId && !!this.model.get('fullname'));

				var emailLocalPart = this.model.get('email');
				var emailComplete = emailLocalPart + ((emailLocalPart||'').indexOf('@') == -1 ? '@bluejeans.com' : '');
				this.fieldVal('email', (emailLocalPart) ? emailComplete : '');

				this.$('.basics .remove').toggle(!this.model.isNew());
				this.$('.seatChooser').toggle(!!this.model.get('office'));

				this.renderPhoto();

				_.each(this.maps, function(mapView){
					var isMapOfPersonsOffice = (mapView.options.office == this.model.get('office'));
					mapView.$el.toggle(isMapOfPersonsOffice);
					if(isMapOfPersonsOffice){
						this.map = mapView;
					}
				}, this);
				
				this.renderFormControls();

				var office = this.model.get('office') || '';
				$('.goToFloorplan').attr('href', '../' + office);
			}

			this.$el.toggle(!!this.model);
			_.each(this.maps, function(mapView){
				mapView.render();
			});
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

		onActivatePerson: function(newModel, opts){
			//a hack, but i don't want to save more state
			if(this.$('.formControls [type=submit]').attr('disabled')){
				//model and photo are saved, nothing to do here
				mediator.publish('activatePersonConfirmed', newModel, opts);

			} else if(window.confirm("You have unsaved changes. Are you sure you want to discard these changes?")){
				if(!this.model.isNew()){
					this.model.fetch({ success: function(model){
						model.changed = {}; //model is now synced with server, there are no changes.
					}});
				}
				mediator.publish('activatePersonConfirmed', newModel, opts);
			}
		},

		onActivatePersonConfirmed: function(model){
			this.clearPendingUploads();

			this.model = model;
			this.updatePhotoUploadUrl();
			
			var renderPerson = _.bind(function(){
				model.changed = {}; //model is now synced with server, there are no changes.
				this.render();

				this.$('.validationMessage').hide();
				this.$('.invalid').removeClass('invalid');

				window.scrollTo(0,0);
			}, this);

			if(!model.isNew()){
				model.fetch({
					success: function(){
						renderPerson();
					}
				});
			} else {
				renderPerson();
			}
		},

		save: function(event){
			event.preventDefault();
			this.renderFormControls(false);

			if(this.model.isNew()){
				this.collection.create(this.model, { success: _.bind(function(result){
					this.onSave()
						.then(_.bind(function(){
							mediator.publish('activatePersonConfirmed', this.model);
						}, this));
				}, this)});
			} else {
				this.model.save({}, { success: this.onSave });
			}
		},

		onSave: function(result){
			this.model.changed = {}; //model is now synced with server, there are no changes.
			var deferred = Q.defer();

			this.updatePhotoUploadUrl();
			if(this.photoData){
				this.photoData.submit()
					.complete(_.bind(function(){
						this.render();
						deferred.resolve();
					}, this));
			} else {
				deferred.resolve();
			}

			return deferred.promise;
		},

		onDirtyChange: function(event){
			var changeSet = {};
			var currentTarget = $(event.currentTarget);
			var attributeName = currentTarget.attr('name');
			var attributeValue;

			if(attributeName == 'email' && currentTarget.val().trim() !== '' && currentTarget.val().indexOf('@') === -1){
				currentTarget.val(currentTarget.val() + '@bluejeans.com');
			}

			var validity = currentTarget[0].validity;
			if(validity.valid){
				this.$('.validationMessage').hide();

				if(attributeName == 'linkedInId'){
					var matches = currentTarget.val().match(/linkedin\.com\/profile\/view\?id=([A-Za-z0-9]+)/);
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

				if(attributeName == 'office'){
					changeSet['desk'] = null;
				}

				changeSet[attributeName] = attributeValue;
				this.model.set(changeSet);
				this.render(); //update coerced values. side effect: blows away invalid values

			} else {
				this.$('.validationMessage').text(currentTarget.data('validation-failed-message')).show();
				this.renderFormControls();
			}

			currentTarget.closest('label').addBack().toggleClass('invalid', !validity.valid);
		},

		renderFormControls: function(isForceEnabled){
			var isValid = this.el.checkValidity();

			var isEnabled = isValid && (_.isBoolean(isForceEnabled))
				? isForceEnabled
				: (this.model.hasChanged() || (this.photoData && this.photoData.state() != 'pending'));

			var saveButton = this.$('.formControls [type=submit]');

			if(isEnabled){
				saveButton.removeAttr('disabled');
				/*if(_.isBoolean(isForceEnabled) && isForceEnabled){
					console.log('save button enabled because it was forced on');
				} else if(this.model.hasChanged()){
					console.log('save button enabled because the model has changed', this.model.changedAttributes());
				} else if(this.photoData && this.photoData.state() != 'pending'){
					console.log('save button enabled because a photo was chosen but has yet to start uploading');
				} else {
					console.log('no idea why the save button is enabled');
				}*/
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
			window.alert("Failed to upload photo.\nPlease yell at Ben.\n\nDetails:\n\n"+data.jqXHR.responseText);
		},

		onPhotoUploadSuccess: function(event, data){
			this.clearPendingUploads();
			this.renderFormControls();

			var photoPath = this.model.getPhotoPath();
			$.get(photoPath)
				.done(_.bind(function(){
					this.renderPhoto();
					this.model.trigger('change:photo', this.model, photoPath, {});
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
				var photoUploadUrl = this.model.url() + '/photo';
				this.photoUploadControl.fileupload('option', 'url', photoUploadUrl);
				// console.log("photoUploadUrl = ", photoUploadUrl);
			} catch (err){
				//we have loaded a new person with no id
				//ignore this error, because before we upload their photo, the model will have been saved to the server, it will have an id, and this method will have been run again to get the real value
			}
		},

		removePerson: function(event){
			if(window.confirm("Are you sure you want to permanently delete "+this.model.get('fullname')+'?')){
				this.model.destroy();

				mediator.publish("activatePersonConfirmed", new (this.collection.model)());
			}
		},

		enlargeMap: function(event){
			event.preventDefault();

			var seatChooserLarge = $('.seatChooser.large');
			var mapEl = this.$('.map:visible');

			mapEl
				.prependTo(seatChooserLarge)
				.removeClass('small')
				.addClass('large');

			seatChooserLarge.find('.unassign')
				.toggle(this.model.get('desk') !== null)
				.find('a')
					.off('click')
					.on('click', _.bind(function(event){
						event.preventDefault();
						debugger;
						this.map.renderActiveSeat(null);
						this.onClickDesk(null);
					}, this));

			seatChooserLarge.show();

			$(document.body).css('overflow', 'hidden');

			seatChooserLarge.find('.cancel')
				.off('click')
				.on('click', this.shrinkMap);
		},

		shrinkMap: function(event){
			event && event.preventDefault();
			$('.map.large')
				.prependTo(this.$('.seatChooser.small'))
				.removeClass('large')
				.addClass('small');
			$('.seatChooser.large').hide();
			$(document.body).css('overflow', '');
		},

		onClickDesk: function(deskId){
			this.model.set({ desk: deskId });
			this.renderFormControls();
			this.shrinkMap();
		}
	});

	return Editor;

})();