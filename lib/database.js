/*
  === lib/services.js calls this file ===
  "personRepository" was merged into here, as part of new ORM usage.
*/

const caminte = require('caminte')
const schema = new caminte.Schema('mongodb', {host: global.dbHost, port: global.dbPort, database: global.dbName})
const _ = require('lodash')

// People DB class
const People = schema.define('People', {
  fullname: { type: schema.String, limit: 128, unique: true },
  desk: { type: schema.String, limit: 64 },
  office: { type: schema.String, limit: 255 },
  email: { type: schema.String, limit: 254 },
  title: { type: schema.String, limit: 64 },
  tags: { type: schema.JSON },
  linkedInId: { type: schema.String, limit: 64 },
  mobilePhone: { type: schema.String, limit: 22 },
  workPhone: { type: schema.String, limit: 22 }
})

// Instantiate classes
const people = new People()

// Modified version of original person / data method, to work with the ORM
function loadPeopleAsObj (data) {
  return _.pick(data, ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone'])
}

// Find all people, or one person
function findPeople (fullname) {
  return fullname
    ? people.all().onerror(global.logger.log('error', 'DATABASE: cannot find any users!'))
    : people.findOne({where: {'fullname': fullname}}).onerror(global.logger.log('warning', 'DATABASE: cannot find ' + fullname))
}

// Save, or modify, a person
function savePeople (data) {
  schema.model('People').updateOrCreate(loadPeopleAsObj(data)).onerror(global.logger.log('error', 'DATABASE: cannot save record'))
}

// Delete a person
function deletePeople (fullname) {
  schema.model('People').destroy(findPeople(fullname)).onerror(global.logger.log('error', 'DATABASE: cannot delete record'))
}

module.exports = { findPeople, savePeople, deletePeople }
