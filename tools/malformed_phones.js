const people = require('../people')
const _ = require('lodash')

const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/

function isValidPhoneNumber (phoneNumber) {
  return PHONE_PATTERN.test(phoneNumber)
}

console.log('Malformed phone numbers:')

_(people)
  .forEach((person) => {
    const mobilePhone = person.mobilePhone
    const workPhone = person.workPhone

    if (mobilePhone && !isValidPhoneNumber(mobilePhone)) {
      console.warn('%s: %s', person.fullname, person.mobilePhone)
    }

    if (workPhone && !isValidPhoneNumber(workPhone)) {
      console.warn('%s: %s', person.fullname, person.workPhone)
    }
  })
