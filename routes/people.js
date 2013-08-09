var _                = require('lodash');
var personRepository = require('../lib/personRepository');
var photoManager     = require('../lib/photoManager');
var Q                = require('q');

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
	var tempPath = uploadedFile.path;

	personRepository.findOne(req.params.id)
		.then(function(person){
			return photoManager.importPhoto(tempPath, person._id + '.jpg')
			// console.log("set %s's photo to %s", person.fullname, uploadedFile.name);
		})
		.then(function(){
			res.redirect(303, 'images/photos/'+req.params.id+'.jpg');
		})
		.fail(next);
};