var _      = require('lodash');
var config = require('../config');
var fs     = require('fs');
var path   = require('path');
var Q      = require('q');
var server = require('../lib/server');

var MAPS_PATH = path.join(server.get('views'), 'maps');
var OFFICE_IDS;

fs.readdir(MAPS_PATH, function(err, files){
	if (err) throw err;
	OFFICE_IDS = files.map(function(filename){
		return path.basename(filename, '.svg');
	});
});

var renderAdmin = function(req, res, next){
	var svgReadPromises = OFFICE_IDS.map(function(officeId){
		var svgPath = path.join(MAPS_PATH, officeId+'.svg');
		return Q.nfcall(fs.readFile, svgPath);
	});

	Q.all(svgReadPromises)
		.then(function(svgs){
			var svgMap = _.zipObject(OFFICE_IDS, svgs);

			var context = {
				svgs: svgMap,
				config: JSON.stringify({
					mountPoint: config.mountPoint
				})
			};
			res.render('admin', context);
		}).fail(next);
};

server.get('/admin/', renderAdmin);
server.get('/admin/:id', renderAdmin);