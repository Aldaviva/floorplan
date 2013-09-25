var _                = require('lodash');
var config           = require('../config');
var fs               = require('fs');
var path             = require('path');
var personRepository = require('../lib/personRepository');
var Q                = require('q');
var server           = require('../lib/server');

var MAPS_PATH = path.join(server.get('views'), 'maps');
var OFFICE_IDS;
var OFFICE_NAMES = {
	mv: "Mountain View",
	sf: "San Francisco",
	oc: "Orange County",
	blr: "Bangalore"
};

fs.readdir(MAPS_PATH, function(err, files){
	if (err) throw err;
	OFFICE_IDS = files.map(function(filename){
		return path.basename(filename, '.svg');
	});
});

var renderFloorplan = function(req, res, next){
	var officeId = req.params.office || "mv";

	if(_.contains(OFFICE_IDS, officeId)) {

		var svgPath = path.join(MAPS_PATH, officeId+'.svg');
		var svgReadPromise = Q.nfcall(fs.readFile, svgPath);

		Q.all([
			svgReadPromise
		]).spread(function(svg){
			var context = {
				officeId: officeId,
				officeName: OFFICE_NAMES[officeId],
				svg: svg,
				config: JSON.stringify({
					mountPoint: config.mountPoint
				})
			};
			res.render('floorplan', context);
		}).fail(next);

	} else {
		next();
	}
};

server.get('/:office', renderFloorplan);

server.get('/', function(req, res){
	res.redirect('mv');
});