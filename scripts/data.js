this.data = (function(){

	var data = {};

	var Person = data.Person = Backbone.Model.extend({
		idAttribute: "fullname",
		getPhotoPath: function(){
			return 'images/photos/'+this.get('fullname')+'.jpg'
		}
	});

	var people = data.people = new (Backbone.Collection.extend({
		model: Person,
		url: 'people.json',
		comparator: 'fullname'
	}))();

	return data;
})();