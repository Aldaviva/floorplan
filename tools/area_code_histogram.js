var people = require('../people')
var _ = require('lodash')
var http = require('https')

_(people)
  .filter('mobilePhone')
  .groupBy(function (person) {
    return person.mobilePhone.substr(0, 3)
  })
  .transform(function (result, val, key) {
    result[key] = val.length
  })
  .forEach(function (count, areaCode) {
    var resBodyRaw = ''

    http.get(
      'http://www.allareacodes.com/api/1.0/api.json?tracking_email=ben@bluejeans.com&tracking_url=http://bluejeans.com&npa=' +
        areaCode,
      function (res) {
        res.on('data', function (chunk) {
          resBodyRaw += chunk
        })

        res.on('end', function () {
          var resBody = JSON.parse(resBodyRaw)
          if (resBody.status === 'success') {
            console.log(
              [areaCode, count, resBody.area_codes[0].state].join(',')
            )
          } else {
            console.log(resBodyRaw)
          }
        })
      }
    )
  })
