// === lib/app.js calls this file ===

/*
 * Routing subdir in old version, was merged into this file.
 * This is an attempt to reduce duplicate code, and improve debugging.
 * Useful reference: http://expressjs.com/en/guide/migrating-4.html
 */

var personRepository = require('./personRepository')
var photoManager = require('./photoManager')
var router = require('express').Router()
var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var Q = require('q')
var url = require('url')
var OFFICE_IDS = []
var FIELD_WRITE_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone']
var photoStaticHandler = require('express').static(path.join(global.dirRoot, 'data'), { maxAge: 4 * 60 * 60 * 1000 })

// ===== Assorted functions and custom middleware =====

/*
// Populate OFFICE_IDS, based on contents of map directory
fs.readdir(global.dirMaps, function (err, files) {
  if (err) global.logger.log('error', err)
  OFFICE_IDS = files.map(function (filename) {
    return path.basename(filename, '.svg')
  })
})
*/

// Hack "OFFICE_IDS" with list of office ids from config
global.offices.forEach(function (office) {
  OFFICE_IDS.push(office.officeId)
})

global.logger.log('debug', 'Prepared %s OFFICE_IDS ', OFFICE_IDS.length)

// Not-implemented error
var nonImp = function (req) {
  global.logger.log('warn', 'Unserved request: ', req)
}

// Debug message to flag on "all"
var wasHere = function (req, res, next) {
  global.logger.log('debug', 'Request was here: ', req)
  next(new Error('not implemented'))
}

// Render admin page
var renderAdmin = function (req, res, next) {
  Q.all(OFFICE_IDS.map(function (officeId) { return Q.nfcall(fs.readFile, path.join(global.dirMaps, officeId + '.svg')) }))
    .then(function (svgs) {
      global.logger.log('debug', 'renderAdmin called on %s', OFFICE_IDS)
      var context = {
        svgs: _.zipObject(OFFICE_IDS, svgs),
        config: JSON.stringify({
          mountPoint: global.mountPoint
        })
      }
      res.render('admin', context)
    }).fail(next)
}

// Render floorplan
var renderFloorplan = function (req, res, next) {
  var officeLookup = global.offices[0]
  var officeId = req.params.office || officeLookup.officeId
  // TODO: fix dynamic office lookup
  global.logger.log('info', 'Attempting to render: ' + officeId)
  Q.all([
    OFFICE_IDS.map(function (officeId) { return Q.nfcall(fs.readFile, path.join(global.dirMaps, officeId + '.svg')) })
  ]).spread(function (svg) {
    global.logger.log('debug', 'renderFloorplan called on %s', OFFICE_IDS)
    var context = {
      officeId: officeLookup.officeId,
      officeName: officeLookup.officeName,
      svg: svg,
      config: JSON.stringify(_.pick(global.mountPoint))
    }
    global.logger.log('info', 'Rendering floorplan for ' + officeId)
    res.render('floorplan', context)
  }).fail(next)
}

// ===== Routing logic =====

// People

router.route('/people')
  .all(wasHere)
  .get(function (req, res, next) {
    personRepository.find(req.query)
      .then(res.send.bind(res))
      .fail(next)
  })
  .post(function (req, res, next) {
    personRepository.save(_.pick(req.body, FIELD_WRITE_WHITELIST))
      .then(res.send.bind(res))
      .fail(next)
  })
  .put(nonImp)
  .delete(nonImp)

// People ID

router.param('id', wasHere)

router.route('/people:id')
  .all(wasHere)
  .get(function (req, res, next) {
    personRepository.findOne(req.params.id)
      .then(function (result) {
        if (!result) {
          res.send(404, 'No one has id ' + req.params.id + '.')
        } else {
          res.send(result)
        }
      })
      .fail(next)
  })
  .post(nonImp)
  .put(function (req, res, next) {
    var sanitizedBody = _.pick(req.body, FIELD_WRITE_WHITELIST)
    sanitizedBody._id = req.params.id
    personRepository.save(sanitizedBody)
      .then(res.send.bind(res))
      .fail(next)
  })
  .delete(function (req, res, next) {
    personRepository.remove(req.params.id)
      .then(res.send(204))
      .fail(next)
  })

// People photos

router.route(/^\/people\/(\w+)\/photo(?:\.jpg)?$/)
  .all(wasHere)
  .get(function (req, res, next) {
    req.url = '/photos/' + req.params[0] + '.jpg'
    photoStaticHandler(req, res, next)
  })
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// People ID photos

router.route('/people/:id/photo')
  .all(wasHere)
  .get(nonImp)
  .post(function (req, res, next) {
    var uploadedFile = req.files.photo
    var tempPath = uploadedFile.path
    var personId = req.params.id

    return photoManager.importPhoto(tempPath, personId + '.jpg')
      .then(function (imgInfo) {
        var basename = path.basename(imgInfo.path)

        var imageUrl = url.format({
          protocol: req.protocol,
          host: req.get('host'),
          pathname: global.mountPoint + '/people/' + personId + '/photo'
        })

        var payload = { files: [{
          name: basename,
          url: imageUrl,
          thumbnailUrl: imageUrl
          // size         : imgInfo.size
        }]}

        /**
         * Browsers that upload using iframes require text/html or text/plain,
         * because application/json will create a download dialog.
         *
         * @see https://github.com/blueimp/jQuery-File-Upload/wiki/Setup#content-type-negotiation
         */
        res.format({
          json: function () {
            res.send(payload)
          },
          default: function () {
            res.send(JSON.stringify(payload))
          }
        })
      })
      .fail(function (err) {
        res.type('text')
        res.send(400, err.stack || err.message || err)
      })
      .fail(next)
  })
  .put(nonImp)
  .delete(nonImp)

// Test
router.use('/test', function (req, res) {
  res.send('Test!')
})

// Root (Floorplan)

router.route('/')
  .all(wasHere)
  .get(renderFloorplan)
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// Root Office (Floorplan)

router.route('/:office')
  .all(wasHere)
  .get(renderFloorplan)
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// Admin

router.route('/admin')
  .all(wasHere)
  .get(renderAdmin)
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// Admin ID

router.route('/admin/:id')
  .all(wasHere)
  .get(renderAdmin)
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// Endpoints

router.route('/endpoints')
  .all(wasHere)
  .get(function (req, res) {
    res.json(req.body)
  })
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// Endpoints Status

router.route('/endpoints/status')
  .all(wasHere)
  .get(function (req, res) {
    res.json(req.body)
  })
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// Endpoints ID Photo

router.route('/endpoints/:id/photo')
  .all(wasHere)
  .get(function (req, res, next) {
    req.url = '/photos/' + req.params.id + '.jpg'
    photoStaticHandler(req, res, next)
  })
  .post(nonImp)
  .put(nonImp)
  .delete(nonImp)

// ===== Completion =====

module.exports = router
global.logger.log('info', 'Routes loaded')
