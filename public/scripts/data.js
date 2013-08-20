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

	return data;
})();