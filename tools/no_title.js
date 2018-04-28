var _ = require('lodash')
// var fs = require('fs')
var people = require('../people')

console.log('People with a LinkedIn profile but no title:')

_(people).sortBy('fullname').forEach((person) => {
  if (typeof person.linkedInId !== 'undefined' && typeof person.title === 'undefined') {
    console.log(person.fullname)
  }
})

console.log('\nPeople with no LinkedIn profile and no title:')

_(people).sortBy('fullname').forEach((person) => {
  if (typeof person.linkedInId === 'undefined' && typeof person.title === 'undefined') {
    console.log(person.fullname)
  }
})
