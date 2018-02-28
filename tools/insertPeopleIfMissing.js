// var fs = require('fs')
var mongo = require('mongodb')

var people = require('./blr')
var peopleRemaining = people.length

console.log('found ' + peopleRemaining + ' people to insert')

process.chdir(__dirname)

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', function (err, db) {
  if (err) throw err
  db.collection('people', function (err, coll) {
    people.forEach(function (person) {
      coll.findOne({ fullname: person.fullname }, function (err, doc) {
        if (!doc) {
          coll.insert(person, function (err) {
            if (err) {
              console.error('error inserting person', person)
            } else {
              console.log('inserted ' + person.fullname)
            }
            disconnectIfDone(db)
          })
        } else {
          console.log('skipping ' + person.fullname)
          disconnectIfDone(db)
        }
        peopleRemaining--
      })
    })
  })
})

function disconnectIfDone (db) {
  if (!peopleRemaining) {
    console.log('done')
    db.close()
  }
}
