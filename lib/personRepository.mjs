import db from './database.mjs';
import Q from 'q';
const { OID } = db;

const peopleCollection = db.collection('people');
const deletedPeopleCollection = db.collection('people_deleted');

const find = exports.find = function(query){
	let cursor;

	return Q.ninvoke(peopleCollection, 'find', query)
		.then(_cursor => {
			cursor = _cursor;
			return Q.ninvoke(cursor, 'toArray');
		})
		.finally(() => {
			cursor && cursor.close();
		});
};

export const findAll = function(){
	return find({});
};

/**
 * @param id The object ID to search for. Can be a String or an ObjectID instance
 * @returns the result object, or null if no result was found
 */
export const findOne = function(id){
	return Q.ninvoke(peopleCollection, 'findOne', { _id: OID(id) })
};

export const findByOffice = function(office){
	return find({ office });
};

/*
 * Currently performs full updates, not deltas. If we want PATCH support on the API, we'll need to
 * use $set to avoid deleting the attributes omitted from the delta.
 */
export const save = function(attrs){
	const id = OID(attrs._id);
	delete attrs._id;
	return Q.ninvoke(peopleCollection, 'update', { _id: id }, attrs, { upsert: true })
		.then(report => {
			const id2 = id || report[1].upserted;
			return findOne(id2);
		});
};

export const remove = function(id){
	let person;
	return findOne(id)
		.then(person_ => {
			person = person_;
			return Q.ninvoke(deletedPeopleCollection, 'insert', person);
		})
		.then(() => Q.ninvoke(peopleCollection, 'remove', person));
};