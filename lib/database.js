//  Modules & variables
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://' + global.dbHost + ':' + global.dbPort + '/' + global.dbName
const mongo = new MongoClient(url)
const ObjectID = mongo.ObjectID

let dbo

// Establish database connection
function getDB () {
  return mongo.connect((err, db) => {
    if (err) global.logger.log('error', 'DATABASE error: ', err.message)
    global.logger.log('info', 'DATABASE connected: ', url)
    dbo = db.db
  })
}

// Get people collection
function getPeople () {
  try {
    getDB()
    return dbo.collection('people')
  } catch (err) {
    global.logger.log('error', 'DATABASE error: ', err.message)
  }
}

// Get an OID from the database
function objectIdOrHexString () {
  if (!objectIdOrHexString) return null
  else if (objectIdOrHexString instanceof ObjectID) return objectIdOrHexString
  else return new ObjectID(objectIdOrHexString)
}

module.exports = { getDB, getPeople, objectIdOrHexString }
