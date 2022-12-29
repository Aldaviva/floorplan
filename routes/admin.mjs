import config from '../config.mjs';
import zipObject from 'lodash-es';
import fs from 'fs';
import path from 'path';
import Q from 'q';
import server from '../lib/server.mjs';

const MAPS_PATH = path.join(server.get('views'), 'maps');
let OFFICE_IDS;

fs.readdir(MAPS_PATH, (err, files) => {
	if (err) throw err;
	OFFICE_IDS = files.map(filename => path.basename(filename, '.svg'));
});

const renderAdmin = function(req, res, next){
	const svgReadPromises = OFFICE_IDS.map(officeId => {
		const svgPath = path.join(MAPS_PATH, `${officeId}.svg`);
		return Q.nfcall(fs.readFile, svgPath);
	});

	Q.all(svgReadPromises)
		.then(svgs => {
			const svgMap = zipObject(OFFICE_IDS, svgs);

			const context = {
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