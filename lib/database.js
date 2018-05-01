// ===== Modules & variables =====
const MongoClient = require('mongodb').MongoClient
const MongoServer = require('mongodb').Server
const mongo = new MongoClient(new MongoServer(global.dbHost, global.dbPort))
const url = 'mongodb://' + global.dbHost + ':' + global.dbPort + '/' + global.dbName
const ObjectID = mongo.ObjectID

// Database object
let dbObject = null

// Error logger
const reportError = err => {
  global.logger.log('error', 'DB error: ' + err)
}

// Connect database (usually invoked at start of app)
exports.connect = new Promise(
  function (resolve, reject) {
    if (dbObject != null) {
      resolve(url) // DB already exists
    }
    MongoClient.connect(url, function (err, db) {
      if (err) reject(err)
      dbObject = db
      resolve(url) // DB should be connected now
    })
  })

// Get access to database
exports.get = function () {
  if (dbObject != null) return dbObject
  else return null
}

// Close database
exports.close = function () {
  if (dbObject != null) {
    dbObject.close(function (err, result) {
      if (err) {
        reportError(err)
        return false
      }
      dbObject = null
      global.logger.log('info', 'DB disconnected: ' + result)
    })
    return true
  }
}

// Get a collection from the database
exports.collection = value => {
  if (dbObject) return dbObject.get().collection(value)
  else return null
}

// Get an OID from the database
exports.OID = objectIdOrHexString => {
  if (!objectIdOrHexString) return null
  else if (objectIdOrHexString instanceof ObjectID) return objectIdOrHexString
  else return new ObjectID(objectIdOrHexString)
}
