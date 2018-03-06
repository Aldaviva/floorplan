// var fs = require('fs')
var mongo = require('mongodb')

var people = require('./blr')
var peopleRemaining = people.length

global.logger.log('info', 'found ' + peopleRemaining + ' people to insert')

process.chdir(__dirname)

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', function (err, db) {
  if (err) global.logger.log('error', err)
  db.collection('people', function (err, coll) {
    if (err)global.logger.log('error', 'Problem with insertPeopleMissing')
    people.forEach(function (person) {
      coll.findOne({ fullname: person.fullname }, function (err, doc) {
        if (err)global.logger.log('error', 'Problem with findOne in insertPeopleMissing')
        if (!doc) {
          coll.insert(person, function (err) {
            if (err) {
              global.logger.log('error', 'error inserting person', person)
            } else {
              global.logger.log('info', 'inserted ' + person.fullname)
            }
            disconnectIfDone(db)
          })
        } else {
          global.logger.log('info', 'skipping ' + person.fullname)
          disconnectIfDone(db)
        }
        peopleRemaining--
      })
    })
  })
})

function disconnectIfDone (db) {
  if (!peopleRemaining) {
    global.logger.log('info', 'Done with insertPeopleMissing')
    db.close()
  }
}
