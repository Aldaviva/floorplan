require('../lib/server')
var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var Q = require('q')

var OFFICE_IDS

fs.readdir(global.dirMaps, function (err, files) {
  if (err) throw err
  OFFICE_IDS = files.map(function (filename) {
    return path.basename(filename, '.svg')
  })
})

var renderAdmin = function (req, res, next) {
  var svgReadPromises = OFFICE_IDS.map(function (officeId) {
    var svgPath = path.join(global.dirMaps, officeId + '.svg')
    return Q.nfcall(fs.readFile, svgPath)
  })

  Q.all(svgReadPromises)
    .then(function (svgs) {
      var svgMap = _.zipObject(OFFICE_IDS, svgs)

      var context = {
        svgs: svgMap,
        config: JSON.stringify({
          mountPoint: global.config.mountPoint
        })
      }
      res.render('admin', context)
    }).fail(next)
}

global.router.get('/admin/', renderAdmin)
global.router.get('/admin/:id', renderAdmin)
