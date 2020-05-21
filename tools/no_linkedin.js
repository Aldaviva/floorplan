const _ = require('lodash')
// var fs = require('fs')
const people = require('../people')

console.log('People with no LinkedIn profile:')

_(people).sortBy('fullname').forEach((person) => {
  if (typeof person.linkedInId === 'undefined') {
    console.log(person.fullname)
  }
})
