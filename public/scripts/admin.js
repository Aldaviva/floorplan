(function(){
	
	this.mediator = new Mediator();

	var listPane = new ListPane({ el: $('#listPane')[0], collection: data.people });
	var editor = new Editor({ el: $('#editor')[0], collection: data.people, model: new data.Person() });

	listPane.render();
	editor.render();

	mediator.subscribe('activatePerson', function(person, opts){
		if(!opts.skipHistory){
			window.history.pushState({ personId: person.id }, null, '/admin/'+person.id+'#'+person.get('fullname').replace(/\s/g, '_'));
		}
	});

	window.addEventListener('popstate', function(event){
		var person = event.state
			? data.people.get(event.state.personId)
			: new data.Person();

		mediator.publish('activatePerson', person, { skipHistory: true });
	}, false);
		
	data.people.fetch({
		reset: true,
		success: function(){
			var pathnameParts = location.pathname.split('/');
			if(pathnameParts.length >= 3){
				var personId = pathnameParts[2];
				var person = data.people.get(personId);
				if(person){
					mediator.publish('activatePerson', person);
				}
			}
		}
	});

})();