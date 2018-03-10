// === lib/app.js calls this file ===
// Reimplimented the old "routes" folder as Feathers "services"

const personRepository = require('./personRepository')
const photoManager = require('./photoManager')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Q = require('q')
const url = require('url')
const OFFICE_IDS = []
const FIELD_WRITE_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone']
// const photoStaticHandler = require('@feathersjs/express').static(path.join(global.dirRoot, 'data'), { maxAge: 4 * 60 * 60 * 1000 })

// ===== Assorted functions and custom middleware =====

// Populate "OFFICE_IDS" with list of office ids from config
global.offices.forEach(function (office) {
  OFFICE_IDS.push(office.officeId)
})
global.logger.log('debug', 'Prepared %s OFFICE_IDS ', OFFICE_IDS.length)

// Render admin page
exports.renderAdmin = function (req, res, next) {
  global.logger.log('debug', 'renderAdmin invoked: %s', req)
  Q.all(OFFICE_IDS.map(function (officeId) { return Q.nfcall(fs.readFile, path.join(global.dirMaps, officeId + '.svg')) }))
    .then(function (svgs) {
      global.logger.log('debug', 'renderAdmin called on %s', OFFICE_IDS)
      const context = {
        svgs: _.zipObject(OFFICE_IDS, svgs),
        companyName: global.companyName,
        supportContact: global.supportContact,
        config: JSON.stringify({
          mountPoint: global.mountPoint
        })
      }
      res.render('admin', context)
    })
    .fail(next)
}

// Render floorplan
exports.renderFloorplan = function (req, res, next) {
  global.logger.log('debug', 'renderFloorplan invoked: %s', req)
  const officeLookup = global.offices[0]
  const officeId = req.params.office || officeLookup.officeId // default to 1st office
  // TODO: fix dynamic office lookup
  global.logger.log('info', 'Attempting to render: ' + officeId)
  Q.all([
    OFFICE_IDS.map(function (officeId) { return Q.nfcall(fs.readFile, path.join(global.dirMaps, officeId + '.svg')) })
  ]).spread(function (svg) {
    global.logger.log('debug', 'renderFloorplan called on %s', OFFICE_IDS)
    const context = {
      companyName: global.companyName,
      officeId: officeLookup.officeId,
      officeName: officeLookup.officeName,
      svg: svg,
      supportContact: global.supportContact,
      config: JSON.stringify(_.pick(global.mountPoint))
    }
    global.logger.log('info', 'Rendering floorplan for ' + officeId)
    res.render('floorplan', context)
  })
    .fail(next)
}

exports.uploadPhoto = function (req, res, next) {
  const uploadedFile = req.files.photo
  const tempPath = uploadedFile.path
  const personId = req.params.id

  return photoManager.importPhoto(tempPath, personId + '.jpg')
    .then(function (imgInfo) {
      const basename = path.basename(imgInfo.path)

      const imageUrl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: global.mountPoint + '/people/' + personId + '/photo'
      })

      const payload = { files: [{
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
}

// ===== Routing logic =====

// -> /people + :id

exports.people = {
  async find (params) { return personRepository.findAll() },
  async get (id, params) { return personRepository.findOne(id) },
  async create (data, params) { personRepository.save(_.pick(data, FIELD_WRITE_WHITELIST)) },
  async update (id, data, params) {
    const sanitizedBody = _.pick(data, FIELD_WRITE_WHITELIST)
    sanitizedBody._id = id
    personRepository.save(sanitizedBody)
    // .then(res.send.bind(res))
    // .fail(next)
  },
  async patch (id, data, params) {},
  async remove (id, params) {
    personRepository.remove(id)
    // .then(function (numRemoved) { res.send(204) })
    // .fail(next)
  },
  setup (app, path) {}
}

/*
// Static photo in /^\/people\/(\w+)\/photo(?:\.jpg)?$/

exports.staticPhoto = {
  find (params) {
    return Promise.resolve([])
  },
  get (id, params) {
    return Promise.resolve(function () {
      req.url = '/photos/' + req.params[0] + '.jpg'
      photoStaticHandler(req, res, next)
    })
  },
  create (data, params) {},
  update (id, data, params) {},
  patch (id, data, params) {},
  remove (id, params) {},
  setup (app, path) {}
}
*/

/*
 * GET users listing.

exports.list = function(req, res){
  res.send("respond with a resource");
}

*/

// -> /test

exports.test = {
  async find (params) { return [] },
  async get (id, params) { return 'text: I wish this worked!' },
  async create (data, params) {},
  async update (id, data, params) {},
  async patch (id, data, params) {},
  async remove (id, params) {},
  setup (app, path) {}
}
