this.DetailsPane = (function(){
	
	var OFFICES = {
		mv: {
			address: '516 Clyde Avenue\nMountain View, CA 94043',
			mapsUrl: 'https://maps.google.com/maps?ie=UTF8&cid=14115605422088510097&q=Blue+Jeans+Network&iwloc=A&gl=US&hl=en',
			yelpId: 'bluejeans-mountain-view'
		},
		sf: {
			address: '', //TODO I can't believe I can't find this
			mapsUrl: '',
			yelpId: null
		},
		oc: {
			address: '3333 Michelson Drive\nSuite 700\nIrvine, CA 92612',
			mapsUrl: 'https://maps.google.com/maps?q=3333+Michelson+Drive,+Suite+700,+Irvine,+CA+92612&hl=en&sll=33.916327,-118.105384&sspn=1.128228,2.113495&t=m&z=17&iwloc=A',
			yelpId: null
		}
	}

	var DetailsPane = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this);

			mediator.subscribe("activatePerson", _.partial(this.trigger, 'change:model'));			
			this.on('change:model', this.setModel);

			this.els = {};
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.$el.addClass(floorplanParams.officeId);
				var office = OFFICES[floorplanParams.officeId];

				var intro = $('<div>', { class: 'intro' });
				intro.append($('<h2>', { text: 'Blue Jeans' }));
				intro.append($('<div>', { class: 'address', text: office.address, title: "View in Google Maps" })
					.click(function(){
						window.open(office.mapsUrl);
					}));

				if(office.yelpId){
					this.els.rating = $('<div>', { class: 'rating' })
						.click(function(){
							window.open('http://www.yelp.com/biz/bluejeans-mountain-view');
						});
					intro.append(this.els.rating);
				}


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

				office.yelpId && this.renderRating(office.yelpId);
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
			}

			this.$el.toggleClass('hasModel', !!this.model);

			return this.el;
		},

		setModel: function(model){
			this.model = model;
			this.render();
		},

		renderRating: function(yelpId){
			yelp.getRating(yelpId)
				.then(_.bind(function(rating){
					this.els.rating
						.css('background-position', '-2px '+(-3 - 18*2*(rating.stars-.5))+'px')
						.attr('title', rating.stars + ' stars on Yelp\n('+rating.reviews+' reviews)');
				}, this))
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