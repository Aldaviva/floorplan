var _ = require('lodash')
var config = require('node-config')
var fs = require('fs')
var path = require('path')
var Q = require('q')
require('../lib/server')

var OFFICE_IDS
var OFFICE_NAMES = {
  mv: 'Mountain View',
  sf: 'San Francisco',
  oc: 'Orange County',
  blr: 'Bangalore',
  ln: 'London',
  chi: 'Chicago',
  aus: 'Australia',
  remote: 'remote workers'
}
OFFICE_NAMES.mv2 = OFFICE_NAMES.mv
OFFICE_NAMES.mv3 = OFFICE_NAMES.mv

fs.readdir(global.mapsDir, function (err, files) {
  if (err) throw err
  OFFICE_IDS = files.map(function (filename) {
    return path.basename(filename, '.svg')
  })
})

var renderFloorplan = function (req, res, next) {
  var officeId = req.params.office || 'mv'

  if (_.contains(OFFICE_IDS, officeId)) {
    var svgPath = path.join(global.mapsDir, officeId + '.svg')
    var svgReadPromise = Q.nfcall(fs.readFile, svgPath)

    Q.all([
      svgReadPromise
    ]).spread(function (svg) {
      var context = {
        officeId: officeId,
        officeName: OFFICE_NAMES[officeId],
        svg: svg,
        config: JSON.stringify(_.pick(config, ['mountPoint', 'stormApiRoot']))
      }
      res.render('floorplan', context)
    }).fail(next)
  } else {
    next()
  }
}

global.router.get('/:office', renderFloorplan)

global.router.get('/', function (req, res) {
  res.redirect('mv')
})
