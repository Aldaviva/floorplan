this.data = (function(){

	var data = {};

	var Person = data.Person = Backbone.Model.extend({
		idAttribute: "_id",
		getPhotoPath: function(){
			return 'images/photos/'+this.get('fullname')+'.jpg'
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