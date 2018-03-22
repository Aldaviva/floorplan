require('../lib/jquery.js')
require('../lib/underscore.js')
require('../lib/backbone.js')
require('../lib/lodash.js')
require('../lib/url-join.js')
require('../lib/svg.js')
require('../lib/q.js')
var Models = require('./Models')

module.exports = class BackboneViews {
  constructor () {
    Models = new Models()
    var data = Models.data
    var yelp = Models.yelp
  }

  // ============================
  // ======= detailsPane ========
  // ============================

  detailsPane () {
    this.detailsPane = Backbone.View.extend({
      initialize: function () {
        _.bindAll(this)

        mediator.subscribe('activatePersonConfirmed', function (person, opts) {
          this.toggleIntro(false)
          this.setPersonModel(person)
        }, {}, this)

        mediator.subscribe('activateRoom', function (endpoint, opts) {
          this.toggleIntro(false)
          this.setRoomModel(endpoint)
        }, {}, this)

        /*
        this.introView = new IntroView()
        this.personDetailsView = new PersonDetailsView()
        this.roomDetailsView = new RoomDetailsView()
        */
      },

      render: function () {
        if (this.$el.is(':empty')) {
          var correctionsLink = $('<a>', {
            class: 'corrections',
            href: 'mailto:' + supportContact,
            text: 'Suggest a correction'
          })

          this.introView.$el
            .hide()
            .appendTo(this.$el)

          this.personDetailsView.$el
            .appendTo(this.$el)

          this.roomDetailsView.$el
            .appendTo(this.$el)

          this.$el.append(correctionsLink)
        }

        this.introView.render()
        this.personDetailsView.render()
        this.roomDetailsView.render()

        return this.el
      },

      setPersonModel: function (model) {
        this.personDetailsView.model = model
        this.roomDetailsView.model = null
        this.render()
      },

      setRoomModel: function (model) {
        this.personDetailsView.model = null
        this.roomDetailsView.model = model
        this.render()
      },

      toggleIntro: function (shouldShow) {
        this.introView.$el.toggle(!!shouldShow)
        this.personDetailsView.$el.toggle(!shouldShow)
        this.roomDetailsView.$el.toggle(!shouldShow)
      }
    })
  }

  // ============================
  // ========== editor ==========
  // ============================

  editor () {
    this.editor = Backbone.View.extend({

      events: {
        'click [type=submit]': 'save',
        'change input': 'onDirtyChange',
        'keyup input': function () { this.renderFormControls(true) },
        'click .contact .view_profile': 'viewLinkedInProfile',
        'click .basics .remove': 'removePerson',
        'click .desk.helper_link': 'enlargeMap'
      },

      initialize: function () {
        _.bindAll(this)

        var officeIDs = this.$('.office input[type=radio]').map(function () { return $(this).attr('value') })
        this.maps = _.zipObject(officeIDs, _.map(officeIDs, function (officeID) {
          return new Map({
            el: $('.map.' + officeID)[0],
            collection: data.people,
            office: officeID,
            skipFilters: true,
            skipEndpoints: true
          })
        }))

        mediator.subscribe('activatePersonConfirmed', this.onActivatePersonConfirmed)
        mediator.subscribe('activatePerson', this.onActivatePerson)
        mediator.subscribe('map:clickDesk', this.onClickDesk)

        this.photoData = null
        this.initPhotoUploadControl()
      },

      fieldVal: function (name, value) {
        var target = this.$('input[name=' + name + ']')

        if (arguments.length == 2) {
          if (target.is(':radio')) {
            target.val([value])
          } else {
            target.val(value)
          }
        } else if (arguments.length == 1) {
          var attributeValue
          if (target.is(':checkbox')) {
            attributeValue = _.map(target.filter(':checked'), function (item) {
              return $(item).val()
            })
          } else if (target.is(':radio')) {
            attributeValue = target.filter(':checked').val()
          } else {
            attributeValue = target.val()
          }
        }
      },

      render: function () {
        if (this.model) {
          _(['fullname', 'title', 'desk', 'mobilePhone', 'workPhone', 'tags', 'office']).forEach(function (fieldName) {
            var target = this.$('input[name=' + fieldName + ']')
            var value = this.model.get(fieldName)

            if (target.is(':radio')) {
              target.val([value])
            } else {
              target.val(value)
            }
          }, this)

          var linkedInId = this.model.get('linkedInId')
          var linkedInComplete = this.model.getLinkedInProfileUrl()
          this.fieldVal('linkedInId', (linkedInId) ? linkedInComplete.replace(/^https?:\/\/(?:www\.)?/, '') : '')
          this.$('.contact .view_profile')
            .attr('href', (linkedInId) ? linkedInComplete : '#')
            .toggle(!!linkedInId)
          this.$('.contact .search')
            .attr('href', 'https://www.linkedin.com/vsearch/p?keywords=' + encodeURIComponent(this.model.get('fullname')) + '&openAdvancedForm=true')
            .toggle(!linkedInId && !!this.model.get('fullname'))

          var emailLocalPart = this.model.get('email')
          var emailComplete = emailLocalPart + ((emailLocalPart || '').indexOf('@') == -1 ? '@bluejeans.com' : '')
          this.fieldVal('email', (emailLocalPart) ? emailComplete : '')

          this.$('.basics .remove').toggle(!this.model.isNew())
          this.$('.seatChooser').toggle(!!this.model.get('office'))

          this.renderPhoto()

          _.each(this.maps, function (mapView) {
            var isMapOfPersonsOffice = (mapView.options.office == this.model.get('office'))
            mapView.$el.toggle(isMapOfPersonsOffice)
            if (isMapOfPersonsOffice) {
              this.map = mapView
            }
          }, this)

          this.renderFormControls()

          var office = this.model.get('office') || ''
          $('.goToFloorplan').attr('href', '../' + office)
        }

        this.$el.toggle(!!this.model)
        _.each(this.maps, function (mapView) {
          mapView.render()
        })
      },

      /**
     * @param canvas optional HTMLCanvasElement to be rendered instead of the official JPEG
     */
      renderPhoto: function (canvas) {
      // only use the server JPEG if we get no arguments and there is no pending photo upload
        if (!canvas && !this.photoData) {
          var imgEl = this.photoUploadControl.find('img')
          if (!imgEl.length) {
            imgEl = $('<img>')
            this.photoUploadControl.find('canvas').remove()
            this.photoUploadControl.prepend(imgEl)
          }

          imgEl.attr('src', this.model.getPhotoPath())
        } else if (_.isElement(canvas) && canvas.nodeName == 'CANVAS') {
          this.photoUploadControl.find('canvas, img').remove()
          this.photoUploadControl.prepend(canvas)
        }
      },

      onActivatePerson: function (newModel, opts) {
      // a hack, but i don't want to save more state
        if (this.$('.formControls [type=submit]').attr('disabled')) {
        // model and photo are saved, nothing to do here
          mediator.publish('activatePersonConfirmed', newModel, opts)
        } else if (window.confirm('You have unsaved changes. Are you sure you want to discard these changes?')) {
          if (!this.model.isNew()) {
            this.model.fetch({ success: function (model) {
              model.changed = {} // model is now synced with server, there are no changes.
            }})
          }
          mediator.publish('activatePersonConfirmed', newModel, opts)
        }
      },

      onActivatePersonConfirmed: function (model) {
        this.clearPendingUploads()

        this.model = model
        this.updatePhotoUploadUrl()

        var renderPerson = _.bind(function () {
          model.changed = {} // model is now synced with server, there are no changes.
          this.render()

          this.$('.validationMessage').hide()
          this.$('.invalid').removeClass('invalid')

          window.scrollTo(0, 0)
        }, this)

        if (!model.isNew()) {
          model.fetch({
            success: function () {
              renderPerson()
            }
          })
        } else {
          renderPerson()
        }
      },

      save: function (event) {
        event.preventDefault()
        this.renderFormControls(false)

        if (this.model.isNew()) {
          this.collection.create(this.model, { success: _.bind(function (result) {
            this.onSave()
              .then(_.bind(function () {
                mediator.publish('activatePersonConfirmed', this.model)
              }, this))
          }, this)})
        } else {
          this.model.save({}, { success: this.onSave })
        }
      },

      onSave: function (result) {
        this.model.changed = {} // model is now synced with server, there are no changes.
        var deferred = Q.defer()

        this.updatePhotoUploadUrl()
        if (this.photoData) {
          this.photoData.submit()
            .complete(_.bind(function () {
              this.render()
              deferred.resolve()
            }, this))
        } else {
          deferred.resolve()
        }

        return deferred.promise
      },

      onDirtyChange: function (event) {
        var changeSet = {}
        var currentTarget = $(event.currentTarget)
        var attributeName = currentTarget.attr('name')
        var attributeValue

        if (attributeName == 'email' && currentTarget.val().trim() !== '' && currentTarget.val().indexOf('@') === -1) {
          currentTarget.val(currentTarget.val() + '@bluejeans.com')
        }

        var validity = currentTarget[0].validity
        if (validity.valid) {
          this.$('.validationMessage').hide()

          if (attributeName == 'linkedInId') {
            attributeValue = data.Person.linkedInUrlToId(currentTarget.val())
          } else if (attributeName == 'email') {
            attributeValue = currentTarget.val().replace(/@((bluejeansnet\.com)|(bjn\.vc)|(bluejeans\.((com)|(vc)|(net))))$/, '')
          } else if (currentTarget.is(':checkbox')) {
            attributeValue = _.map(this.$('input[name=' + attributeName + ']:checked'), function (item) { return $(item).val() })
          } else if (currentTarget.is(':radio')) {
            attributeValue = this.$('input[name=' + attributeName + ']:checked').val()
          } else {
            attributeValue = currentTarget.val()

            if (attributeValue === '') {
              attributeValue = null
            }
          }

          if (attributeName == 'office') {
            changeSet['desk'] = null
          }

          changeSet[attributeName] = attributeValue
          this.model.set(changeSet)
          this.render() // update coerced values. side effect: blows away invalid values
        } else {
          this.$('.validationMessage').text(currentTarget.data('validation-failed-message')).show()
          this.renderFormControls()
        }

        currentTarget.closest('label').addBack().toggleClass('invalid', !validity.valid)
      },

      renderFormControls: function (isForceEnabled) {
        var isValid = this.el.checkValidity()

        var isEnabled = isValid && (_.isBoolean(isForceEnabled))
          ? isForceEnabled
          : (this.model.hasChanged() || (this.photoData && this.photoData.state() != 'pending'))

        var saveButton = this.$('.formControls [type=submit]')

        if (isEnabled) {
          saveButton.removeAttr('disabled')
        /* if(_.isBoolean(isForceEnabled) && isForceEnabled){
          console.log('save button enabled because it was forced on');
        } else if(this.model.hasChanged()){
          console.log('save button enabled because the model has changed', this.model.changedAttributes());
        } else if(this.photoData && this.photoData.state() != 'pending'){
          console.log('save button enabled because a photo was chosen but has yet to start uploading');
        } else {
          console.log('no idea why the save button is enabled');
        } */
        } else {
          saveButton.attr('disabled', 'disabled')
        }
      },

      initPhotoUploadControl: function () {
        this.photoUploadControl = this.$('.photo')
        var photoPreviewSize = this.photoUploadControl.find('img').width()

        this.photoUploadControl
          .fileupload({
            dataType: 'json',
            autoUpload: false,
            paramName: 'photo',
            previewMaxWidth: photoPreviewSize,
            previewMaxHeight: photoPreviewSize,
            previewCrop: true
          })
          .on({
            fileuploadadd: this.onPhotoAdded,
            fileuploadfail: this.onPhotoUploadFailure,
            fileuploaddone: this.onPhotoUploadSuccess,
            fileuploadprocessdone: this.onPhotoPreviewReady
          })
      },

      clearPendingUploads: function () {
        this.photoData && this.photoData.abort()
        this.photoData = null
      },

      onPhotoAdded: function (event, data) {
        this.clearPendingUploads()
        this.photoData = data
        this.renderFormControls()
      },

      onPhotoUploadFailure: function (event, data) {
        console.error(data.errorThrown)
        console.error(data.jqXHR.responseText)
        window.alert('Failed to upload photo.\nPlease yell at Ben.\n\nDetails:\n\n' + data.jqXHR.responseText)
      },

      onPhotoUploadSuccess: function (event, data) {
        this.clearPendingUploads()
        this.renderFormControls()

        var photoPath = this.model.getPhotoPath()
        $.get(photoPath)
          .done(_.bind(function () {
            this.renderPhoto()
            this.model.trigger('change:photo', this.model, photoPath, {})
          }, this))
      },

      onPhotoPreviewReady: function (event, data) {
        var file = data.files[data.index]

        if (file.preview) {
          this.renderPhoto(file.preview)
        }
      },

      updatePhotoUploadUrl: function () {
        try {
          var photoUploadUrl = this.model.url() + '/photo'
          this.photoUploadControl.fileupload('option', 'url', photoUploadUrl)
        // console.log("photoUploadUrl = ", photoUploadUrl);
        } catch (err) {
        // we have loaded a new person with no id
        // ignore this error, because before we upload their photo, the model will have been saved to the server, it will have an id, and this method will have been run again to get the real value
        }
      },

      removePerson: function (event) {
        if (window.confirm('Are you sure you want to permanently delete ' + this.model.get('fullname') + '?')) {
          this.model.destroy()

          mediator.publish('activatePersonConfirmed', new (this.collection.model)())
        }
      },

      enlargeMap: function (event) {
        event.preventDefault()

        var seatChooserLarge = $('.seatChooser.large')
        var mapEl = this.$('.map:visible')

        mapEl
          .prependTo(seatChooserLarge)
          .removeClass('small')
          .addClass('large')

        seatChooserLarge.find('.unassign')
          .toggle(this.model.get('desk') !== null)
          .find('a')
          .off('click')
          .on('click', _.bind(function (event) {
            event.preventDefault()

            this.map.renderActiveSeat(null)
            this.onClickDesk(null)
          }, this))

        seatChooserLarge.show()

        $(document.body).css('overflow', 'hidden')

        seatChooserLarge.find('.cancel')
          .off('click')
          .on('click', this.shrinkMap)
      },

      shrinkMap: function (event) {
        event && event.preventDefault()
        $('.map.large')
          .prependTo(this.$('.seatChooser.small'))
          .removeClass('large')
          .addClass('small')
        $('.seatChooser.large').hide()
        $(document.body).css('overflow', '')
      },

      onClickDesk: function (deskId) {
        this.model.set({ desk: deskId })
        this.renderFormControls()
        this.shrinkMap()
      }
    })

    return this.editor
  }

  // ============================
  // ========= introView ========
  // ============================

  introView () {
    this.introView = Backbone.View.extend({

      className: 'intro',

      initialize: function () {
        _.bindAll(this)
      },

      render: function () {
        if (this.$el.is(':empty')) {
          this.$el.addClass(floorplanParams.officeID)
          var office = offices[floorplanParams.officeID]

          this.$el.append($('<h2>', { text: 'Blue Jeans' }))

          if (office.address) {
            var addressEl = $('<h3>', { class: 'address' })
            if (office.mapsUrl) {
              addressEl.append($('<a>', {
                text: office.address,
                title: 'View in Google Maps',
                href: office.mapsUrl,
                target: '_blank'
              }))
            } else {
              addressEl.text(office.address)
            }
            this.$el.append(addressEl)
          }

          if (office.yelpId) {
            var ratingEl = $('<div>', { class: 'rating' })
              .click(function () {
                window.open('http://www.yelp.com/biz/' + office.yelpId)
              })
            this.$el.append(ratingEl)

            this.renderRating(office.yelpId)
          }
        }

        return this.el
      },

      renderRating: function (yelpId) {
        yelp.getRating(yelpId)
          .then(_.bind(function (rating) {
            this.$('.rating')
              .css('background-position', '-2px ' + (-3 - 18 * 2 * (rating.stars - 0.5)) + 'px')
              .attr('title', rating.stars + ' stars on Yelp\n(' + rating.reviews + ' ' + (rating.reviews === 1 ? 'review' : 'reviews') + ')')
          }, this))
      }
    })

    return this.introView
  }

  // ============================
  // ========= listPane =========
  // ============================

  listPane () {
    this.listPane = Backbone.View.extend({

      events: {
        'click .people li': 'onRowClick'
      },

      initialize: function () {
        _.bindAll(this)

        this.ol = null
        this.searchBox = new SearchBox()
        this.tagGrid = new TagGrid({ collection: this.collection })
        this.officeGrid = new OfficeGrid()

        this.collection.on('reset', this.addMany)
        this.collection.on('add', this.addOne)
        this.collection.on('destroy', this.removePerson)
        mediator.subscribe('change:query', this.filterByName)
        mediator.subscribe('filterByTag', this.filterByTag)

        mediator.subscribe('activatePersonConfirmed', this.onActivatePersonConfirmed)
      },

      render: function () {
        if (this.$el.is(':empty')) {
          this.$el.append(this.officeGrid.render())

          this.$el.append(this.searchBox.render())

          this.ol = $('<ol>', { class: 'people' })
          this.$el.append(this.ol)

          this.$el.append(this.tagGrid.render())
        }
        return this.el
      },

      addMany: function (coll) {
        var insertFragment = document.createDocumentFragment()

        coll.each(function (person) {
          var personView = new PersonRow({ model: person })
          insertFragment.appendChild(personView.render())
        })

        this.ol.append(insertFragment)
      },

      addOne: function (person) {
        var personView = new PersonRow({ model: person }).render()
        var indexToInsertAt = this.collection.sortedIndex(person)
        if (this.collection.length === 1) {
          // insert as only element
          $(personView).appendTo(this.ol)
        } else if (indexToInsertAt === 0) {
          // insert before element 1
          $(personView).insertBefore(this.collection.at(1).views.listPaneRow.$el)
        } else {
          $(personView).insertAfter(this.collection.at(indexToInsertAt - 1).views.listPaneRow.$el)
          // insert after element n-1
        }
      },

      removePerson: function (person) {
        person.views.listPaneRow.remove()
      },

      filterByName: function (query) {
        query = query.toLowerCase().trim()

        this.ol.children().removeClass('filtered_name')

        if (query.length) {
          var peopleToHide = this.collection.filter(function (person) {
            return person.get('fullname').toLowerCase().indexOf(query) === -1
          })

          _.each(peopleToHide, function (personToHide) {
            var view = personToHide.views.listPaneRow
            view.$el.addClass('filtered_name')
          })
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

        this.ol.children().removeClass('filtered_tag')
        _.each(peopleToHide, function (personToHide) {
          var view = personToHide.views.listPaneRow
          view.$el.addClass('filtered_tag')
        })
      },

      onRowClick: function (event) {
        var model = $(event.currentTarget).data('model')
        if (!model) {
          model = new this.collection.model()
          // model.views = {};
          // model.views.listPaneRow =
        }
        mediator.publish('activatePerson', model, { skipListScroll: true })
      },

      onActivatePersonConfirmed: function (person, opts) {
        var rowViewEl

        if (person.views) {
          rowViewEl = person.views.listPaneRow.$el
        } else {
          rowViewEl = this.ol.children().first()
        }

        rowViewEl
          .addClass('active')
          .siblings().removeClass('active')

        if (!opts.skipListScroll) {
          var twoPeopleUpEl = rowViewEl.prev().prev().add(rowViewEl).get(0)
          twoPeopleUpEl && twoPeopleUpEl.scrollIntoView()
        }
      }
    })

    var PersonRow = Backbone.View.extend({
      tagName: 'li',
      className: 'person',

      initialize: function () {
        _.bindAll(this)

        this.nameEl = null

        this.model.views = this.model.views || {}
        this.model.views.listPaneRow = this

        this.model.on('change:fullname', this.render)
        this.model.on('change:photo', this.renderPhoto)

        this.$el.data('model', this.model)
      },

      render: function () {
        var fullname = this.model.get('fullname')

        if (this.$el.is(':empty')) {
          this.photoImg = $('<img>')
          this.renderPhoto(this.model, this.model.getPhotoPath())
          this.$el.append(this.photoImg)

          this.nameEl = $('<div>', {
            class: 'name'
          })
          this.$el.append(this.nameEl)
        }

        this.$('img').attr('alt', fullname)
        this.nameEl.text(fullname)

        return this.el
      },

      renderPhoto: function (person, photoPath) {
        this.photoImg.attr('src', photoPath)
      }
    })

    var SearchBox = Backbone.View.extend({
      className: 'queryContainer',

      events: {
        'keyup input.query': 'changeQuery'
      },

      initialize: function () {
        _.bindAll(this)
        this.textField = null
      },

      render: function () {
        if (this.$el.is(':empty')) {
          this.textField = $('<input>', { type: 'text', placeholder: 'Search', class: 'query', autocomplete: 'off', value: '' })
          this.$el.append(this.textField)
        }
        return this.el
      },

      changeQuery: _.throttle(function (event) {
        mediator.publish('change:query', event.target.value)
      }, 50)
    })

    var TagGrid = Backbone.View.extend({
      className: 'tags',

      events: {
        'click .tag': 'onTagClick'
      },

      initialize: function () {
        _.bindAll(this)

        this.filterState = {}
        this.collection.on('reset', this.populate)
      },

      render: function () {
        _(this.filterState)
          .filter(function (tagFilterState) {
            return !tagFilterState.tagGridEl
          })
          .each(function (tagFilterState) {
            var tagEl = $('<a>')
              .attr({
                href: '#',
                title: 'show/hide ' + depTeams[tagFilterState.tagName] || tagFilterState.tagName
              })
              .addClass('tag')
              .data('tagName', tagFilterState.tagName)
              .text(tagFilterState.tagName)
            tagFilterState.tagGridEl = tagEl
            this.$el.append(tagEl)
          }, this)

        _.each(this.filterState, function (tagFilterState) {
          tagFilterState.tagGridEl && tagFilterState.tagGridEl.toggleClass('filtered', tagFilterState.isFiltered)
        }, this)

        return this.el
      },

      populate: function (coll) {
        var tagNames = _(coll.pluck('tags')).flatten().compact().unique().sortBy().value()
        _.extend(this.filterState, _.zipObject(tagNames.map(function (tagName) {
          return [tagName, {
            tagName: tagName,
            tagGridEl: null,
            isFiltered: false
          }]
        })))
        this.render()
      },

      onTagClick: function (event) {
        event.preventDefault()

        /*
         * If we were showing all people, then clicking will first hide all people, so the following common logic can show only one tag
         */
        if (!this._isAnyTagFiltered()) { // case c
          _.each(this.filterState, function (tagFilterState) {
            tagFilterState.isFiltered = true
          })
        }

        var tagFilterState = this.filterState[$(event.currentTarget).data('tagName')]
        tagFilterState.isFiltered = !tagFilterState.isFiltered

        /*
         * If no people would be shown, then show everybody
         */
        if (this._isEveryTagFiltered()) { // case b
          _.each(this.filterState, function (tagFilterState) {
            tagFilterState.isFiltered = false
          })
        }

        this.render()

        /*
         * For this event, tagsToShow = null means show everybody, and tagsToShow = [] means show nobody
         */
        mediator.publish('filterByTag', {
          tagsToShow: (this._isAnyTagFiltered())
            ? _(this.filterState)
              .where({ isFiltered: false })
              .pluck('tagName')
              .value()
            : null
        })
      },

      _isAnyTagFiltered: function () {
        return _.any(this.filterState, 'isFiltered')
      },

      _isEveryTagFiltered: function () {
        return _.all(this.filterState, 'isFiltered')
      }
    })

    var OfficeGrid = Backbone.View.extend({

      tagName: 'nav',

      initialize: function () {
        _.bindAll(this)
      },

      render: function () {
        if (this.$el.is(':empty')) {
          this.$el.append(
            $('<a>', { href: 'mv', title: 'view the Mountain View office', text: 'mv' }),
            $('<a>', { href: 'oc', title: 'view the Orange County office', text: 'oc' }),
            $('<a>', { href: 'sf', title: 'view the San Francisco office', text: 'sf' }),
            $('<a>', { href: 'ln', title: 'view the London office', text: 'ln' }),
            $('<a>', { href: 'blr', title: 'view the Bangalore office', text: 'blr' }),
            $('<a>', { href: 'aus', title: 'view Australia', text: 'aus' }),
            $('<a>', { href: 'remote', title: 'view remote workers', text: 'rm' })
          )
        }

        if (typeof floorplanParams !== 'undefined') {
          this.$('a')
            .filter(function () {
              return ($(this).attr('href') == floorplanParams.officeID) ||
                (_.contains(['mv2', 'mv3'], floorplanParams.officeID) && $(this).attr('href') == 'mv')
            })
            .addClass('active')
        }

        return this.el
      }
    })

    return this.listPane
  }

  // ============================
  // ============ map ===========
  // ============================

  map () {
    var SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

    /*
     * options: {
     *     office: 'mv',
     *     skipFilters: false,
     *     skipEndpoints: false
     * }
     */
    this.map = Backbone.View.extend({

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

        /* $.getJSON('http://floorplan.bluejeansnet.com:8080/taas/now?timezone=Europe/London')
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
          }) */
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

    return this.map
  }

  // ============================
  // ===== roomDetailsView ======
  // ============================

  roomDetailsView () {
    var CONTROL_PROTOCOL_TO_MANUFACTURER = {
      'TANDBERG_SSH': 'Cisco',
      'TANDBERG_HTTP': 'Cisco',
      'CISCO_IX_SSH_SOAP': 'Cisco',
      'POLYCOM_TELNET': 'Polycom',
      'POLYCOM_HTTP_HDX': 'Polycom',
      'POLYCOM_HTTP_REALPRESENCE': 'Polycom',
      'LIFESIZE_SSH': 'Lifesize',
      'LIFESIZE_HTTP_ICON': 'Lifesize',
      'STARLEAF_HTTP': 'StarLeaf',
      'TELY_HTTP': 'Tely'
    }

    var RoomDetailsView = Backbone.View.extend({

      className: 'roomDetailsView detailsView',

      initialize: function () {
        _.bindAll(this)

        this.els = {}

        data.endpoints.on('status', this.onStatusUpdate)
      },

      render: function () {
        if (this.$el.is(':empty')) {
          this.els.photo = $('<img>', { class: 'photo' }).on({
            load: this.onImageLoadSuccess,
            error: this.onImageLoadFailure
          })

          this.els.name = $('<h2>', { class: 'name' })

          this.$el.append(this.els.photo)
          this.$el.append(this.els.name)

          this.els.endpointManufacturer = $('<dd>')
          this.els.endpointIpAddress = $('<dd>')
          this.els.seatingCapacity = $('<dd>')
          this.els.availabilityStatus = $('<dd>').append([
            $('<span>', { 'class': 'statusBadge' }),
            $('<span>', { 'class': 'statusLabel' })
          ])

          var dl = $('<dl>')

          dl.append($('<dt>', { text: 'Status' }))
          dl.append(this.els.availabilityStatus)

          dl.append($('<dt>', { text: 'Capacity'}))
          dl.append(this.els.seatingCapacity)

          dl.append($('<dt>', { text: 'Endpoint' }))
          dl.append(this.els.endpointManufacturer)

          dl.append($('<dt>', { text: 'IP Address' }))
          dl.append(this.els.endpointIpAddress)

          this.$el.append(dl)
        }

        if (this.model) {
          this.els.photo.attr('src', urljoin(global.baseURL, '/endpoints/', this.model.id, '/photo')) // causes flickering in Opera

          this.els.name.text(this.model.get('name'))

          this.els.endpointManufacturer.text(this.getManufacturerLabel(this.model.get('controlProtocol')))

          this.els.endpointIpAddress.empty().append($('<a>', {
            text: this.model.get('ipAddress'),
            href: 'http://' + this.model.get('ipAddress'),
            target: '_blank'
          }))

          var seatingCapacity = this.model.get('seatingCapacity')
          this.els.seatingCapacity.text(seatingCapacity)
          this.els.seatingCapacity.prev().addBack().toggle(!!seatingCapacity)

          this.renderStatus()

          this.$el.show()
        } else {
          this.$el.hide()
        }

        return this.el
      },

      renderStatus: function () {
        var statusBadgeEl = this.els.availabilityStatus.find('.statusBadge')

        if (this.model.get('status')) {
          this.els.availabilityStatus.find('.statusLabel').text(this.getStatusLabel())

          statusBadgeEl.removeClass('offline in-a-call reserved available')
          statusBadgeEl.addClass(this.getStatusLabel().replace(/\s/g, '-'))
          statusBadgeEl.show()
        } else {
          statusBadgeEl.hide()
        }
      },

      onStatusUpdate: function (endpoint, status) {
        if (this.model && (endpoint.id == this.model.id)) {
          this.renderStatus()
        }
      },

      getManufacturerLabel: function () {
        return CONTROL_PROTOCOL_TO_MANUFACTURER[this.model.get('controlProtocol')] || 'other'
      },

      getStatusLabel: function () {
        return this.model.getAvailability()
      },

      isBusy: function () {
        return this.model.getAvailability() !== 'available'
      },

      onImageLoadSuccess: function (event) {
        this.els.photo.show()
      },

      onImageLoadFailure: function (event) {
        this.els.photo.hide()
      }

    })

    return this.RoomDetailsView
  }
}
