const _ = require('lodash')

// const mergeKey = process.argv[2]

const filenames = process.argv.slice(2)
const files = filenames.map(function (filename) {
  return require('./' + filename)
})

let inputDocs = []
_.each(files, function (docs) {
  inputDocs = inputDocs.concat(docs)
})

const grouped = _.groupBy(inputDocs, 'fullname')

const merged = _.map(grouped, function (groupedPerson) {
  return _.reduce(groupedPerson, function (prev, curr) {
    return _.extend({}, prev, curr)
  }, {})
})

console.log(JSON.stringify(merged).replace(/\},/g, '},\n'))
