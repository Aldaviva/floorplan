/*
Helpers for HandlebarsJS, and other functions
*/

const _ = require('lodash')
const fs = require('fs')
const path = require('path')

// General: process an SVG file
function getSVG (officeID) {
  let SVG
  try {
    SVG = fs.readFileSync(path.join(global.dirMaps, `${officeID}.svg`))
  } catch (error) {
    global.logger.log('error', 'Problem loading SVG file for %s', officeID)
    SVG = ''
  }
  return SVG
}

// HBS: Office input label generator
function officeInputLabels () {
  const OFFICES = []
  for (const curOffice of global.offices) {
    global.logger.log('debug', 'adminInputLabels: %s', curOffice.name)
    OFFICES.push(`<label><input name="office" value="${curOffice.officeID}" type="radio" />${curOffice.name}</label>`)
  }
  return _.flatten(OFFICES).toString()
}

// HBS: DepTeam input label generator
function depTeamInputLabels () {
  const DT = []
  for (const curDT of global.depTeams) {
    global.logger.log('debug', 'depTeamInputLabels: %s', curDT.name)
    DT.push(`<label><input name="tags" value="${curDT.ID}" type="checkbox"/><span>${curDT.name}</span></label>`)
  }
  return _.flatten(DT).toString()
}

// HBS: SVG display mount in Admin
function svgAdminMaps () {
  // Step 1: build array of SVG content
  const SVGContent = []
  for (const curOffice of global.offices) {
    global.logger.log('debug', 'svgAdminMaps: %s', curOffice.name)
    SVGContent.push(`<div class="map small"${curOffice.officeID}>'${getSVG(curOffice.officeID)}'</div>`)
  }
  // Step 2: provide content to render
  return _.flatten(SVGContent).toString()
}

module.exports = { officeInputLabels, depTeamInputLabels, getSVG, svgAdminMaps }
