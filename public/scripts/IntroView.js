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
			address: '8th Floor, Vector\nPrestige Tech Park\nOuter Ring Road\nMarathahalli\nBangalore, Karnataka\n560037',
			mapsUrl: 'https://maps.google.com/maps?q=Prestige+Tech+Park&hl=en&ll=12.943334,77.691879&spn=0.353671,0.528374&cid=827535592612612169&gl=US&t=m&z=12&iwloc=A',
			yelpId: null
		},
		ln: {
			address: 'Liberty House\n222 Regent Street\nLondon\nW1B 5TR',
			mapsUrl: 'https://maps.google.com/maps?q=Liberty+House+222+regent+St.+London+W1B+5TR&hl=en&ll=51.513817,-0.140119&spn=0.028951,0.066047&hnear=W+S+M+B+C+Liberty+House,+222+Regent+St,+London+W1B+5TR,+United+Kingdom&t=m&z=15',
			yelpId: null
		},
		remote: {
			address: "Remote workers",
			mapsUrl: null,
			yelpId: null
		}
	};
	OFFICES.mv2 = OFFICES.mv;
	OFFICES.mv3 = _.extend({}, OFFICES.mv, { address: '520 Clyde Avenue\nMountain View, CA 94043' });

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
							window.open('http://www.yelp.com/biz/'+office.yelpId);
						});
					this.$el.append(ratingEl);

					this.renderRating(office.yelpId);
				}
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
