const names = require('./names')

let nameParts = []

names.forEach((name) => {
  nameParts = nameParts.concat(name.split(/\s+/g))
})

const longestName = nameParts.reduce(function (prev, curr) {
  return (prev.length > curr.length) ? prev : curr
}, '')

console.log(longestName)
