// npm + Browserify dependencies
import jQuery from 'jquery'
import _ from 'lodash'
import Backbone from '../lib_custom/backbone-min'
import urlJoin from 'proper-url-join'
// import { NodeData } from './DataClasses'

// !!! Before version 3.0, this was mainly "data.js" !!!

// ============================
// ========== Person ==========
// ============================

export class Person extends Backbone.Model {
  initialize () {
    this.idAttribute = '_id'
    this.defaults = { tags: [] }
  }

  getPhotoPath () {
    return urlJoin(this.url, this.id ? ('/people' + this.id + '/photo') : '/images/missing_photo.jpg')
  }

  getLinkedInProfileUrl () {
    let profileId = this.get('linkedInId')
    return profileId ? this.linkedInIdToUrl(profileId) : null
  }

  linkedInUrlToId (profileUrl) {
    let profileId = null
    let matches = profileUrl.match(/linkedin\.com\/(in\/[A-Za-z0-9\-_]+)/)
    if (matches) profileId = matches[1]
    else {
      matches = profileUrl.match(/linkedin\.com\/profile\/view\?id=([A-Za-z0-9\-_]+)/)
      if (matches) profileId = matches[1]
    }
    return profileId
  }

  linkedInIdToUrl (profileId) {
    if (/^in\//.test(profileId)) return 'https://www.linkedin.com/' + profileId
    else return 'https://www.linkedin.com/profile/view?id=' + profileId
  }
}

// ============================
// ========== People ==========
// ============================

export class People extends Backbone.Collection {
  constructor (...args) {
    super(...args)
    const options = new Map(Array.from(...args))
    if (options.has('window')) this.window = options.get('window')
  }

  initialize () {
    this.model = Person
    this.url = '/people'
    this.comparator = 'fullname'
  }
}

// ============================
// ======== Endpoint ==========
// ============================

export class Endpoint extends Backbone.Model {
  /**
  * @return one of "offline", "in a call", "reserved", or "available"
  */
  getAvailability () {
    let status = this.get('status')
    if ((new Date() - (5 * 60 * 1000)) > status.timestamp) {
      return 'offline'
    } else if (status.callActive) {
      return 'in a call'
    } else if (status.reserved) {
      return 'reserved'
    } else {
      return 'available'
    }
  }
}

// ============================
// ======== Endpoints =========
// ============================

export class Endpoints extends Backbone.Collection {
  constructor (...args) {
    super(...args)
    this.argMap = new Map(Object.entries(args[0]))
    this.window = this.argMap.get('window') || window
  }

  initialize () {
    this.model = Endpoint
    this.url = '/endpoints'
  }

  fetchStatuses () {
    return jQuery.getJSON(this.url + '/status')
      .done(_.bind((statuses) => {
        statuses.forEach((status) => {
          let endpoint = this.window.get(status.endpointId)
          endpoint.set({ status: _.omit(status, 'endpointId') })
        }, this.window)
      }, this))
  }
}
