/* Loading: lib/server.js <- lib/routes.js <- this file */

const database = require('./database')

// find functions
function find (query) { database.getPeople.findOne(query) }
function findAll () { database.getPeople.find() }
function findByOffice (office) { find({ office: office }) }

/**
 * @param id The object ID to search for. Can be a String or an ObjectID instance
 * @returns the result object, or null if no result was found
 */
function findOne (id) { database.getPeople.findOne({ _id: database.OID(id) }) }

/*
 * Currently performs full updates, not deltas. If we want PATCH support on the API, we'll need to
 * use $set to avoid deleting the attributes omitted from the delta.
 */
function save (attrs) {
  let id = database.OID(attrs._id)
  delete attrs._id
  database.getPeople.update({ _id: id }, attrs, { upsert: true })
    .then((report) => {
      const id2 = id || report[1].upserted
      return exports.findOne(id2)
    })
}

function remove (id) {
  let person
  exports.findOne(id)
    .then((person_) => {
      person = person_
      return database.collection('people_deleted').insert(person)
    })
    .then(database.getPeople.remove(person))
}

module.exports = { findAll, find, findOne, findByOffice, save, remove }
