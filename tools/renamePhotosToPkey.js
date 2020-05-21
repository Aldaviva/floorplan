const fs = require('fs')
const mongo = require('mongodb')

process.chdir(__dirname)

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', function (err, db) {
  if (err) throw err

  db.collection('people', function (err, people) {
    if (err) global.logger.log('error', err)
    people.find({}, { fields: { fullname: 1 } }, function (err, cursor) {
      if (err) global.logger.log('error', err)
      cursor.each(function (err, person) {
        if (err) {
          global.logger.log('error', err)
        } else if (person == null) {
          db.close()
        } else {
          onPerson(person)
        }
      })
    })
  })
})

function onPerson (person) {
  global.logger.log('info', '%s -> %s', person._id, person.fullname)
  var oldPhotoPath = global.dirPhotos + person.fullname + '.jpg'
  fs.stat(oldPhotoPath, function (isExtant) {
    if (isExtant) {
      var newPhotoPath = global.dirPhotos + person._id + '.jpg'
      global.logger.log('info', 'mv %s %s', oldPhotoPath, newPhotoPath)
      fs.rename(oldPhotoPath, newPhotoPath)
    }
  })
}
