import got from 'got'
// import setImmediate from 'setimmediate' // needed by "got" (https://github.com/browserify/browserify/issues/1833)
import urlJoin from 'proper-url-join'

// Use this to provide data from the NodeJS instance
export class NodeData {
  static get () {
    // Obtain data
    let inNodeData
    got.get(urlJoin(`${window.location.protocol}/exportNodeData`), {'Content-Type': 'application/json'})
      .then((data) => { inNodeData = new Map(Object.entries(JSON.parse(data))) })
    // Parse data
    const baseURL = inNodeData.get('baseURL') || ''
    const companyName = inNodeData.get('companyName') || ''
    const depTeams = inNodeData.get('depTeams') || []
    const offices = inNodeData.get('offices') || []
    const supportContact = inNodeData.get('supportContact') || ''
    return { baseURL, companyName, depTeams, offices, supportContact }
  }
}
