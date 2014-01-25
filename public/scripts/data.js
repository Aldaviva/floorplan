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
		defaults: {
			tags: []
		}
	});

	var people = data.people = new (Backbone.Collection.extend({
		model: Person,
		url: config.mountPoint + '/people',
		comparator: 'fullname'
	}))();

	var Endpoint = data.Endpoint = Backbone.Model.extend({
		fetchStatus: function(){
			return $.getJSON(this.url()+'/status')
				.done(_.bind(function(status){
					this.status = status;
				}, this));
		}
	});

	var endpoints = data.endpoints = new (Backbone.Collection.extend({
		model: Endpoint,
		url: config.stormApiRoot+'endpoints'
	}))();

	return data;
})();