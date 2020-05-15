/* index.js calls this file */

// Load configuration globally
require('./config')

// Load other modules
const services = require('./services')
const helpers = require('./helpers')
const feathers = require('@feathersjs/feathers')
const express = require('@feathersjs/express')
const path = require('path')
const hbs = require('express-hbs')
const expressWinston = require('express-winston')

// Create Feathers-Express app
const app = express(feathers())
app.configure(express.rest())
  .use(expressWinston.logger({ winstonInstance: global.logger })) // tie to logger
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .set('view engine', 'hbs')
  .engine('hbs', hbs.express4({
    partialsDir: path.join(global.dirViews, 'partials')
  }))
  .set('views', global.dirViews)
  .use(express.static('public'))
  .use(require('connect-favicons')(path.join(global.dirPublic, '')))
  .use(require('connect-slashes')(false))
  .get('/endpoints', (req, res) => { res.json({ message: 'true' }) }) // this used to be some Storm thing
  .get('/endpoints/status', (req, res) => { res.json({ message: 'true' }) }) // this used to be some Storm thing
  .use('/people', services.people)
  .get('/exportNodeData', services.exportNodeData)
  .get('/admin', services.renderAdmin)
  .get('/', services.renderFloorplan)

// Register HBS helpers
hbs.registerHelper('adminInputLabels', helpers.officeInputLabels)
hbs.registerHelper('depTeamInputLabels', helpers.depTeamInputLabels)
hbs.registerHelper('svgAdminMaps', helpers.svgAdminMaps)

// Start server
const server = app.listen(global.wwwPort)
server.on('listening', () => {
  const goneLive = `Feathers/Express app active on port ${global.wwwPort}`
  console.log(goneLive)
  // global.logger.log(goneLive)
})
