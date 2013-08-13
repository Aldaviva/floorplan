var _                = require('lodash');
var path             = require('path');
var personRepository = require('../lib/personRepository');
var photoManager     = require('../lib/photoManager');
var Q                = require('q');
var url              = require('url');
var verror           = require('verror');

var FIELD_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone'];

exports.list = function(req, res, next){
	personRepository.findAll()
		.then(res.send.bind(res))
		.fail(next);
};

exports.show = function(req, res, next){
	personRepository.findOne(req.params.id)
		.then(function(result){
			if(!result){
				res.send(404, "No one has id "+req.params.id+'.');
			} else {
				res.send(result);
			}
		})
		.fail(next);
};

exports.create = function(req, res, next){
	var sanitizedBody = _.pick(req.body, FIELD_WHITELIST);
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res))
		.fail(next);
};

exports.update = function(req, res, next){
	var sanitizedBody = _.pick(req.body, FIELD_WHITELIST);
	sanitizedBody._id = req.params.id;
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res))
		.fail(next);
};

exports.delete = function(req, res, next){
	personRepository.remove(req.params.id)
		.then(function(numRemoved){
			console.info("Removed %d people.", numRemoved);
			res.send(204);
		})
		.fail(next);
};

exports.setPhoto = function(req, res, next){
	var uploadedFile = req.files.photo;
	var tempPath     = uploadedFile.path;
	var personId     = req.params.id;

	return photoManager.importPhoto(tempPath, personId + '.jpg')
		.then(function(imgInfo){
			var basename = path.basename(imgInfo.path);

			//TODO this probably won't work through a reverse proxy if the request headers and response paths start getting weird
			//probably need a configuration option for the user-facing URL mount point of this application
			var imageUrl = url.format({
				protocol : req.protocol,
				host     : req.get('host'),
				pathname : '/images/photos/' + basename
			});

			var payload = { files: [{
				name         : basename,
				url          : imageUrl,
				thumbnailUrl : imageUrl,
				size         : imgInfo.size
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
			res.send(400, err.message);
		})
		.fail(next);
};

exports.uploadTest = function(req, res){
	res.render('upload-test');
};