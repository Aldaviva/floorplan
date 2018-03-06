// Loading: lib/server.js <- this file

/*
 * Routing subdir in old version, was merged into this file.
 * This is an attempt to reduce duplicate code, and improve debugging.
 * Useful reference: http://expressjs.com/en/guide/migrating-4.html
 */

var app = require('./app')
var personRepository = require('./personRepository')
var photoManager = require('./photoManager')
var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var Q = require('q')
var url = require('url')
var OFFICE_IDS
var FIELD_WRITE_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone']
var photoStaticHandler = require('express').static(path.join(global.dirRoot, 'data'), { maxAge: 4 * 60 * 60 * 1000 })

// ===== Assorted functions and custom middleware =====

// Populate OFFICE_IDS, based on contents of map directory
fs.readdir(global.dirMaps, function (err, files) {
  if (err) global.logger.log('error', err)
  OFFICE_IDS = files.map(function (filename) {
    return path.basename(filename, '.svg')
  })
})

// Users listing function
exports.list = function (req, res) {
  res.send('respond with a resource')
}

// Render admin page
var renderAdmin = function (req, res, next) {
  Q.all(OFFICE_IDS.map(function (officeId) { return Q.nfcall(fs.readFile, path.join(global.dirMaps, officeId + '.svg')) }))
    .then(function (svgs) {
      var context = {
        svgs: _.zipObject(OFFICE_IDS, svgs),
        config: JSON.stringify({
          mountPoint: global.config.mountPoint
        })
      }
      res.render('admin', context)
    }).fail(next)
}

// Render floorplan
var renderFloorplan = function (req, res, next) {
  var officeId = req.params.office || global.officeNames[0]
  global.logger.log('info', 'Attempting to render: ' + officeId)
  if (_.contains(OFFICE_IDS, officeId)) {
    Q.all([
      OFFICE_IDS.map(function (officeId) { return Q.nfcall(fs.readFile, path.join(global.dirMaps, officeId + '.svg')) })
    ]).spread(function (svg) {
      var context = {
        officeId: officeId,
        officeName: global.officeName[officeId],
        svg: svg,
        config: JSON.stringify(_.pick(global.mountPoint))
      }
      global.logger.log('info', 'Rendering floorplan for ' + officeId)
      res.render('floorplan', context)
    }).fail(next)
  } else {
    next()
  }
}

// ===== Handle /people requests =====

app.route('/people')
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

app.route('/people:id')
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

app.get(/^\/people\/(\w+)\/photo(?:\.jpg)?$/, function (req, res, next) {
  req.url = '/photos/' + req.params[0] + '.jpg'
  photoStaticHandler(req, res, next)
})

app.post('/people/:id/photo', function (req, res, next) {
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

// ===== Additional routing logic =====

app.get('/', renderFloorplan)
app.get('/:office', renderFloorplan)
app.get('/admin/', renderAdmin)
app.get('/admin/:id', renderAdmin)
app.get('/endpoints', function (req, res) {
  res.json(req.body)
})
app.get('/endpoints/status', function (req, res) {
  res.json(req.body)
})
app.get('/endpoints/:id/photo', function (req, res) {
  req.url = '/photos/' + req.params.id + '.jpg'
  photoStaticHandler(req, res)
})

// ===== Completion =====

global.logger.log('info', 'Routes loaded')
