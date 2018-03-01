// Reference 1: http://mongodb.github.io/node-mongodb-native/3.0/quick-start/quick-start/
// Reference 2: https://stackoverflow.com/questions/47662220/db-collection-is-not-a-function-when-using-mongoclient-v3-0?rq=1

// Chain: index <- server <- database <- config
require('./config')

// ===== Modules & variables =====

var MongoClient = require('mongodb').MongoClient
var MongoServer = require('mongodb').Server
var Q = require('q')
var dbPromise
var db

// ===== MongoDB connection =====

var mongo = new MongoClient(new MongoServer(global.dbHost, global.dbPort))
var url = 'mongodb://' + global.dbHost + ':' + global.dbPort + '/' + global.dbName
var ObjectID = mongo.ObjectID

var dbOptions = {
  journal: true,
  numberOfRetries: Number.POSITIVE_INFINITY
}

MongoClient.connect(url, (err, client) => {
  // Handle error
  if (err) throw err
  // Client returned
  db = module.exports = client.db(global.dbName, dbOptions)
  global.logger.log('info', 'DB: connected to %s', url)
})

// ===== Promises & functions =====

module.exports.OID = function (objectIdOrHexString) {
  if (!objectIdOrHexString) {
    return null
  } else if (objectIdOrHexString instanceof ObjectID) {
    return objectIdOrHexString
  } else {
    return new ObjectID(objectIdOrHexString)
  }
}

module.exports.shutdown = function () {
  return dbPromise
    .then(function () {
      var deferred = Q.defer()
      db.close(deferred.makeNodeResolver())
      return deferred.promise
    })
    .finally(function () {
      global.logger.log('info', 'DB: shut down')
    })
}
