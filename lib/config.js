// Index.json will load this file first, so all the globals will take effect.

// Load from config/default.json
const path = require('path')
const config = module.exports = require('config')
global.companyName = config.get('companyName') || 'The Company'
global.dbHost = config.get('dbHost') || 'localhost'
global.dbName = config.get('dbName') || 'floorplan'
global.dbPort = config.get('dbPort') || '27017'
global.dirData = path.normalize(config.get('dirData')) || '/opt/floorplan/data'
global.dirPublic = path.normalize(config.get('dirPublic')) || '/opt/floorplan/public'
global.dirViews = path.normalize(config.get('dirViews')) || '/opt/floorplan/views'
global.dirRoot = path.normalize(config.get('dirRoot')) || '/opt/floorplan'
global.logfile = path.normalize(config.get('logFile')) || '/var/log/floorplan.log'
global.loglevel = config.get('logLevel') || 'info'
global.mountPoint = config.get('mountPoint') || '/'
global.wwwPort = config.get('wwwPort') || '3001'
global.offices = config.get('offices') || [
  {'officeId': 'mv', 'name': 'Mountain View', 'address': '', 'phone': '', 'fax': '', 'email': ''},
  {'officeId': 'remote', 'name': 'remote workers', 'address': '', 'phone': '', 'fax': '', 'email': ''}
]

// Create additional variables
global.dirMaps = path.join(global.dirViews, 'maps')
global.dirPhotos = path.join(global.dirData, 'photos')

// Create logger
global.logger = require('winston')
global.logger.configure({
  transports: [
    new (global.logger.transports.File)({ filename: global.logfile, level: global.loglevel })
  ]
})

// Indicate logging is working, and config is sound.
global.logger.log('info', '===== Config loaded ======')
global.logger.log('info', 'Root dir is %s', global.dirRoot)
global.logger.log('info', 'Maps will be loaded from %s', global.dirMaps)
global.logger.log('info', 'Photos will be loaded from %s', global.dirPhotos)
global.logger.log('info', 'Found info for %s offices', global.offices.length)
global.logger.log('info', '===========')
