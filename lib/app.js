// === index.js calls this file ===

// Load configuration globally
require('./config')

// Load database
const database = require('./database')
database.connect.then(value => {
  global.logger.log('info', 'Connected to database: URL is %s', value)
}).catch(err => {
  global.logger('error', err)
})

// Load other modules
const services = require('./services')
const helpers = require('./helpers')
const feathers = require('@feathersjs/feathers')
const express = require('@feathersjs/express')
const path = require('path')
const hbs = require('express-hbs')

// Create Feathers-Express app
const app = express(feathers())
app.configure(express.rest())
  .use(require('express-winston').logger({ winstonInstance: global.logger })) // tie to logger
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .set('view engine', 'hbs')
  .engine('hbs', hbs.express4({
    partialsDir: path.join(global.dirViews, 'partials')
  }))
  .set('views', global.dirViews)
  .use(express.static('public'))
  .use(require('connect-favicons')(path.join(global.dirPublic, 'icons')))
  .use(require('connect-slashes')(false))
  .get('/endpoints', function (req, res, next) { res.json({ message: 'true' }) }) // this used to be some Storm thing
  .get('/endpoints/status', function (req, res, next) { res.json({ message: 'true' }) }) // this used to be some Storm thing
  .use('/people', services.people)
  .get('/dataJSON', services.dataJSON)
  .get('/dataMP', services.dataMP)
  .get('/admin', services.renderAdmin)
  .get('/', services.renderFloorplan)

// Register HBS helpers
hbs.registerHelper('adminInputLabels', helpers.officeInputLabels)
hbs.registerHelper('depTeamInputLabels', helpers.depTeamInputLabels)
hbs.registerHelper('svgAdminMaps', helpers.svgAdminMaps)

// Start server
const server = app.listen(global.wwwPort)
server.on('listening', () => {
  const goneLive = 'Feathers/Express app active on port ' + global.wwwPort
  console.log(goneLive)
  global.logger.log(goneLive)
})
