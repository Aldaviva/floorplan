var fs = require('fs')
var mongo = require('mongodb')

process.chdir(__dirname)

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', function (err, db) {
  if (err) throw err

  db.collection('people', function (err, people) {
    people.find({}, { fields: { fullname: 1 }}, function (err, cursor) {
      if (err) throw err

      cursor.each(function (err, person) {
        if (err) {
          throw err
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
  // console.log("%s -> %s", person._id, person.fullname);
  var oldPhotoPath = global.dirPhotos + person.fullname + '.jpg'
  fs.exists(oldPhotoPath, function (isExtant) {
    if (isExtant) {
      var newPhotoPath = global.dirPhotos + person._id + '.jpg'
      console.log('mv %s %s', oldPhotoPath, newPhotoPath)
      fs.rename(oldPhotoPath, newPhotoPath)
    }
  })
}
