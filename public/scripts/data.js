this.data = (function(){

	var data = {};

	var Person = data.Person = Backbone.Model.extend({
		idAttribute: "_id",
		getPhotoPath: function(){
			if(this.id){
				return config.mountPoint + '/people/'+this.id+'/photo';
			} else {
				return config.mountPoint + '/images/missing_photo.jpg';
			}
		},
		getLinkedInProfileUrl: function(){
			var profileId = this.get('linkedInId');
			return (profileId) ? Person.linkedInIdToUrl(profileId) : null;
		},
		defaults: {
			tags: []
		}
	},{
		linkedInUrlToId: function(profileUrl){
			var profileId = null;

			var matches = profileUrl.match(/linkedin\.com\/(in\/[A-Za-z0-9\-_]+)/);
			if(matches){
				profileId = matches[1];

			} else {
				matches = profileUrl.match(/linkedin\.com\/profile\/view\?id=([A-Za-z0-9\-_]+)/);
				if(matches){
					profileId = matches[1];
				}
			}

			return profileId;
		},
		linkedInIdToUrl: function(profileId){
			if(/^in\//.test(profileId)){
				return "https://www.linkedin.com/" + profileId;
			} else {
				return "https://www.linkedin.com/profile/view?id=" + profileId;
			}
		}
	});

	var people = data.people = new (Backbone.Collection.extend({
		model: Person,
		url: config.mountPoint + '/people',
		comparator: 'fullname'
	}))();

	var Endpoint = data.Endpoint = Backbone.Model.extend({
		
	});

	var endpoints = data.endpoints = new (Backbone.Collection.extend({
		model: Endpoint,
		url: config.mountPoint+'/endpoints',
		initialize: function(){
			_.bindAll(this);
		},
		fetchStatuses: function(){
			return $.getJSON(this.url+'/status')
				.done(_.bind(function(statuses){
					_.forEach(statuses, function(status){
						var endpoint = this.get(status.endpointId);
						endpoint.set({ status: _.omit(status, "endpointId") });
					}, this);
				}, this));
		}
	}))();

	return data;
})();