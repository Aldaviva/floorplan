require('./lib/underscore')
var Backbone = require('./lib/backbone').Backbone
var $ = require('./lib/jquery')
var _ = require('./lib/lodash')
var urljoin = require('./lib/url-join')

exports = function data () {
  // Person
  this.Person = Backbone.Model.extend({
    idAttribute: '_id',
    getPhotoPath: function () {
      if (this.id) {
        return urljoin(this.baseURL, '/people', this.id + '/photo')
      } else {
        return urljoin(this.baseURL, '/images/missing_photo.jpg')
      }
    },
    getLinkedInProfileUrl: function () {
      var profileId = this.get('linkedInId')
      return (profileId) ? this.Person.linkedInIdToUrl(profileId) : null
    },
    defaults: {
      tags: []
    }
  }, {
    linkedInUrlToId: function (profileUrl) {
      var profileId = null

      var matches = profileUrl.match(/linkedin\.com\/(in\/[A-Za-z0-9\-_]+)/)
      if (matches) {
        profileId = matches[1]
      } else {
        matches = profileUrl.match(/linkedin\.com\/profile\/view\?id=([A-Za-z0-9\-_]+)/)
        if (matches) {
          profileId = matches[1]
        }
      }

      return profileId
    },
    linkedInIdToUrl: function (profileId) {
      if (/^in\//.test(profileId)) {
        return 'https://www.linkedin.com/' + profileId
      } else {
        return 'https://www.linkedin.com/profile/view?id=' + profileId
      }
    }
  })

  // people
  this.people = new (Backbone.Collection.extend({
    model: this.Person,
    url: urljoin(this.baseURL, '/people'),
    comparator: 'fullname'
  }))()

  // endpoint status
  this.Endpoint = Backbone.Model.extend({
    /**
         * @return one of "offline", "in a call", "reserved", or "available"
         */
    getAvailability: function () {
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
  })

  // endpoints
  this.endpoints = new (Backbone.Collection.extend({
    model: this.Endpoint,
    url: urljoin(this.baseURL, '/endpoints'),
    initialize: function () {
      _.bindAll(this)
    },
    fetchStatuses: function () {
      return $.getJSON(this.url + '/status')
        .done(_.bind(function (statuses) {
          _.forEach(statuses, function (status) {
            var endpoint = this.get(status.endpointId)
            endpoint.set({ status: _.omit(status, 'endpointId') })
          }, this)
        }, this))
    }
  }))()
}
