var mongo = require('mongodb')
var ObjectID = mongo.ObjectID
var Q = require('q')

var dbOptions = {
  journal: true,
  numberOfRetries: Number.POSITIVE_INFINITY
}

var serverOptions = {
  auto_reconnect: true
}

var server = new mongo.Server(global.dbHost || 'localhost', global.dbPort || '27017', serverOptions)
// server.allServerInstances().forEach(function (serverInstance) {
//  serverInstance.dbInstances = serverInstance.dbInstances || []
// })

var db = module.exports = new mongo.Db(global.dbName || 'floorplan', server, dbOptions)

var dbPromise

module.exports.OID = function (objectIdOrHexString) {
  if (!objectIdOrHexString) {
    return null
  } else if (objectIdOrHexString instanceof ObjectID) {
    return objectIdOrHexString
  } else {
    return new ObjectID(objectIdOrHexString)
  }
}

module.exports.connect = function () {
  return Q.ninvoke(db, 'open')
    .then(onConnect)
    .fail(function (err) {
      global.logger.error(err.message)
    })
}

module.exports.shutdown = function () {
  return dbPromise
    .then(function () {
      var deferred = Q.defer()
      db.close(deferred.makeNodeResolver())
      return deferred.promise
    })
    .finally(function () {
      global.logger.log('Shut down.')
    })
}

function onConnect (db_) {
  global.logger.info('Connected to mongodb://%s:%d/%s.', db_.serverConfig.host, db_.serverConfig.port, db_.databaseName)
  return db_
}
