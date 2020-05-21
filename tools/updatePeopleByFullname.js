const fs = require('fs')
const mongo = require('mongodb')
const _ = require('lodash')

if (!process.argv[2]) {
  console.log('usage: node updatePeopleByFullname.js <people.json>')
  process.exit(1)
}

const people = JSON.parse(fs.readFileSync(process.argv[2]), 'utf8')
let peopleRemaining = people.length

console.log('Found ' + peopleRemaining + ' people to update.')

process.chdir(__dirname)

const missingPeople = []
let numUpdated = 0

const connect = (err, db) => {
  if (err) {
    console.log(err.stack)
  }
  db.collection('people', function (err, coll) {
    if (err) {
      console.log(err.stack)
    }
    people.forEach((person) => {
      const updateDoc = _.omit(person, 'fullname', '_id')
      coll.update({ fullname: person.fullname }, { $set: updateDoc }, function (
        err,
        docsChanged
      ) {
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
}

const disconnectIfDone = (db) => {
  if (!peopleRemaining) {
    if (missingPeople.length) {
      console.log(
        missingPeople.length +
          ' people from the input JSON file were not found in the database:'
      )
      missingPeople.forEach((name) => {
        console.log('  ' + name)
      })
      console.log(
        'Their entries were not updated. Make sure their names are the same across both JSON and database.'
      )
    }
    console.log('Updated ' + numUpdated + ' people.')
    db.close()
  }
}

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', connect)
