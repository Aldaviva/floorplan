this.DetailsPane = (function(){
	
	var OFFICES = {
		mv: {
			address: '516 Clyde Avenue\nMountain View, CA 94043',
			mapsUrl: 'https://maps.google.com/maps?q=Blue+Jeans+Network&hl=en&ll=37.398528,-122.046776&spn=0.270018,0.528374&cid=14115605422088510097&gl=US&t=m&z=12',
			yelpId: 'bluejeans-mountain-view'
		},
		sf: {
			address: '625 2nd Street\nSuite 104\nSan Francisco, CA 94107',
			mapsUrl: 'https://maps.google.com/maps?q=625+2nd+Street+%23104,+San+Francisco,+CA+94107&hl=en&ll=37.781366,-122.391386&spn=0.066887,0.132093&sll=37.781358,-122.391386&sspn=0.066887,0.132093&hnear=625+2nd+St+%23104,+San+Francisco,+California+94107&t=m&z=14&iwloc=A',
			yelpId: null
		},
		oc: {
			address: '3333 Michelson Drive\nSuite 700\nIrvine, CA 92612',
			mapsUrl: 'https://maps.google.com/maps?q=3333+Michelson+Drive,+Suite+700,+Irvine,+CA+92612&hl=en&ll=33.672926,-117.843475&spn=1.131436,2.113495&sll=33.916327,-118.105384&sspn=1.128228,2.113495&t=m&hnear=3333+Michelson+Dr+%23700,+Irvine,+Orange,+California+92612&z=10',
			yelpId: null
		},
		blr: {
			address: '', //TODO fill this in once we know what the street address of the bangalore office is
			mapsUrl: null, //TODO fill in according to street address
			yelpId: null
		}
	};

	var DetailsPane = Backbone.View.extend({
		initialize: function(){
			_.bindAll(this);

			mediator.subscribe("activatePersonConfirmed", function(person, opts){
				this.els.intro.hide();
				this.els.content.show();
				this.trigger('change:model', person, opts);
			}, {}, this);

			this.on('change:model', this.setModel);

			this.els = {};
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.$el.addClass(floorplanParams.officeId);
				var office = OFFICES[floorplanParams.officeId];

				var intro = this.els.intro = $('<div>', { class: 'intro' });
				intro.append($('<h2>', { text: 'Blue Jeans' }));
				intro.append($('<h3>', { class: 'address' }).append($('<a>', {
					text   : office.address,
					title  : "View in Google Maps",
					href   : office.mapsUrl || '#',
					target : '_blank'
				})));

				if(office.yelpId){
					this.els.rating = $('<div>', { class: 'rating' })
						.click(function(){
							window.open('http://www.yelp.com/biz/bluejeans-mountain-view');
						});
					intro.append(this.els.rating);
				}


				var content = this.els.content = $('<div>', { class: 'content' });

				this.els.photo = $('<img>', { class: 'photo' });
				this.els.name  = $('<h2>',  { class: 'name' });
				this.els.title = $('<h3>',  { class: 'title' });

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
					href: 'mailto:floorplan@bluejeans.com',
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
		},

		toggleIntro: function(shouldShow){
			this.els.intro.toggle(!!shouldShow);
			this.els.content.toggle(!shouldShow);
		}
	});

	function formatPhoneNumber(phoneNumber){
		if(phoneNumber){
			return phoneNumber.replace(/[\(\)]/g, '').replace(/[\.]/g, '-');
		} else {
			return phoneNumber;
		}
	}

	return DetailsPane;

})();