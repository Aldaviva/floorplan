require('../lib/jquery.js')
require('../lib/underscore.js')
require('../lib/backbone.js')
require('../lib/lodash.js')

module.exports = class Models {
  // ============================
  // =========== data ===========
  // ============================
  data () {
    // Person
    this.Person = Backbone.Model.extend({
      idAttribute: '_id',
      getPhotoPath: function () {
        if (this.id) {
          return urljoin(global.baseURL, '/people', this.id + '/photo')
        } else {
          return urljoin(global.baseURL, '/images/missing_photo.jpg')
        }
      },
      getLinkedInProfileUrl: function () {
        var profileId = this.get('linkedInId')
        return (profileId) ? Person.linkedInIdToUrl(profileId) : null
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
      model: Person,
      url: urljoin(global.baseURL, '/people'),
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
      model: Endpoint,
      url: urljoin(global.baseURL, '/endpoints'),
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

    return this.data
  }

  // ============================
  // =========== yelp ===========
  // ============================

  yelp () {
    var ACCESS_PARAMS = {
      consumerKey: 'wq6N1ApR2G6CvL1d5IhKFQ',
      consumerSecret: '6_G7aiIJVO4ZugkN4VmE1rkzYN8',
      token: 'EbVtea8l0sAcWn85sFZ1xm_4tpRhv-yf',
      tokenSecret: '7gtqhRMHYvuAnKfUwLGi5mofBe8'
    }

    var REQ_PARAMS = [
      ['callback', 'cb'],
      ['oauth_consumer_key', ACCESS_PARAMS.consumerKey],
      ['oauth_consumer_secret', ACCESS_PARAMS.consumerSecret],
      ['oauth_token', ACCESS_PARAMS.token],
      ['oauth_signature_method', 'HMAC-SHA1']
    ]

    function _sendRequest (urlTail, method) {
      var requestEnvelope = {
        action: 'http://api.yelp.com/v2/' + urlTail,
        method: method || 'GET',
        parameters: REQ_PARAMS
      }

      OAuth.setTimestampAndNonce(requestEnvelope)
      OAuth.SignatureMethod.sign(requestEnvelope, {
        consumerSecret: ACCESS_PARAMS.consumerSecret,
        tokenSecret: ACCESS_PARAMS.tokenSecret
      })

      var parameterMap = OAuth.getParameterMap(requestEnvelope.parameters)
      parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

      return $.ajax({
        url: requestEnvelope.action,
        type: requestEnvelope.method,
        dataType: 'jsonp',
        data: parameterMap,
        jsonpCallback: 'cb',
        cache: true
      })
    }

    function getRating (yelpId) {
      return _sendRequest('business/' + yelpId, 'GET')
        .then(function (data) {
          return {
            stars: data.rating,
            reviews: data.review_count,
            img: data.rating_img_url
          }
        })
    }

    return {
      getRating: getRating
    }
  }

  // ============================
  // ===== personDetailsView ====
  // ============================

  personDetailsView () {
    this.personDetailsView = Backbone.View.extend({

      className: 'personDetailsView detailsView',

      initialize: function () {
        _.bindAll(this)

        this.els = {}
      },

      render: function () {
        if (this.$el.is(':empty')) {
          this.els.photo = $('<img>', { class: 'photo' })
          this.els.name = $('<h2>', { class: 'name' })
          this.els.title = $('<h3>', { class: 'title' })

          this.$el.append(this.els.photo)
          this.$el.append(this.els.name)
          this.$el.append(this.els.title)

          this.els.email = $('<a>')
          this.els.linkedInProfile = $('<a>', { text: 'view profile', target: '_blank' })
          this.els.workPhone = $('<dd>')
          this.els.mobilePhone = $('<dd>')

          var dl = $('<dl>')

          dl.append($('<dt>', { text: 'Email' }))
          dl.append($('<dd>').append(this.els.email))

          dl.append($('<dt>', { text: 'LinkedIn' }))
          dl.append($('<dd>').append(this.els.linkedInProfile))

          dl.append($('<dt>', { text: 'Mobile' }))
          dl.append(this.els.mobilePhone)

          dl.append($('<dt>', { text: 'Work' }))
          dl.append(this.els.workPhone)

          this.$el.append(dl)
        }

        if (this.model) {
          this.els.photo.attr('src', this.model.getPhotoPath())
          this.els.name.text(this.model.get('fullname'))
          this.els.title.text(this.model.get('title') || '')

          var email = this.model.get('email')
          this.els.email
            .attr('href', 'mailto:' + email + ((email || '').indexOf('@') == -1 ? '@bluejeans.com' : ''))
            .text(email)
            .closest('dd').prev('dt').addBack().toggle(!!email)

          this.els.linkedInProfile
            .attr('href', this.model.getLinkedInProfileUrl())
            .closest('dd').prev('dt').addBack().toggle(!!this.model.get('linkedInId'))

          this.els.mobilePhone
            .text(formatPhoneNumber(this.model.get('mobilePhone')))
            .prev('dt').addBack().toggle(!!this.model.get('mobilePhone'))

          this.els.workPhone
            .text(formatPhoneNumber(this.model.get('workPhone')))
            .prev('dt').addBack().toggle(!!this.model.get('workPhone'))

          this.$el.show()
        } else {
          this.$el.hide()
        }

        return this.el
      }
    })

    function formatPhoneNumber (phoneNumber) {
      if (phoneNumber) {
        return phoneNumber.replace(/[\(\)]/g, '').replace(/[\.]/g, '-')
      } else {
        return phoneNumber
      }
    }

    return this.personDetailsView
  }
}
