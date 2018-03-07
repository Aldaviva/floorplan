/*
 * References
 * http://mongodb.github.io/node-mongodb-native/3.0/quick-start/quick-start/
 * https://stackoverflow.com/questions/47662220/db-collection-is-not-a-function-when-using-mongoclient-v3-0?rq=1
 * https://www.terlici.com/2015/04/03/mongodb-node-express.html
*/

// ===== Modules & variables =====
const MongoClient = require('mongodb').MongoClient
const MongoServer = require('mongodb').Server
const mongo = new MongoClient(new MongoServer(global.dbHost, global.dbPort))
const url = 'mongodb://' + global.dbHost + ':' + global.dbPort + '/' + global.dbName

// Database state
var state = {
  db: null
}

// Error logger
var reportError = function (err) {
  global.logger.log('error', 'DB error: ' + err)
}

// Connect database (usually invoked at start of app)
exports.connect = function () {
  if (state.db) return true
  MongoClient.connect(url, function (err, db) {
    if (err) {
      reportError(err)
      return false
    }
    state.db = db
    global.logger.log('info', 'DB connected to %s', url)
  })
}

// Get access to database
exports.get = function () {
  if (state.db) return state.db
}

// Close database
exports.close = function () {
  if (state.db) {
    state.db.close(function (err, result) {
      if (err) {
        reportError(err)
        return false
      }
      state.db = null
      state.mode = null
      global.logger.log('info', 'DB disconnected: ' + result)
    })
    return true
  }
}

// Get a collection from the database
exports.collection = function (value) {
  if (state.db) return state.db.get().collection(value)
  else return null
}

// Get an OID from the database
exports.OID = function (objectIdOrHexString) {
  var ObjectID = mongo.ObjectID
  if (!objectIdOrHexString) return null
  else if (objectIdOrHexString instanceof ObjectID) return objectIdOrHexString
  else return new ObjectID(objectIdOrHexString)
}
