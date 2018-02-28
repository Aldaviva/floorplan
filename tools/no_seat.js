var _ = require('lodash')
// var fs = require('fs')
var people = require('../people')

console.log('People with no seat:')

_(people).sortBy('fullname').forEach(function (person) {
  if (person.desk == null) {
    console.log(person.fullname)
  }
})
