var _ = require('lodash')

var mergeKey = process.argv[2]

var filenames = process.argv.slice(2)
var files = filenames.map(function (filename) {
  return require('./' + filename)
})

var inputDocs = []
_.each(files, function (docs) {
  inputDocs = inputDocs.concat(docs)
})

var grouped = _.groupBy(inputDocs, 'fullname')

var merged = _.map(grouped, function (groupedPerson) {
  return _.reduce(groupedPerson, function (prev, curr) {
    return _.extend({}, prev, curr)
  }, {})
})

console.log(JSON.stringify(merged).replace(/\},/g, '},\n'))
