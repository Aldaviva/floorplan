var people = require('../people')
var _ = require('lodash')

console.log('People whose work phone number is the same as their mobile phone number:')

_(people).filter(function (person) {
  return person.mobilePhone && (person.mobilePhone === person.workPhone)
})
  .pluck('fullname')
  .sortBy()
  .forEach((name) => {
    console.log(name)
  })
