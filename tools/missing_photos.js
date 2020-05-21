const people = require('../people')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')

console.log('People with no photo:')

_(people).pluck('fullname').sortBy().forEach((fullname) => {
  var photoExists = doesPhotoExist(fullname)
  if (!photoExists) {
    console.log(fullname)
  }
})

function doesPhotoExist (fullname) {
  return fs.existsSync(path.join(__dirname, '/../images/photos/', fullname, '.jpg'))
}
