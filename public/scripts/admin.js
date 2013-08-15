(function(){
	
	this.mediator = new Mediator();

	var listPane = new ListPane({ el: $('#listPane')[0], collection: data.people });
	var editor = new Editor({ el: $('#editor')[0], collection: data.people });

	listPane.render();
	editor.render();

	listPane.$('.people')
		.prepend($('<li>', { class: 'person add active' })
			.append($('<span>', { class: 'icon', text: '+' }))
			.append($('<div>', { class: 'name', text: 'add person' })));

	mediator.subscribe('activatePersonConfirmed', function(person, opts){
		if(!opts.skipHistory){
			var path = config.mountPoint + (person.isNew() 
				? '/admin/'
				: '/admin/'+person.id+'#'+person.get('fullname').replace(/\s/g, '_'));
			window.history.pushState({ personId: person.id }, null, path);
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
			var pathnameParts = location.pathname.replace(new RegExp('^'+config.mountPoint), '').split('/');
			var personToActivate;

			if(pathnameParts.length >= 3){
				var personId = pathnameParts[2];
				var person = data.people.get(personId);
				if(person){
					personToActivate = person;
				}
			}

			personToActivate = personToActivate || new data.Person();

			mediator.publish('activatePersonConfirmed', personToActivate);
			editor.$el.show();
		}
	});

})();