var fs = require('fs')
var mongo = require('mongodb')
var _ = require('lodash')

if (!process.argv[2]) {
  console.log('usage: node updatePeopleByFullname.js <people.json>')
  process.exit(1)
}

var people = JSON.parse(fs.readFileSync(process.argv[2]), 'utf8')
var peopleRemaining = people.length

console.log('Found ' + peopleRemaining + ' people to update.')

process.chdir(__dirname)

var missingPeople = []
var numUpdated = 0

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', function (err, db) {
  if (err) throw err

  db.collection('people', function (err, coll) {
    people.forEach(function (person) {
      var updateDoc = _.omit(person, 'fullname', '_id')
      coll.update({ fullname: person.fullname }, { $set: updateDoc }, function (err, docsChanged) {
        if (err) {
          console.error(err)
          db.close()
          process.exit(1)
        } else if (docsChanged === 0) {
          missingPeople.push(person.fullname)
        } else if (docsChanged === 1) {
          numUpdated++
        }

        peopleRemaining--
        disconnectIfDone(db)
      })
    })
  })
})

function disconnectIfDone (db) {
  if (!peopleRemaining) {
    if (missingPeople.length) {
      console.log(missingPeople.length + ' people from the input JSON file were not found in the database:')
      missingPeople.forEach(function (name) {
        console.log('  ' + name)
      })
      console.log('Their entries were not updated. Make sure their names are the same across both JSON and database.')
    }
    console.log('Updated ' + numUpdated + ' people.')
    db.close()
  }
}
