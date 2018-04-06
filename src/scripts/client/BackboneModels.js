// Before version 3.0, this was mainly "data.js"

/*
import { $, jQuery } from '../lib/jquery.js'
import { _, underscore } from '../lib/underscore.js'
import { Backbone } from '../lib/backbone.js'
import { urljoin } from '../lib/url-join.js'
*/

// Async calls per http://requirejs.org/docs/errors.html#notloaded
// RequireJS + Babel isn't smart enough for imports (yet)
const $ = require(['./lib/jquery'], () => {})
const _ = require(['./lib/underscore'], () => {})
const Backbone = require(['./lib/backbone'], () => {})
const urljoin = require(['./lib/url-join'], () => {})

// ============================
// ========== Person ==========
// ============================

class Person extends Backbone.Model {
  constructor (...args) {
    super(...args)
    this.idAttribute = '_id'
    this.defaults = {
      tags: []
    }
  }

  getPhotoPath () {
    if (this.id) {
      return urljoin(this.baseURL, '/people', this.id + '/photo')
    } else {
      return urljoin(this.baseURL, '/images/missing_photo.jpg')
    }
  }

  getLinkedInProfileUrl () {
    let profileId = this.get('linkedInId')
    return (profileId) ? this.Person.linkedInIdToUrl(profileId) : null
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

class People extends Backbone.Collection {
  constructor (...args) {
    super(...args)
    this.model = Person
    this.url = urljoin(window.baseURL, '/people')
    this.comparator = 'fullname'
  }
}

// ============================
// ======== Endpoint ==========
// ============================

class Endpoint extends Backbone.Model {
  /**
  * @return one of "offline", "in a call", "reserved", or "available"
  */
  getAvailability () {
    var status = this.get('status')
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

class Endpoints extends Backbone.Collection {
  constructor (...args) {
    super(...args)
    this.model = Endpoint
    this.url = urljoin(window.baseURL, '/endpoints')
  }

  initialize () {
    _.bindAll(this)
  }

  fetchStatuses () {
    return $.getJSON(this.url + '/status')
      .done(_.bind(function (statuses) {
        _.forEach(statuses, function (status) {
          var endpoint = this.get(status.endpointId)
          endpoint.set({ status: _.omit(status, 'endpointId') })
        }, this)
      }, this))
  }
}

// RequireJS + Babel isn't smart enough for exports (yet)
module.exports = [ People, Person, Endpoints, Endpoint ]
// export default { People, Person, Endpoints, Endpoint }
