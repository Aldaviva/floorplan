var _  = require('lodash');
var db = require('./database');
var Q  = require('q');
var OID = db.OID;

var peopleCollection = db.collection('people');
var deletedPeopleCollection = db.collection('people_deleted');

function find(query){
	var cursor;

	return Q.ninvoke(peopleCollection, 'find', query)
		.then(function(_cursor){
			cursor = _cursor;
			return Q.ninvoke(cursor, 'toArray');
		})
		.finally(function(){
			cursor && cursor.close();
		});
}

exports.findAll = function(){
	return find({});
};

/**
 * @param id The object ID to search for. Can be a String or an ObjectID instance
 * @returns the result object, or null if no result was found
 */
exports.findOne = function(id){
	return Q.ninvoke(peopleCollection, 'findOne', { _id: OID(id) })
};

exports.findByOffice = function(office){
	return find({ office: office });
};

//TODO make sure both diffs and full updates work (PATCH vs. PUT, update vs. update $set)
exports.save = function(attrs){
	var id = OID(attrs._id);
	delete attrs._id;
	return Q.ninvoke(peopleCollection, 'update', { _id: id }, attrs, { upsert: true })
		.then(function(report){
			var id2 = id || report[1].upserted;
			return exports.findOne(id2);
		});
};

exports.remove = function(id){
	var person;
	return exports.findOne(id)
		.then(function(person_){
			person = person_;
			return Q.ninvoke(deletedPeopleCollection, 'insert', person);
		})
		.then(function(){
			return Q.ninvoke(peopleCollection, 'remove', person);
		});
}