this.IntroView = (function(){

	var OFFICES = {
		mv: {
			address: '516 Clyde Avenue\nMountain View, CA 94043',
			mapsUrl: 'https://maps.google.com/maps?q=Blue+Jeans+Network&hl=en&ll=37.398528,-122.046776&spn=0.270018,0.528374&cid=14115605422088510097&gl=US&t=m&z=12',
			yelpId: 'bluejeans-mountain-view'
		},
		sf: {
			address: '625 2nd Street\nSuite 104\nSan Francisco, CA 94107',
			mapsUrl: 'https://maps.google.com/maps?q=625+2nd+Street+%23104,+San+Francisco,+CA+94107&hl=en&ll=37.781366,-122.391386&spn=0.066887,0.132093&sll=37.781358,-122.391386&sspn=0.066887,0.132093&hnear=625+2nd+St+%23104,+San+Francisco,+California+94107&t=m&z=14&iwloc=A'
		},
		oc: {
			address: '5 Park Plaza, Suite 950\nIrvine, CA 92614',
			mapsUrl: 'https://www.google.com/maps/place/5+Park+Plaza+%23950,+Irvine,+CA+92614/@33.6772155,-118.1179949,10z/data=!4m5!3m4!1s0x80dcde86d88895ed:0xf3948c556727c197!8m2!3d33.6771102!4d-117.8378345?hl=en'
		},
		blr: {
			address: '8th Floor, Vector\nPrestige Tech Park\nOuter Ring Road\nMarathahalli\nBangalore, Karnataka\n560037',
			mapsUrl: 'https://maps.google.com/maps?q=Prestige+Tech+Park&hl=en&ll=12.943334,77.691879&spn=0.353671,0.528374&cid=827535592612612169&gl=US&t=m&z=12&iwloc=A'
		},
		ln: {
			address: 'Capital House, 16th Floor\n25 Chapel Street\nLondon, NW1 5DH',
			mapsUrl: 'https://www.google.com/maps/place/Capital+House,+25+Chapel+St,+Marylebone,+London+NW1+5DT,+UK/@51.5197109,-0.1685118,13z/data=!4m2!3m1!1s0x48761ab422d7edfd:0x3c6ea06442d1f88c'
		},
		aus: {
			address: 'Level 21, Tower 2\nDarling Park\n201 Sussex Street\nSydney, NSW 2000\nAustralia',
			mapsUrl: 'https://www.google.com/maps/place/Darling+Park,+201+Sussex+St,+Sydney+NSW+2000,+Australia/@-33.8722552,151.1684283,13z/data=!4m5!3m4!1s0x6b12ae3941cd3af3:0xfa03a95a382386a5!8m2!3d-33.8722597!4d151.2034472'
		},
		remote: {
			address: "Remote workers",
			mapsUrl: null
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
						.attr('title', rating.stars + ' stars on Yelp\n('+rating.reviews+' '+(rating.reviews===1 ? 'review' : 'reviews') + ')');
				}, this));
		}
	});

	return IntroView;

})();
