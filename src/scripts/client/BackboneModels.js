// npm + Browserify dependencies
import $ from 'jquery'
import _ from 'lodash'
import Backbone from 'backbone'
import urljoin from 'url-join'
import data from './data'

// !!! Before version 3.0, this was mainly "data.js" !!!

// ============================
// ========== Person ==========
// ============================

export class Person extends Backbone.Model {
  constructor (...args) {
    super({
      idAttribute: '_id',
      defaults: { tags: [] }
    })
  }

  getPhotoPath () {
    if (this.id) return urljoin(data.baseURL, '/people', this.id + '/photo')
    else return urljoin(data.baseURL, '/images/missing_photo.jpg')
  }

  getLinkedInProfileUrl () {
    let profileId = this.get('linkedInId')
    return (profileId) ? this.linkedInIdToUrl(profileId) : null
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
    super({
      model: Person,
      url: urljoin(data.baseURL, '/people'),
      comparator: 'fullname'
    })
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
    super({
      model: Endpoint,
      url: urljoin(data.baseURL, '/endpoints')
    })
  }

  initialize () {
    _.bindAll(this)
  }

  fetchStatuses () {
    return $.getJSON(this.url + '/status')
      .done(_.bind(function (statuses) {
        // WAS LODASH / UNDERSCORE
        statuses.forEach(function (status) {
          let endpoint = this.get(status.endpointId)
          endpoint.set({ status: _.omit(status, 'endpointId') })
        }, this)
      }, this))
  }
}
