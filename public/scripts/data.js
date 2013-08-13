this.data = (function(){

	var data = {};

	var Person = data.Person = Backbone.Model.extend({
		idAttribute: "_id",
		getPhotoPath: function(){
			if(this.id){
				return '/images/photos/'+this.id+'.jpg';
			} else {
				return '/images/missing_photo.jpg';
			}
		},
		defaults: {
			tags: []
		}
	});

	var people = data.people = new (Backbone.Collection.extend({
		model: Person,
		url: '/people',
		comparator: 'fullname'
	}))();

	return data;
})();