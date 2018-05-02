// === lib/app.js calls this file ===
// Reimplimented the old "routes" folder as Feathers "services"

// Load other app modules
const personRepository = require('./personRepository')
const photoManager = require('./photoManager')
const helpers = require('./helpers')

// Prepare this module
const _ = require('lodash')
const path = require('path')
const url = require('url')
const msgpack = require('msgpack5')()
const FIELD_WRITE_WHITELIST = ['fullname', 'desk', 'office', 'email', 'title', 'tags', 'linkedInId', 'mobilePhone', 'workPhone']

// ===== Assorted functions and custom middleware =====

// Standard context of data to pump into browser
const stdContext = {
  baseURL: global.baseURL,
  companyName: global.companyName,
  depTeams: global.depTeams,
  offices: global.offices,
  supportContact: global.supportContact
}

// Render stdContext as JSON
const dataJSON = function (req, res, next) {
  global.logger.log('debug', 'dataJSON')
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(stdContext))
}

// Render stdContext as MessagePack
const dataMP = function (req, res, next) {
  global.logger.log('debug', 'dataMP')
  res.setHeader('Content-Type', 'application/msgpack')
  res.send(msgpack.encode(stdContext))
}

// Render admin page
const renderAdmin = function (req, res, next) {
  global.logger.log('debug', 'renderAdmin')
  res.render('admin', { stdContext })
}

// Render floorplan
const renderFloorplan = function (req, res, next) {
  // TODO: fix dynamic office lookup
  // WAS LODASH / UNDERSCORE
  let index = global.offices.findIndex(offId => req.params.office === 'officeID')
  let office = global.offices[index] || global.offices[0] // default to 1st office
  global.logger.log('debug', 'Rendering floorplan for ' + office.officeID)
  res.render('floorplan', {stdContext, svg: helpers.getSVG(office.officeID)})
}

// Photo upload
const uploadPhoto = function (req, res, next) {
  let uploadedFile = req.files.photo
  let tempPath = uploadedFile.path
  let personId = req.params.id

  return photoManager.importPhoto(tempPath, personId + '.jpg')
    .then(function (imgInfo) {
      let basename = path.basename(imgInfo.path)
      let imageUrl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: (global.baseURL.trim + '/people' + personId + '/photo').replace('//', '/')
      })

      let payload = { files: [{
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
        json: () => {
          res.send(payload)
        },
        default: () => {
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

const people = {
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
 * GET users listing.
exports.list = function(req, res){
  res.send("respond with a resource");
}
*/

module.exports = {dataJSON, dataMP, renderAdmin, renderFloorplan, uploadPhoto, people}
