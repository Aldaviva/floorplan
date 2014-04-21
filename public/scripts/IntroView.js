this.IntroView = (function(){

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
			address: 'Xylem Tech Park\n5th Floor\nUnit 501 and 502\nWhite Field Road\nDevasandra Extension\nMahadevapura\nBangalore\nKarnataka\n560048',
			mapsUrl: 'https://www.google.com/maps?source=embed&near=International+Technology+Park+Bangalore,+1st+Floor,+Innovator+Building,+Whitefield+Road,+Bangalore,+Karnataka+560066,+India&geocode=CZMgqS6v0udsFW4mxgAd5SeiBCkzTpso5RGuOzFPgVFRu2mhtA&q=xylem&f=l&dq=Xylem+Tech+Park,+Bangalore&sll=12.985966,77.735909&sspn=0.295278,0.286308&ie=UTF8&hq=xylem&hnear=&ll=12.994438,77.701664&spn=0.015974,0.032787&z=14&iwloc=A&vpsrc=0&oi=map_misc&ct=api_logo',
			yelpId: null
		},
		remote: {
			address: "Remote workers",
			mapsUrl: null,
			yelpId: null
		}
	};

	var IntroView = Backbone.View.extend({

		className: 'intro',

		initialize: function(){
			_.bindAll(this);
		},

		render: function(){
			if(this.$el.is(':empty')){
				this.$el.addClass(floorplanParams.officeId);
				var office = OFFICES[floorplanParams.officeId];

				this.$el.append($('<h2>', { text: 'Blue Jeans' }));
				
				if(office.address){
					var addressEl = $('<h3>', { class: 'address' });
					if(office.mapsUrl){
						addressEl.append($('<a>', {
							text   : office.address,
							title  : "View in Google Maps",
							href   : office.mapsUrl,
							target : '_blank'
						}));
					} else {
						addressEl.text(office.address);
					}
					this.$el.append(addressEl);
				}

				if(office.yelpId){
					var ratingEl = $('<div>', { class: 'rating' })
						.click(function(){
							window.open('http://www.yelp.com/biz/bluejeans-mountain-view');
						});
					this.$el.append(ratingEl);
				}

				office.yelpId && this.renderRating(office.yelpId);
			}

			return this.el;
		},

		renderRating: function(yelpId){
			yelp.getRating(yelpId)
				.then(_.bind(function(rating){
					this.$('.rating')
						.css('background-position', '-2px '+(-3 - 18*2*(rating.stars-.5))+'px')
						.attr('title', rating.stars + ' stars on Yelp\n('+rating.reviews+' reviews)');
				}, this));
		}
	});

	return IntroView;

})();