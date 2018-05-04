import got from 'got'
import setImmediate from 'setimmediate' // needed by "got"
import urlJoin from 'proper-url-join'

// Use this to provide data from the NodeJS instance
export class NodeData {
  static get () {
    // Obtain data
    let inNodeData
    got.get(urlJoin(window.location.protocol + '/exportNodeData'), {'Content-Type': 'application/json'})
      .then((data) => { inNodeData = new Map(Object.entries(JSON.parse(data))) })
    // Parse data
    let baseURL = inNodeData.get('baseURL') || ''
    let companyName = inNodeData.get('companyName') || ''
    let depTeams = inNodeData.get('depTeams') || []
    let offices = inNodeData.get('offices') || []
    let supportContact = inNodeData.get('supportContact') || ''
    return { baseURL, companyName, depTeams, offices, supportContact }
  }
}
