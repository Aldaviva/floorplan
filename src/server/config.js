/* Index.json will load this file first, so all the globals will take effect. */

// Load from config/default.json
const path = require('path')
const config = module.exports = require('config')
global.baseURL = config.get('baseURL') || '/'
global.companyName = config.get('companyName') || 'The Company'
global.dbHost = config.get('dbHost') || 'localhost'
global.dbName = config.get('dbName') || 'floorplan'
global.dbPort = config.get('dbPort') || '27017'
global.dirData = path.normalize(config.get('dirData')) || '/opt/floorplan/data'
global.dirMaps = path.normalize(config.get('dirMaps')) || '/opt/floorplan/data/maps/default'
global.dirPublic = path.normalize(config.get('dirPublic')) || '/opt/floorplan/public'
global.dirRoot = path.normalize(config.get('dirRoot')) || '/opt/floorplan'
global.logfile = path.normalize(config.get('logFile')) || '/var/log/floorplan.log'
global.loglevel = config.get('logLevel') || 'info'
global.wwwPort = config.get('wwwPort') || '3001'
global.supportContact = config.get('supportContact') || 'admin@example.org'
global.depTeams = config.get('depTeams') || [
  { ID: 'biz', name: 'Business', contact1: '', contact2: '' },
  { ID: 'it', name: 'Information Technology', contact1: '', contact2: '' }
]
global.offices = config.get('offices') || [
  { officeID: 'mv', name: 'Mountain View', address: '', phone: '', fax: '', email: '' },
  { officeID: 'remote', name: 'remote workers', address: '', phone: '', fax: '', email: '' }
]

// Create additional variables
global.dirViews = path.join(global.dirData, 'views')
global.dirPhotos = path.join(global.dirData, 'photos')

// Create logger
global.logger = require('winston')
global.logger.configure({
  transports: [
    new (global.logger.transports.File)({ filename: global.logfile, level: global.loglevel })
  ]
})

// Indicate logging is working, and config is sound.
global.logger.log('info', 'CONFIG: Root dir is %s', global.dirRoot)
global.logger.log('info', 'CONFIG: Data dir is %s', global.dirData)
global.logger.log('info', 'CONFIG: Views dir is %s', global.dirViews)
global.logger.log('info', 'CONFIG: Public dir is %s', global.dirPublic)
global.logger.log('info', 'CONFIG: Found info for %s offices', global.offices.length)
