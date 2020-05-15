// Use this to provide data from the NodeJS instance
export class NodeData {
  constructor () {
    const nodeMap = new Map()
    require('node-fetch').fetch(require('proper-url-join').urlJoin(`${window.location.protocol}/exportNodeData`))
      .then(res => res.json())
      .then(json => nodeMap)
  }

  static get () {
    // Parse data
    const baseURL = this.nodeMap.get('baseURL') || ''
    const companyName = this.nodeMap.get('companyName') || ''
    const depTeams = this.nodeMap.get('depTeams') || []
    const offices = this.nodeMap.get('offices') || []
    const supportContact = this.nodeMap.get('supportContact') || ''
    return { baseURL, companyName, depTeams, offices, supportContact }
  }
}
