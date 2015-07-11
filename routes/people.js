var _                = require('lodash');
var config           = require('../config');
var express          = require('express');
var path             = require('path');
var personRepository = require('../lib/personRepository');
var photoManager     = require('../lib/photoManager');
var Q                = require('q');
var server           = require('../lib/server');
var url              = require('url');
var verror           = require('verror');

var FIELD_WRITE_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone'];

var photoStaticHandler = express.static('./data', { maxAge: 4*60*60*1000 });

server.get('/people', function(req, res, next){
	personRepository.find(req.query)
		.then(res.send.bind(res))
		.fail(next);
});

server.get('/people/:id', function(req, res, next){
	personRepository.findOne(req.params.id)
		.then(function(result){
			if(!result){
				res.send(404, "No one has id "+req.params.id+'.');
			} else {
				res.send(result);
			}
		})
		.fail(next);
});

server.post('/people', function(req, res, next){
	var sanitizedBody = _.pick(req.body, FIELD_WRITE_WHITELIST);
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res))
		.fail(next);
});

server.put('/people/:id', function(req, res, next){
	var sanitizedBody = _.pick(req.body, FIELD_WRITE_WHITELIST);
	sanitizedBody._id = req.params.id;
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res))
		.fail(next);
});

server.delete('/people/:id', function(req, res, next){
	personRepository.remove(req.params.id)
		.then(function(numRemoved){
			res.send(204);
		})
		.fail(next);
});

server.get(/^\/people\/(\w+)\/photo(?:\.jpg)?$/, function(req, res, next){
	var id = req.params[0];
	req.url = '/photos/'+id+'.jpg';
	photoStaticHandler(req, res, next);
});

server.post('/people/:id/photo', function(req, res, next){
	var uploadedFile = req.files.photo;
	var tempPath     = uploadedFile.path;
	var personId     = req.params.id;

	return photoManager.importPhoto(tempPath, personId + '.jpg')
		.then(function(imgInfo){
			var basename = path.basename(imgInfo.path);

			var imageUrl = url.format({
				protocol : req.protocol,
				host     : req.get('host'),
				pathname : config.mountPoint + '/people/' + personId + '/photo'
			});

			var payload = { files: [{
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
				json: function(){
					res.send(payload);
				},
				default: function(){
					res.send(JSON.stringify(payload));
				}
			});
		})
		.fail(function(err){
			res.type('text');
			res.send(400, err.stack || err.message || err);
		})
		.fail(next);
});