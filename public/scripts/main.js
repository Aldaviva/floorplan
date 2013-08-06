(function(){

	this.mediator = new Mediator();

	var listPane    = new ListPane({ el: $('#listPane')[0], collection: data.people });
	var detailsPane = new DetailsPane({ el: $('#detailsPane')[0] });
	var map         = new Map({ el: $('#map')[0], collection: data.people });

	listPane.render();
	detailsPane.render();
	map.render();

	// data.people.fetch({ reset: true });
	data.people.reset(floorplanParams.people);

})();