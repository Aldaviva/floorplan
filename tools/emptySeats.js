var _ = require('lodash');
var people = require('../people');

var maxSeatId = 122;

var allSeatIds = _.range(0, maxSeatId);
var occupiedSeatIds = _.pluck(people, 'desk');

var emptySeatIds = _.difference(allSeatIds, occupiedSeatIds);

console.log('Empty seats:');
console.log(_(emptySeatIds).sortBy().value().join('\n'));