this.DetailsPane = (function(){
	
	var DetailsPane = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this);

			mediator.subscribe("activatePerson", _.partial(this.trigger, 'change:model'));			
			this.on('change:model', this.setModel);

			this.els = {};
		},

		render: function(){
			if(this.$el.is(':empty')){
				var intro = $('<div>', { class: 'intro' });
				intro.append($('<h2>', { text: 'welcome to blue jeans floorplan' }));


				var content = $('<div>', { class: 'content' });

				this.els.photo = $('<img>', { class: 'photo' });
				this.els.name = $('<div>' , { class: 'name' });
				this.els.title = $('<div>' , { class: 'title' });

				content.append(this.els.photo);
				content.append(this.els.name);
				content.append(this.els.title);

				var dl = $('<dl>');
				this.els.email = $('<a>');
				this.els.linkedInProfile = $('<a>', { text: 'view profile', target: '_blank' });
				this.els.workPhone = $('<dd>');
				this.els.mobilePhone = $('<dd>');

				dl.append($('<dt>', { text: 'Email' }));
				dl.append($('<dd>').append(this.els.email));

				dl.append($('<dt>', { text: 'LinkedIn' }));
				dl.append($('<dd>').append(this.els.linkedInProfile));

				dl.append($('<dt>', { text: 'Mobile' }));
				dl.append(this.els.mobilePhone);

				dl.append($('<dt>', { text: 'Work' }));
				dl.append(this.els.workPhone);

				content.append(dl);

				var correctionsLink = $('<a>', {
					class: 'corrections',
					href: 'mailto:ben@bluejeans.com?subject='+encodeURIComponent("I have a suggestion for the floorplan"),
					text: 'Suggest a correction'
				});

				this.$el.append(intro);
				this.$el.append(content);
				this.$el.append(correctionsLink);
			}

			if(this.model){
				this.els.photo.attr('src', this.model.getPhotoPath());
				this.els.name.text(this.model.get('fullname'));
				this.els.title.text(this.model.get('title') || '');
				this.els.email
					.attr('href', 'mailto:'+this.model.get('email')+(this.model.get('email').indexOf('@') == -1 ? '@bluejeans.com' : ''))
					.text(this.model.get('email'))
					.closest('dd').prev('dt').addBack().toggle(!!this.model.get('email'));
				this.els.linkedInProfile
					.attr('href', 'http://www.linkedin.com/profile/view?id='+this.model.get('linkedInId'))
					.closest('dd').prev('dt').addBack().toggle(!!this.model.get('linkedInId'));
				this.els.mobilePhone
					.text(formatPhoneNumber(this.model.get('mobilePhone')))
					.prev('dt').addBack().toggle(!!this.model.get('mobilePhone'));
				this.els.workPhone
					.text(formatPhoneNumber(this.model.get('workPhone')))
					.prev('dt').addBack().toggle(!!this.model.get('workPhone'));
			}

			this.$el.toggleClass('hasModel', !!this.model);

			return this.el;
		},

		setModel: function(model){
			this.model = model;
			this.render();
		}
	});

	function formatPhoneNumber(phoneNumber){
		if(phoneNumber){
			return phoneNumber.replace(/[\(\)]/g, '').replace(/[ \.]/g, '-');
		} else {
			return phoneNumber;
		}
	}

	return DetailsPane;

})();