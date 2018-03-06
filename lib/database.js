/*
 * References
 * http://mongodb.github.io/node-mongodb-native/3.0/quick-start/quick-start/
 * https://stackoverflow.com/questions/47662220/db-collection-is-not-a-function-when-using-mongoclient-v3-0?rq=1
 * https://bytearcher.com/articles/writing_modules/
*/

// ===== Modules & variables =====
var MongoClient = require('mongodb').MongoClient
var MongoServer = require('mongodb').Server

// ===== MongoDB connection =====

var mongo = new MongoClient(new MongoServer(global.dbHost, global.dbPort))
var url = 'mongodb://' + global.dbHost + ':' + global.dbPort + '/' + global.dbName

const dbOptions = {
  journal: true,
  numberOfRetries: Number.POSITIVE_INFINITY
}

MongoClient.connect(url, (err, client) => {
  if (err) global.logger.log('error', err)
  exports.dbClient = client
  exports.db = exports.dbClient.db(global.dbName, dbOptions)
  global.logger.log('info', 'DB: connected to %s', url)
})

exports.OID = function (objectIdOrHexString) {
  var ObjectID = mongo.ObjectID
  if (!objectIdOrHexString) return null
  else if (objectIdOrHexString instanceof ObjectID) return objectIdOrHexString
  else return new ObjectID(objectIdOrHexString)
}
