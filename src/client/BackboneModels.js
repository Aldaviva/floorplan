import { bind, omit } from 'lodash-es'
import Backbone from 'backbone_es6'
import urlJoin from 'proper-url-join'
import './DataClasses'

// jQuery
const jQuery = require('jquery')
window.jQuery = jQuery
window.$ = jQuery.jQ$
window.jQ$ = jQuery.jQ$

// ============================
// ========== Person ==========
// ============================

export class Person extends Backbone.Model {
  constructor (...args) {
    super(...args)
    this.idAttribute = '_id'
    this.tags = []
  }

  getPhotoPath () {
    return urlJoin(this.url, this.id ? (`/people:${this.id}/photo`) : '/images/missing_photo.jpg')
  }

  getLinkedInProfileUrl () {
    const profileId = this.get('linkedInId')
    return profileId ? this.linkedInIdToUrl(profileId) : null
  }

  linkedInUrlToId (profileUrl) {
    let profileId = null
    let matches = profileUrl.match(/linkedin\.com\/(in\/[A-Za-z0-9\-_]+)/)
    if (matches) {
      profileId = matches[1]
    } else {
      matches = profileUrl.match(/linkedin\.com\/profile\/view\?id=([A-Za-z0-9\-_]+)/)
      if (matches) {
        profileId = matches[1]
      }
    }
    return profileId
  }

  linkedInIdToUrl (profileId) {
    if (/^in\//.test(profileId)) {
      return `https://www.linkedin.com/${profileId}`
    }
    return `https://www.linkedin.com/profile/view?id=${profileId}`
  }
}

// ============================
// ========== People ==========
// ============================

export class People extends Backbone.Collection {
  constructor (...args) {
    super(...args)
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
    const status = super.get('status')
    if ((new Date() - (5 * 60 * 1000)) > status.timestamp) {
      return 'offline'
    } else if (status.callActive) {
      return 'in a call'
    } else if (status.reserved) {
      return 'reserved'
    }
    return 'available'
  }
}

// ============================
// ======== Endpoints =========
// ============================

export class Endpoints extends Backbone.Collection {
  constructor (...args) {
    super(...args)
    this.model = Endpoint
    this.url = '/endpoints'
  }

  fetchStatuses () {
    return jQuery.getJSON(`${this.url}/status`)
      .done(bind((statuses) => {
        statuses.forEach((status) => {
          this.get(status.endpointId).set({ status: omit(status, 'endpointId') })
        }, this)
      }, this))
  }
}
