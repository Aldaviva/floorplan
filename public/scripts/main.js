(function(){

	this.mediator = new Mediator();

	var listPane    = new ListPane({ el: $('#listPane')[0], collection: data.people });
	var detailsPane = new DetailsPane({ el: $('#detailsPane')[0] });
	var map         = new Map({ el: $('.map')[0], collection: data.people, office: 'mv' });

	listPane.render();
	detailsPane.render();
	map.render();

	data.people.reset(floorplanParams.people);

	mediator.subscribe('activatePerson', function(person, opts){
		mediator.publish('activatePersonConfirmed', person, opts);
	});

	mediator.subscribe('map:clickPerson', function(person, opts){
		mediator.publish('activatePerson', person, opts);
	});

})();