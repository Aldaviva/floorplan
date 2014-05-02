this.PersonDetailsView = (function(){

	var MAX_ACCOLADE_MESSAGE_LENGTH = 70;
	var ACCOLADES_BASE_URL = "http://skadi.bluejeansnet.com:8087/accolades";

	var PersonDetailsView = Backbone.View.extend({

		className: "personDetailsView detailsView",

		events: function(){
			return {
				"click .accolades": "onAccoladesLinkClick",
				"keyup .accolades .message": "updateAccoladesMessageCharsRemaning",
				"click .accolades .closeLink": "closeAccolades",
				"click .accolades .submit": _.debounce(this.submitAccolades, 500, { leading: true, trailing: false })
			};
		},

		initialize: function(){
			_.bindAll(this);

			this.els = {};
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.els.photo = $('<img>', { class: 'photo' });
				this.els.name  = $('<h2>',  { class: 'name' });
				this.els.title = $('<h3>',  { class: 'title' });

				this.$el.append(this.els.photo);
				this.$el.append(this.els.name);
				this.$el.append(this.els.title);

				this.els.email = $('<a>');
				this.els.linkedInProfile = $('<a>', { text: 'view profile', target: '_blank' });
				this.els.workPhone = $('<dd>');
				this.els.mobilePhone = $('<dd>');

				var dl = $('<dl>');

				dl.append($('<dt>', { text: 'Email' }));
				dl.append($('<dd>').append(this.els.email));

				dl.append($('<dt>', { text: 'LinkedIn' }));
				dl.append($('<dd>').append(this.els.linkedInProfile));

				dl.append($('<dt>', { text: 'Mobile' }));
				dl.append(this.els.mobilePhone);

				dl.append($('<dt>', { text: 'Work' }));
				dl.append(this.els.workPhone);

				this.$el.append(dl);

				this.els.accoladesForm = $('<form>', { class: 'accolades' }).append(
					$('<h4>', { 
						title: "Great job on that thing you did. Really super.",
						text: "Give recognition"
					}).append(
						$("<a>", { text: "×", class: 'closeLink', title: 'Close recognition and go back to person details' })
					),
					$('<textarea>', { class: 'message', placeholder: 'Type praise here', autocomplete: "off" }),
					$('<input>', { type: 'text', class: 'fromName', placeholder: 'Your name', autoComplete: "off" }),
					$('<a>', { href: '#', class: 'submit', text: 'Send' }).append(
						$('<span>', { class: 'charsRemaining', title: 'Your message can be at most '+MAX_ACCOLADE_MESSAGE_LENGTH+' characters long.' })
					)
				);

				this.$el.append(this.els.accoladesForm);
			}

			if(this.model){
				this.els.photo.attr('src', this.model.getPhotoPath());
				this.els.name.text(this.model.get('fullname'));
				this.els.title.text(this.model.get('title') || '');

				var email = this.model.get('email');
				this.els.email
					.attr('href', 'mailto:'+email+((email||'').indexOf('@') == -1 ? '@bluejeans.com' : ''))
					.text(email)
					.closest('dd').prev('dt').addBack().toggle(!!email);

				this.els.linkedInProfile
					.attr('href', 'http://www.linkedin.com/profile/view?id='+this.model.get('linkedInId'))
					.closest('dd').prev('dt').addBack().toggle(!!this.model.get('linkedInId'));

				this.els.mobilePhone
					.text(formatPhoneNumber(this.model.get('mobilePhone')))
					.prev('dt').addBack().toggle(!!this.model.get('mobilePhone'));

				this.els.workPhone
					.text(formatPhoneNumber(this.model.get('workPhone')))
					.prev('dt').addBack().toggle(!!this.model.get('workPhone'));

				this.updateAccoladesMessageCharsRemaning();

				this.$el.show();
			} else {
				this.$el.hide();
			}

			return this.el;
		},

		updateAccoladesMessageCharsRemaning: function(event){
			var charsRemaining = this.getAccoladesCharsRemaining();
			var charsRemainingEl = this.els.accoladesForm.find('.charsRemaining');
			charsRemainingEl
				.text(charsRemaining)
				.toggleClass('negative', charsRemaining < 0);
		},

		getAccoladesCharsRemaining: function(){
			var messageEl = this.els.accoladesForm.find('.message');
			var charsRemaining = MAX_ACCOLADE_MESSAGE_LENGTH - messageEl.val().length;
			return charsRemaining;
		},

		onAccoladesLinkClick: function(event){
			event.preventDefault();
			if(!this.accoladesMode()){
				this.accoladesMode(true);
			}
		},

		closeAccolades: function(event){
			event.preventDefault();
			event.stopPropagation();
			this.accoladesMode(false);
		},

		submitAccolades: function(event){
			event.preventDefault();
			var form = this.els.accoladesForm;

			var accolade = {
				fromName: $('.fromName', form).val(),
				message: $('.message', form).val(),
				recipientId: this.model.id,
				recipientName: this.model.get('fullname')
			};

			var isMessageValid = (accolade.message.length > 0) && (accolade.message.length <= MAX_ACCOLADE_MESSAGE_LENGTH);
			var isFromNameValid = accolade.fromName.length > 0;

			if(!isMessageValid){
				this.onInvalidAccolade("Message must be "+MAX_ACCOLADE_MESSAGE_LENGTH+" characters or less.");
			} else if(!isFromNameValid){
				this.onInvalidAccolade("Your name is required.");
			} else {
				store.set('accolades.fromName.mru', accolade.fromName);
				$.ajax({
					url         : ACCOLADES_BASE_URL+"/api/accolades",
					type        : 'POST',
					data        : JSON.stringify(accolade),
					contentType : 'application/json',
					success     : _.bind(function(){
						this.accoladesMode(false);
						window.alert("Your recognition has been successfully sent, and is now waiting for approval from HR.");
					}, this),
					error       : function(jqXhr, textStatus, error){
						console.error("Failed to send recognition", {
							error: error,
							textStatus: textStatus,
							jqXhr: jqXhr
						});
						window.alert("Failed to send recognition:\n"+textStatus+"\n\nPlease yell at ben@bluejeans.com");
					}
				});
			}
		},

		onInvalidAccolade: function(reason){
			window.alert(reason);
		},

		accoladesMode: function(shouldEnable){
			if(shouldEnable === undefined){
				return this.$el.hasClass('accoladesMode');
			} else {
				this.els.accoladesForm.find('.message').val('');
				var fromName = store.get('accolades.fromName.mru') || "";
				this.els.accoladesForm.find('.fromName').val(fromName);
				
				this.$el.toggleClass('accoladesMode', !!shouldEnable);
				this.render();
			}
		}
	});

	function formatPhoneNumber(phoneNumber){
		if(phoneNumber){
			return phoneNumber.replace(/[\(\)]/g, '').replace(/[\.]/g, '-');
		} else {
			return phoneNumber;
		}
	}

	return PersonDetailsView;

})();