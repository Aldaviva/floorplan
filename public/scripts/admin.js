(function(){
	
	this.mediator = new Mediator();

	var listPane = new ListPane({ el: $('#listPane')[0], collection: data.people });
	var editor = new Editor({ el: $('#editor')[0], collection: data.people, model: new data.Person() });

	listPane.render();
	editor.render();

	data.people.fetch({ reset: true });
})();