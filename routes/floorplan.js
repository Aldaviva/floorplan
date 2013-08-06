var _                = require('lodash');
var fs               = require('fs');
var path             = require('path');
var personRepository = require('../lib/personRepository');
var Q                = require('q');
var server           = require('../lib/server');

var MAPS_PATH = path.join(server.get('views'), 'maps');
var OFFICE_IDS;

fs.readdir(MAPS_PATH, function(err, files){
	if (err) throw err;
	OFFICE_IDS = files.map(function(filename){
		return path.basename(filename, '.svg');
	});
});

exports.index = function(req, res){
	var officeId = req.params.office || "mv";

	if(_.contains(OFFICE_IDS, officeId)) {

		var svgPath = path.join(MAPS_PATH, officeId+'.svg');
		var svgReadPromise = Q.nfcall(fs.readFile, svgPath);

		var peopleFindPromise = personRepository.findByOffice(officeId);

		Q.all([
			svgReadPromise,
			peopleFindPromise
		]).spread(function(svg, people){
			var context = {
				officeId: officeId,
				svg: svg,
				people: JSON.stringify(people)
			};
			res.render('floorplan', context);
		});

	} else {
		res.status(404).send("No office called "+officeId+", try "+OFFICE_IDS.join(' or ')+'.');
	}
};