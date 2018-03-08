// Loading: lib/server.js <- lib/routes.js <- this file

const Q = require('q')
const database = require('./database')
const people = database.collection('people')

// find function
const find = exports.find = function (query) {
  let cursor
  return Q.ninvoke(people.find(query))
    .then(function (_cursor) {
      cursor = _cursor
      return Q.ninvoke(cursor, 'toArray')
    })
    .finally(function () {
      cursor && cursor.close()
    })
}

exports.findAll = function () {
  return find({})
}

/**
 * @param id The object ID to search for. Can be a String or an ObjectID instance
 * @returns the result object, or null if no result was found
 */
exports.findOne = function (id) {
  return Q.ninvoke(people.findOne({ _id: database.OID(id) }))
}

exports.findByOffice = function (office) {
  return find({ office: office })
}

/*
 * Currently performs full updates, not deltas. If we want PATCH support on the API, we'll need to
 * use $set to avoid deleting the attributes omitted from the delta.
 */
exports.save = function (attrs) {
  const id = database.OID(attrs._id)
  delete attrs._id
  return Q.ninvoke(people.update({ _id: id }, attrs, { upsert: true }))
    .then(function (report) {
      const id2 = id || report[1].upserted
      return exports.findOne(id2)
    })
}

exports.remove = function (id) {
  let person
  return exports.findOne(id)
    .then(function (person_) {
      person = person_
      return Q.ninvoke(database.collection('people_deleted').insert(person))
    })
    .then(function () {
      return Q.ninvoke(people.remove(person))
    })
}
