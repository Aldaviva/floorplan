var _ = require('lodash')
var config = require('node-config')
var fs = require('fs')
var path = require('path')
var Q = require('q')
require('../lib/server')

var OFFICE_IDS

fs.readdir(global.mapsDir, function (err, files) {
  if (err) throw err
  OFFICE_IDS = files.map(function (filename) {
    return path.basename(filename, '.svg')
  })
})

var renderAdmin = function (req, res, next) {
  var svgReadPromises = OFFICE_IDS.map(function (officeId) {
    var svgPath = path.join(global.mapsDir, officeId + '.svg')
    return Q.nfcall(fs.readFile, svgPath)
  })

  Q.all(svgReadPromises)
    .then(function (svgs) {
      var svgMap = _.zipObject(OFFICE_IDS, svgs)

      var context = {
        svgs: svgMap,
        config: JSON.stringify({
          mountPoint: config.mountPoint
        })
      }
      res.render('admin', context)
    }).fail(next)
}

global.router.get('/admin/', renderAdmin)
global.router.get('/admin/:id', renderAdmin)
