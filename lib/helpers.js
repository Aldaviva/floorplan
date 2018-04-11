// === lib/app.js calls this file ===
// Helpers for HandlebarsJS, and other functions

const _ = require('lodash')
const fs = require('fs')
const path = require('path')

// General: process an SVG file
const getSVG = function (officeID) {
  let SVG
  try {
    SVG = fs.readFileSync(path.join(global.dirMaps, officeID + '.svg'))
  } catch (error) {
    global.logger.log('error', 'Problem loading SVG file for %s', officeID)
    SVG = ''
  }
  return SVG
}

// HBS: Office input label generator
const officeInputLabels = function () {
  let OFFICES = []
  for (let curOffice of global.offices) {
    global.logger.log('debug', 'adminInputLabels: %s', curOffice.name)
    OFFICES.push('<label><input name="office" value="' + curOffice.officeID + '" type="radio" />' + curOffice.name + '</label>')
  }
  return _.flattenDeep(OFFICES).toString()
}

// HBS: DepTeam input label generator
const depTeamInputLabels = function () {
  let DT = []
  for (let curDT of global.depTeams) {
    global.logger.log('debug', 'depTeamInputLabels: %s', curDT.name)
    DT.push('<label><input name="tags" value="' + curDT.ID + '" type="checkbox" /><span>' + curDT.name + '</span></label>')
  }
  return _.flattenDeep(DT).toString()
}

// HBS: SVG display mount in Admin
const svgAdminMaps = function () {
  // Step 1: build array of SVG content
  let SVGContent = []
  for (let curOffice of global.offices) {
    global.logger.log('debug', 'svgAdminMaps: %s', curOffice.name)
    SVGContent.push('<div class="map small"' + curOffice.officeID + '>' + getSVG(curOffice.officeID) + '</div>')
  }
  // Step 2: provide content to render
  return _.flattenDeep(SVGContent).toString()
}

module.exports = {officeInputLabels, depTeamInputLabels, getSVG, svgAdminMaps}
