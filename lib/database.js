/*
  === lib/services.js calls this file ===
  "personRepository" was merged into here, as part of new ORM usage.
*/

const _ = require('../shared/underscore-min')
const caminte = require('caminte')
const schema = new caminte.Schema('mongodb', {host: global.dbHost, port: global.dbPort, database: global.dbName})

// People DB class
schema.define('People', {
  // _id (assumed MongoDB takes care of this)
  fullname: { type: schema.String, limit: 128, unique: true }, // most people have 128 or fewer chars in their name
  desk: { type: schema.Number }, // desk number
  office: { type: schema.String, limit: 32 }, // Uses smaller code
  email: { type: schema.String, limit: 254 }, // 254 chars is the official size limit for email
  title: { type: schema.String, limit: 64 }, // 64 chars seem like a safe limit
  tags: { type: schema.JSON }, // JSON string array
  linkedInId: { type: schema.String, limit: 64 }, // suits "in/user" or full 32-char user ID URL
  mobilePhone: { type: schema.String, limit: 22 }, // https://stackoverflow.com/questions/723587/
  workPhone: { type: schema.String, limit: 22 } // https://stackoverflow.com/questions/723587/
})

// Instantiate classes
const people = schema.model('People')

// Modified version of original person / data method, to work with the ORM
function loadPeopleAsObj (data) {
  return _.pick(data, ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone'])
}

// Find all people
async function findPeople () {
  await people.all().onerror(global.logger.log('error', 'DATABASE: cannot find any users!'))
}

// Find one person
async function findPerson (fullname) {
  await people.findOne({where: { fullname }}).onerror(global.logger.log('warning', ('DATABASE: cannot find %s', fullname)))
}

// Save, or modify, a person
async function savePeople (data) {
  await people.updateOrCreate(loadPeopleAsObj(data)).onerror(global.logger.log('error', 'DATABASE: cannot save record'))
}

// Delete a person
async function deletePeople (fullname) {
  await people.destroy(findPeople(fullname)).onerror(global.logger.log('error', 'DATABASE: cannot delete record'))
}

module.exports = { findPeople, findPerson, savePeople, deletePeople }
