import config from '../config.mjs';
import pick from 'lodash-es';
import express from 'express';
import path from 'path';
import * as personRepository from '../lib/personRepository.mjs';
import * as photoManager from '../lib/photoManager.mjs';
import server from '../lib/server.mjs';
import url from 'url';

const FIELD_WRITE_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone'];

const photoStaticHandler = express.static('./data', { maxAge: 4*60*60*1000 });

server.get('/people', (req, res, next) => {
	personRepository.find(req.query)
		.then(res.send.bind(res))
		.fail(next);
});

server.get('/people/:id', (req, res, next) => {
	personRepository.findOne(req.params.id)
		.then(result => {
			if(result){
				res.send(result);
			} else {
				res.send(404, `No one has id ${req.params.id}.`);
			}
		})
		.fail(next);
});

server.post('/people', (req, res, next) => {
	const sanitizedBody = pick(req.body, FIELD_WRITE_WHITELIST);
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res))
		.fail(next);
});

server.put('/people/:id', (req, res, next) => {
	const sanitizedBody = pick(req.body, FIELD_WRITE_WHITELIST);
	sanitizedBody._id = req.params.id;
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res))
		.fail(next);
});

server.delete('/people/:id', (req, res, next) => {
	personRepository.remove(req.params.id)
		.then(numRemoved => {
			res.send(204);
		})
		.fail(next);
});

server.get(/^\/people\/(\w+)\/photo(?:\.jpg)?$/, (req, res, next) => {
	const id = req.params[0];
	req.url = `/photos/${id}.jpg`;
	photoStaticHandler(req, res, next);
});

server.post('/people/:id/photo', (req, res, next) => {
	const uploadedFile = req.files.photo;
	const tempPath     = uploadedFile.path;
	const personId     = req.params.id;

	return photoManager.importPhoto(tempPath, `${personId}.jpg`)
		.then(imgInfo => {
			const basename = path.basename(imgInfo.path);

			const imageUrl = url.format({
				protocol : req.protocol,
				host     : req.get('host'),
				pathname : `${config.mountPoint}/people/${personId}/photo`
			});

			const payload = { files: [{
				name         : basename,
				url          : imageUrl,
				thumbnailUrl : imageUrl,
				// size         : imgInfo.size
			}]};

			/**
			 * Browsers that upload using iframes require text/html or text/plain,
			 * because application/json will create a download dialog.
			 * 
			 * @see https://github.com/blueimp/jQuery-File-Upload/wiki/Setup#content-type-negotiation
			 */
			res.format({
				json() {
					res.send(payload);
				},
				default() {
					res.send(JSON.stringify(payload));
				}
			});
		})
		.fail(err => {
			res.type('text');
			res.send(400, err.stack || err.message || err);
		})
		.fail(next);
});