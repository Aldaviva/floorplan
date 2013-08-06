var _                = require('lodash');
var personRepository = require('../lib/personRepository');
var Q                = require('q');

var FIELD_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone'];

exports.list = function(req, res){
	personRepository.findAll()
		.then(res.send.bind(res)).done();
};

exports.show = function(req, res){
	personRepository.findOne(req.params.id)
		.then(function(result){
			if(!result){
				res.send(404, "No one has id "+req.params.id+'.');
			} else {
				res.send(result);
			}
		}).done();
};

exports.create = function(req, res){
	var sanitizedBody = _.pick(req.body, FIELD_WHITELIST);
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res)).done();
};

exports.update = function(req, res){
	var sanitizedBody = _.pick(req.body, FIELD_WHITELIST);
	sanitizedBody._id = req.params.id;
	personRepository.save(sanitizedBody)
		.then(res.send.bind(res)).done();
};

exports.delete = function(req, res){
	personRepository.remove(req.params.id)
		.then(function(numRemoved){
			console.info("Removed %d people.", numRemoved);
			res.send(204);
		}).done();
}