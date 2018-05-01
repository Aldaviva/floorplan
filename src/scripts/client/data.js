import $ from 'jquery'
import urljoin from 'url-join'

export class StdContext {
  constructor (...args) {
    this.baseURL = args.baseURL
    this.companyName = args.companyName
    this.depTeams = args.depTeams
    this.offices = args.offices
    this.supportContact = args.supportContact
  }
}
export class Data {
  static selfBaseURL () {
    let result = urljoin(window.location.host, window.location.port)
    window.console.log(result)
    return result
  }

  static nodeData () {
    return $.parseJSON($.getJSON(urljoin(this.selfBaseURL, 'dataJSON').toString))
  }
}
