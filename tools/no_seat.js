const _ = require('lodash')
// var fs = require('fs')
const people = require('../people')

console.log('People with no seat:')

_(people).sortBy('fullname').forEach((person) => {
  if (person.desk == null) {
    console.log(person.fullname)
  }
})
