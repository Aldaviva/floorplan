const _ = require('lodash')
const people = require('../people')

const maxSeatId = 122
const allSeatIds = _.range(0, maxSeatId)
const occupiedSeatIds = _.pluck(people, 'desk')
const emptySeatIds = _.difference(allSeatIds, occupiedSeatIds)

console.log('Empty seats:')
console.log(_(emptySeatIds).sortBy().value().join('\n'))
