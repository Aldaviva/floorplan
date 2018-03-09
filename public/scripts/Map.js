this.Map = (function () {
  var SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

  /*
   * options: {
   *     office: 'mv',
   *     skipFilters: false,
   *     skipEndpoints: false
   * }
   */
  var Map = Backbone.View.extend({

    events: {
      'click .photos image': 'onIconClick',
      'click .seats rect': 'onSeatClick',
      'click .roomNames .roomArea': 'onRoomClick',
      'click .arrow': 'onArrowClick'
    },

    initialize: function () {
      _.bindAll(this)

      this.collection.on('reset', this.addMany)
      this.collection.on('add', this.addOne)
      this.collection.on('change:office', this.addOne)

      this.photosGroup = this.$('.photos')
      this.seatsGroup = this.$('.seats')
      this.activeRectangle = null

      this.clockUpdateInterval = null

      mediator.subscribe('activatePersonConfirmed', this.activatePersonConfirmed)
      if (!this.options.skipFilters) {
        mediator.subscribe('filterByTag', this.filterByTag)
        mediator.subscribe('change:query', this.filterByName)
      }

      if (!this.options.skipEndpoints) {
        data.endpoints.on('change:status', this.renderEndpointBadge)
      }
    },

    render: function () {
      if (this.seatsGroup.is(':empty')) {
        var seatData = SEATS[this.options.office]
        var seatPositions = seatData.seatPositions
        var numSeats = seatPositions.length
        var iconSize = seatData.iconSize

        var seatsFragment = document.createDocumentFragment()
        for (var seatIdx = 0; seatIdx < numSeats; seatIdx++) {
          var deskEl = document.createElementNS(SVG_NAMESPACE, 'rect')
          var coords = seatPositions[seatIdx]
          $(deskEl).attr({
            width: iconSize,
            height: iconSize,
            x: coords[0],
            y: coords[1],
            'data-desk': seatIdx
          })
          seatsFragment.appendChild(deskEl)
        }
        this.seatsGroup.append(seatsFragment)

        if (this.$('.clockHand').length > 0) {
          this.initClockUpdate()
        }
      }
      return this.el
    },

    addMany: function (coll) {
      var iconsFragment = document.createDocumentFragment()

      coll.each(function (model) {
        if (model.get('office') == this.options.office) {
          iconsFragment.appendChild(this.createAndRenderPersonIcon(model))
        }
      }, this)

      this.photosGroup.append(iconsFragment)
    },

    addOne: function (person) {
      if (person.get('office') == this.options.office) {
        this.photosGroup.append(this.createAndRenderPersonIcon(person))
      }
      this.renderActiveSeat(null) // remove blue active seat marker when leaving an office
    },

    createAndRenderPersonIcon: function (person) {
      var personIcon = new PersonIcon({ model: person })
      return personIcon.render()
    },

    onIconClick: function (event) {
      var model = $(event.currentTarget).data('model')
      mediator.publish('map:clickPerson', model)
    },

    onSeatClick: function (event) {
      var deskId = $(event.currentTarget).data('desk')
      this.renderActiveSeat(deskId)
      mediator.publish('map:clickDesk', deskId)
    },

    onRoomClick: function (event) {
      if (!this.options.skipEndpoints) {
        var roomEl = $(event.currentTarget).closest('.room')
        var endpointId = roomEl.attr('endpoint:id')
        mediator.publish('map:clickRoom', endpointId, { seatingCapacity: roomEl.attr('endpoint:seatingCapacity') })
      }
    },

    onArrowClick: function (event) {
      switch (this.options.office) {
        case 'mv':
          window.location = (svgHasClass(event.currentTarget, 'right')) ? 'mv2' : 'mv3'
          break
        case 'mv2':
        case 'mv3':
          window.location = 'mv'
          break
        default:
          break
      }
    },

    filterByTag: function (params) {
      var tagsToShow = params.tagsToShow

      var peopleToHide = (tagsToShow != null)
        ? this.collection.filter(function (person) {
          var personTags = person.get('tags')
          return !personTags || !personTags.length || _.intersection(personTags, tagsToShow).length === 0
        })
        : []

      this.photosGroup.children().each(function (index, photoEl) {
        svgRemoveClass(photoEl, 'filtered_tag')
      })

      _.each(peopleToHide, function (personToHide) {
        var view = personToHide.views.mapIcon
        view && svgAddClass(view.el, 'filtered_tag')
      })
    },

    filterByName: function (query) {
      query = query.toLowerCase().trim()

      var peopleToHide = this.collection.filter(function (person) {
        return person.get('fullname').toLowerCase().indexOf(query) === -1
      })

      this.photosGroup.children().each(function (index, photoEl) {
        svgRemoveClass(photoEl, 'filtered_name')
      })

      _.each(peopleToHide, function (personToHide) {
        var view = personToHide.views.mapIcon
        view && svgAddClass(view.el, 'filtered_name')
      })
    },

    activatePersonConfirmed: function (model) {
      if (model.get('office') == this.options.office) {
        this.photosGroup.children().each(function (index, photoEl) {
          svgRemoveClass(photoEl, 'active')
        })

        var activeEl = model.views.mapIcon.el
        svgAddClass(activeEl, 'active')

        this.renderActiveSeat(model.get('desk'))
      }
    },

    renderActiveSeat: function (desk) {
      var activeSeatEl = this.seatsGroup.find('[class~=active]').get(0) // LOL chrome SVG attribute selectors
      activeSeatEl && svgRemoveClass(activeSeatEl, 'active')

      if (_.isNumber(desk)) {
        svgAddClass(this.seatsGroup.find('[data-desk=' + desk + ']')[0], 'active')
      }
    },

    renderEndpointBadge: function (endpoint, status) {
      var badgeEl = this.$(".roomNames .room[endpoint\\:id='" + endpoint.id + "'] .statusBadge").get(0)
      if (badgeEl) {
        var titleText = endpoint.getAvailability()
        var isAvailable = (titleText === 'available')

        setTitle(badgeEl, titleText)
        svgAddClass(badgeEl, 'loaded')
        svgRemoveClass(badgeEl, 'offline in-a-call reserved available')
        svgAddClass(badgeEl, endpoint.getAvailability().replace(/\s/g, '-'))
      }
    },

    initClockUpdate: function () {
      this.clockUpdateInterval && window.clearInterval(this.clockUpdateInterval)
      this.clockUpdateInterval = window.setInterval(this.renderClock, 60 * 1000)
      this.renderClock()
    },

    renderClock: function () {
      var hourHand = this.$('.clockHand.hours')
      var minuteHand = this.$('.clockHand.minutes')

      $.getJSON('http://floorplan.bluejeansnet.com:8080/taas/now?timezone=Europe/London')
        .done(function (londonTime) {
          var hourDegrees = ((londonTime.hours % 12 / 12) + (londonTime.minutes / 60 / 60)) * 360
          var minuteDegrees = ((londonTime.minutes / 60) + (londonTime.seconds / 60 / 60)) * 360

          var center = [hourHand.attr('x1'), hourHand.attr('y1')]
          hourHand
            .attr('transform', 'rotate(' + hourDegrees + ' ' + center[0] + ' ' + center[1] + ')')
            .css('visibility', 'visible')
          minuteHand
            .attr('transform', 'rotate(' + minuteDegrees + ' ' + center[0] + ' ' + center[1] + ')')
            .css('visibility', 'visible')
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.warn('failed to fetch current london time: ' + textStatus)
          console.warn(errorThrown)

          hourHand.css('visibility', 'hidden')
          minuteHand.css('visibility', 'hidden')
        })
    }
  })

  var PersonIcon = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this)
      this.setElement(document.createElementNS(SVG_NAMESPACE, 'image'))

      this.model.views = this.model.views || {}
      this.model.views.mapIcon = this

      this.$el.data('model', this.model)

      this.model.on('change:office', this.onChangeOffice)
      this.model.on('change:desk', this.onChangeDesk)
      this.model.on('change:photo', this.renderPhoto)

      this.iconSize = SEATS[this.model.get('office')].iconSize
    },

    render: function () {
      if (this.$el.is(':empty')) {
        setTitle(this.$el, this.model.get('fullname'))

        this.renderPhoto(this.model, this.model.getPhotoPath())
      }

      var desk = this.model.get('desk')
      var hasDesk = _.isNumber(desk)
      this.$el.toggle(hasDesk)
      if (hasDesk) {
        var coords = this.getSeatPosition(desk)
        if (coords) {
          this.$el.attr({
            width: this.iconSize,
            height: this.iconSize,
            x: coords[0],
            y: coords[1],
            'data-desk': desk
          })
        } else {
          console.warn('office ' + this.model.get('office') + ' has no desk at index ' + desk)
        }
      }

      return this.el
    },

    onChangeOffice: function (person, office) {
      this.remove()
    },

    onChangeDesk: function (person, desk) {
      this.render()
    },

    renderPhoto: function (person, photoPath) {
      this.el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', photoPath)
    },

    getSeatPosition: function (deskId) {
      return SEATS[this.model.get('office')].seatPositions[deskId]
    }
  })

  /**
   * Would love to use jQuery here, but jQuery's *Class() methods expect el.className to be a String.
   * In SVG land, it's an SVGAnimatedString object, with baseVal and animVal children.
   * Modern browsers expose el.classList with add() and remove(), but IE 10 does not, so we must reimplement.
   *
   * @param SVGElement el - element with the class attribute to modify; not jQuery-wrapped (ex: <image> element)
   * @param String classStr - the class to add; separate multiple classes with whitespace (ex: "active hover")
   */
  function svgAddClass (el, classStr) {
    var oldClassList = el.className.baseVal.split(/\s/)
    var newClassList = _.compact(_.unique(oldClassList.concat(classStr.split(/\/s/))))
    el.className.baseVal = newClassList.join(' ')
  }

  /**
   * Similar to svgAddClass, we cannot use jQuery or el.classList.
   *
   * @param SVGElement el - element with the class attribute to modify; not jQuery-wrapped (ex: some <image> element)
   * @param String classStr - the class to remove; separate multiple classes with whitespace (ex: "active hover")
   */
  function svgRemoveClass (el, classStr) {
    var oldClassList = el.className.baseVal.split(/\s/)
    var newClassList = _.without.apply(null, [oldClassList].concat(classStr.split(/\s/)))
    el.className.baseVal = newClassList.join(' ')
  }

  function svgHasClass (el, classStr) {
    var classList = el.className.baseVal.split(/\s/)
    return _.contains(classList, classStr)
  }

  function setTitle (el, titleText) {
    var titleEl = $(el).children('title')
    if (!titleEl.length) {
      titleEl = document.createElementNS(SVG_NAMESPACE, 'title')
      $(el).append(titleEl)
    }
    $(titleEl).text(titleText)
  }

  return Map
})()
