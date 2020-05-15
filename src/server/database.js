/*
"personRepository" was merged into here, as part of new ORM usage.
*/

const _ = require('lodash')
const caminte = require('caminte')
const schema = new caminte.Schema('mongodb', { host: global.dbHost, port: global.dbPort, database: global.dbName })

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

// Instance of People
const people = schema.modelNames.People

// Modified version of original person / data method, to work with the ORM
function loadPeopleAsObj (data) {
  return _.pick(data, ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone'])
}

// Find all people
function findPeople () {
  try {
    return people.find()
  } catch (ex) {
    global.logger.log('error', 'DATABASE: cannot find any users!')
  }
}

// Find someone by OID (MongoDB ID)
function findByOID (OID) {
  try {
    return people.find({ where: { _id: OID } })
  } catch (ex) {
    global.logger.log('error', 'DATABASE: cannot find any users!')
  }
}

// Find one person
function findPerson (fullname) {
  try {
    return people.find({ where: { fullname } })
  } catch (ex) {
    global.logger.log('warning', ('DATABASE: cannot find %s', fullname))
  }
}

// Save, or modify, a person
function savePeople (data) {
  try {
    people.updateOrCreate(loadPeopleAsObj(data))
  } catch (ex) {
    global.logger.log('error', 'DATABASE: cannot save record')
  }
}

// Delete a person
function deletePeople (fullname) {
  try {
    people.destroy(findPerson(fullname))
  } catch (ex) {
    global.logger.log('error', 'DATABASE: cannot delete record')
  }
}

// Delete a person
function deletePeopleByOID (OID) {
  try {
    people.destroy(findByOID(OID))
  } catch (ex) {
    global.logger.log('error', 'DATABASE: cannot delete record')
  }
}

module.exports = { findByOID, findPeople, findPerson, savePeople, deletePeople, deletePeopleByOID }
