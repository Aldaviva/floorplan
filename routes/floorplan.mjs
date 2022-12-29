import pick from 'lodash-es';
import fs from 'fs';
import path from 'path';
import * as personRepository from '../lib/personRepository.mjs';
import Q from 'q';
import server from '../lib/server.mjs';
import config from '../config.mjs';

const MAPS_PATH = path.join(server.get('views'), 'maps');
let OFFICE_IDS;
const OFFICE_NAMES = {
	mv: "Mountain View",
	sf: "San Francisco",
	oc: "Orange County",
	blr: "Bangalore",
	ln: "London",
	chi: "Chicago",
	aus: "Australia",
	nz: "New Zealand",
	remote: "remote workers"
};
OFFICE_NAMES.mv2 = OFFICE_NAMES.mv;
OFFICE_NAMES.mv3 = OFFICE_NAMES.mv;

fs.readdir(MAPS_PATH, (err, files) => {
	if (err) throw err;
	OFFICE_IDS = files.map(filename => path.basename(filename, '.svg'));
});

const renderFloorplan = function(req, res, next){
	const officeId = req.params.office || "mv";

	if(contains(OFFICE_IDS, officeId)) {

		const svgPath = path.join(MAPS_PATH, `${officeId}.svg`);
		const svgReadPromise = Q.nfcall(fs.readFile, svgPath);

		Q.all([
			svgReadPromise
		]).spread(svg => {
			const context = {
				officeId,
				officeName: OFFICE_NAMES[officeId],
				svg,
				config: JSON.stringify(pick(config, ['mountPoint', 'stormApiRoot']))
			};
			res.render('floorplan', context);
		}).fail(next);

	} else {
		next();
	}
};

server.get('/:office', renderFloorplan);

server.get('/', (req, res) => {
	res.redirect('mv');
});
