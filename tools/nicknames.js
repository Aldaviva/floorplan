var people = require('../people')
var _ = require('lodash')

_(people)
  .sortBy('fullname')
  .map(function (person) {
    person.nickname = person.fullname.split(/\s/).map((name) => {
      var firstInitial = name.charAt(0).toLowerCase()
      return (firstInitial == '(')
        ? ''
        : firstInitial
    }).join('')
    return person
  })
  .forEach(function (person) {
    console.log(person.nickname + '\t' + person.fullname)
  })
