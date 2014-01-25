this.PersonDetailsView = (function(){

	var PersonDetailsView = Backbone.View.extend({

		className: "personDetailsView detailsView",

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

				this.$el.show();
			} else {
				this.$el.hide();
			}

			return this.el;
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