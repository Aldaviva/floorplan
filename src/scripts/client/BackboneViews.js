// npm + Browserify dependencies
import $ from 'jquery'
import _ from 'lodash'
import Backbone from 'backbone'
import urljoin from 'url-join'
import Q from 'q'
import { Mediator } from 'mediator-js'

// !!! Before version 3.0, this was mostly the other JS files, not in "data.js" or "lib" !!!

// ============================
// ======= SUPERCLASS =========
// ============================

export default class BackboneViews extends Backbone.View {
  constructor (...args) {
    super(...args)
    this.$el = args.$el
    this.collection = args.collection
    this.SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
    this.mediator = new Mediator()
  }
}

// ============================
// ======= DetailsPane ========
// ============================

export class DetailsPane extends BackboneViews {
  initialize () {
    _.bindAll(this)

    this.mediator.subscribe('activatePersonConfirmed', function (person, opts) {
      this.toggleIntro(false)
      this.setPersonModel(person)
    }, {}, this)

    this.mediator.subscribe('activateRoom', function (endpoint, opts) {
      this.toggleIntro(false)
      this.setRoomModel(endpoint)
    }, {}, this)

    this.introView = new IntroView()
    this.personDetailsView = new PersonDetailsView()
    this.roomDetailsView = new RoomDetailsView()
  }

  render () {
    if (this.$el.is(':empty')) {
      var correctionsLink = $('<a>', {
        class: 'corrections',
        href: 'mailto:' + this.supportContact,
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
  }

  setPersonModel (model) {
    this.personDetailsView.model = model
    this.roomDetailsView.model = null
    this.render()
  }

  setRoomModel (model) {
    this.personDetailsView.model = null
    this.roomDetailsView.model = model
    this.render()
  }

  toggleIntro (shouldShow) {
    this.introView.$el.toggle(!!shouldShow)
    this.personDetailsView.$el.toggle(!shouldShow)
    this.roomDetailsView.$el.toggle(!shouldShow)
  }
}

// ============================
// ========== editor ==========
// ============================

export class Editor extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.events = {
      'click [type=submit]': 'save',
      'change input': 'onDirtyChange',
      'keyup input': function () { this.renderFormControls(true) },
      'click .contact .view_profile': 'viewLinkedInProfile',
      'click .basics .remove': 'removePerson',
      'click .desk.helper_link': 'enlargeMap'
    }
  }

  initialize () {
    _.bindAll(this)

    var officeIDs = this.$('.office input[type=radio]').map(function () { return $(this).attr('value') })
    // WAS LODASH / UNDERSCORE
    this.maps = _.zipObject(officeIDs, Array.prototype.map(officeIDs, function (officeID) {
      return new BVMap({
        el: $('.map.' + officeID)[0],
        collection: this.data.people,
        office: officeID,
        skipFilters: true,
        skipEndpoints: true
      })
    }))

    this.mediator.subscribe('activatePersonConfirmed', this.onActivatePersonConfirmed)
    this.mediator.subscribe('activatePerson', this.onActivatePerson)
    this.mediator.subscribe('map:clickDesk', this.onClickDesk)

    this.photoData = null
    this.initPhotoUploadControl()
  }

  fieldVal (name, value) {
    var target = this.$('input[name=' + name + ']')

    if (arguments.length === 2) {
      if (target.is(':radio')) {
        target.val([value])
      } else {
        target.val(value)
      }
    } else if (arguments.length === 1) {
      var attributeValue
      if (target.is(':checkbox')) {
        attributeValue = Array.prototype.map(target.filter(':checked'), function (item) {
          return $(item).val()
        })
      } else if (target.is(':radio')) {
        attributeValue = target.filter(':checked').val()
      } else {
        attributeValue = target.val()
      }
      return attributeValue
    }
  }

  render () {
    if (this.model) {
      // WAS LODASH / UNDERSCORE
      ['fullname', 'title', 'desk', 'mobilePhone', 'workPhone', 'tags', 'office'].forEach((fieldName) => {
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
      var emailComplete = emailLocalPart + ((emailLocalPart || '').indexOf('@') === -1 ? '@bluejeans.com' : '')
      this.fieldVal('email', (emailLocalPart) ? emailComplete : '')

      this.$('.basics .remove').toggle(!this.model.isNew())
      this.$('.seatChooser').toggle(!!this.model.get('office'))

      this.renderPhoto()

      // WAS LODASH / UNDERSCORE
      this.maps.forEach((mapView) => {
        var isMapOfPersonsOffice = (mapView.options.office === this.model.get('office'))
        mapView.$el.toggle(isMapOfPersonsOffice)
        if (isMapOfPersonsOffice) {
          this.map = mapView
        }
      })

      this.renderFormControls()

      var office = this.model.get('office') || ''
      $('.goToFloorplan').attr('href', '../' + office)
    }

    this.$el.toggle(!!this.model)
    this.maps.forEach((mapView) => {
      mapView.render()
    })
  }

  /**
  * @param canvas optional HTMLCanvasElement to be rendered instead of the official JPEG
  */
  renderPhoto (canvas) {
    // only use the server JPEG if we get no arguments and there is no pending photo upload
    if (!canvas && !this.photoData) {
      var imgEl = this.photoUploadControl.find('img')
      if (!imgEl.length) {
        imgEl = $('<img>')
        this.photoUploadControl.find('canvas').remove()
        this.photoUploadControl.prepend(imgEl)
      }

      imgEl.attr('src', this.model.getPhotoPath())
    } else if (_.isElement(canvas) && canvas.nodeName === 'CANVAS') {
      this.photoUploadControl.find('canvas, img').remove()
      this.photoUploadControl.prepend(canvas)
    }
  }

  onActivatePerson (newModel, opts) {
    // a hack, but i don't want to save more state
    if (this.$('.formControls [type=submit]').attr('disabled')) {
      // model and photo are saved, nothing to do here
      this.mediator.publish('activatePersonConfirmed', newModel, opts)
    } else if (window.confirm('You have unsaved changes. Are you sure you want to discard these changes?')) {
      if (!this.model.isNew()) {
        this.model.fetch({ success: function (model) {
          model.changed = {} // model is now synced with server, there are no changes.
        }})
      }
      this.mediator.publish('activatePersonConfirmed', newModel, opts)
    }
  }

  onActivatePersonConfirmed (model) {
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
  }

  save (event) {
    event.preventDefault()
    this.renderFormControls(false)

    if (this.model.isNew()) {
      this.collection.create(this.model, { success: _.bind(function (result) {
        this.onSave()
          .then(_.bind(function () {
            this.mediator.publish('activatePersonConfirmed', this.model)
          }, this))
      }, this)})
    } else {
      this.model.save({}, { success: this.onSave })
    }
  }

  onSave (result) {
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
  }

  onDirtyChange (event) {
    var changeSet = {}
    var currentTarget = $(event.currentTarget)
    var attributeName = currentTarget.attr('name')
    var attributeValue

    if (attributeName === 'email' && currentTarget.val().trim() !== '' && currentTarget.val().indexOf('@') === -1) {
      currentTarget.val(currentTarget.val() + '@bluejeans.com')
    }

    var validity = currentTarget[0].validity
    if (validity.valid) {
      this.$('.validationMessage').hide()

      if (attributeName === 'linkedInId') {
        attributeValue = this.data.Person.linkedInUrlToId(currentTarget.val())
      } else if (attributeName === 'email') {
        attributeValue = currentTarget.val().replace(/@((bluejeansnet\.com)|(bjn\.vc)|(bluejeans\.((com)|(vc)|(net))))$/, '')
      } else if (currentTarget.is(':checkbox')) {
        // WAS LODASH / UNDERSCORE
        attributeValue = this.$('input[name=' + attributeName + ']:checked').map(function (item) { return $(item).val() })
      } else if (currentTarget.is(':radio')) {
        attributeValue = this.$('input[name=' + attributeName + ']:checked').val()
      } else {
        attributeValue = currentTarget.val()

        if (attributeValue === '') {
          attributeValue = null
        }
      }

      if (attributeName === 'office') {
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
  }

  renderFormControls (isForceEnabled) {
    var isValid = this.el.checkValidity()

    var isEnabled = isValid && (_.isBoolean(isForceEnabled))
      ? isForceEnabled
      : (this.model.hasChanged() || (this.photoData && this.photoData.state() !== 'pending'))

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
  }

  initPhotoUploadControl () {
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
  }

  clearPendingUploads () {
    this.photoData && this.photoData.abort()
    this.photoData = null
  }

  onPhotoAdded (event, data) {
    this.clearPendingUploads()
    this.photoData = data
    this.renderFormControls()
  }

  onPhotoUploadFailure (event, data) {
    this.console.error(this.data.errorThrown)
    this.console.error(this.data.jqXHR.responseText)
    window.alert('Failed to upload photo.\nPlease yell at Ben.\n\nDetails:\n\n' + this.data.jqXHR.responseText)
  }

  onPhotoUploadSuccess (event, data) {
    this.clearPendingUploads()
    this.renderFormControls()

    var photoPath = this.model.getPhotoPath()
    $.get(photoPath)
      .done(_.bind(function () {
        this.renderPhoto()
        this.model.trigger('change:photo', this.model, photoPath, {})
      }, this))
  }

  onPhotoPreviewReady (event, data) {
    var file = this.data.files[this.data.index]

    if (file.preview) {
      this.renderPhoto(file.preview)
    }
  }

  updatePhotoUploadUrl () {
    try {
      var photoUploadUrl = this.model.url() + '/photo'
      this.photoUploadControl.fileupload('option', 'url', photoUploadUrl)
      // console.log("photoUploadUrl = ", photoUploadUrl);
    } catch (err) {
      // we have loaded a new person with no id
      // ignore this error, because before we upload their photo, the model will have been saved to the server, it will have an id, and this method will have been run again to get the real value
    }
  }

  removePerson (event) {
    if (window.confirm('Are you sure you want to permanently delete ' + this.model.get('fullname') + '?')) {
      this.model.destroy()

      this.mediator.publish('activatePersonConfirmed', new (this.collection.Model)())
    }
  }

  enlargeMap (event) {
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
  }

  shrinkMap (event) {
    event && event.preventDefault()
    $('.map.large')
      .prependTo(this.$('.seatChooser.small'))
      .removeClass('large')
      .addClass('small')
    $('.seatChooser.large').hide()
    $(document.body).css('overflow', '')
  }

  onClickDesk (deskId) {
    this.model.set({ desk: deskId })
    this.renderFormControls()
    this.shrinkMap()
  }
}

// ============================
// ========= introView ========
// ============================

export class IntroView extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.className = 'intro'
  }

  initialize () {
    _.bindAll(this)
  }

  render () {
    if (this.$el.is(':empty')) {
      this.$el.addClass(window.floorplanParams.officeID)
      var office = this.offices[window.floorplanParams.officeID]

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
    }

    return this.el
  }
}

// ============================
// ========= listPane =========
// ============================

export class ListPane extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.events = {
      'click .people li': 'onRowClick'
    }
  }

  initialize () {
    _.bindAll(this)

    this.ol = null
    this.searchBox = new SearchBox()
    this.tagGrid = new TagGrid({ collection: this.collection })
    this.officeGrid = new OfficeGrid()

    this.collection.on('reset', this.addMany)
    this.collection.on('add', this.addOne)
    this.collection.on('destroy', this.removePerson)
    this.mediator.subscribe('change:query', this.filterByName)
    this.mediator.subscribe('filterByTag', this.filterByTag)

    this.mediator.subscribe('activatePersonConfirmed', this.onActivatePersonConfirmed)
  }

  render () {
    if (this.$el.is(':empty')) {
      this.$el.append(this.officeGrid.render())

      this.$el.append(this.searchBox.render())

      this.ol = $('<ol>', { class: 'people' })
      this.$el.append(this.ol)

      this.$el.append(this.tagGrid.render())
    }
    return this.el
  }

  addMany (coll) {
    var insertFragment = document.createDocumentFragment()

    coll.each(function (person) {
      var personView = new this.PersonRow({ model: person })
      insertFragment.appendChild(personView.render())
    })

    this.ol.append(insertFragment)
  }

  addOne (person) {
    var personView = new this.PersonRow({ model: person }).render()
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
  }

  removePerson (person) {
    person.views.listPaneRow.remove()
  }

  filterByName (query) {
    query = query.toLowerCase().trim()

    this.ol.children().removeClass('filtered_name')

    if (query.length) {
      var peopleToHide = this.collection.filter(function (person) {
        return person.get('fullname').toLowerCase().indexOf(query) === -1
      })

      // WAS LODASH/UNDERSCORE
      peopleToHide.forEach(peopleToHide, (personToHide) => {
        var view = personToHide.views.listPaneRow
        view.$el.addClass('filtered_name')
      })
    }
  }

  filterByTag (params) {
    var tagsToShow = params.tagsToShow

    var peopleToHide = (tagsToShow != null)
      ? this.collection.filter(function (person) {
        var personTags = person.get('tags')
        return !personTags || !personTags.length || _.intersection(personTags, tagsToShow).length === 0
      })
      : []

    this.ol.children().removeClass('filtered_tag')
    // WAS LODASH/UNDERSCORE
    peopleToHide.forEach((personToHide) => {
      var view = personToHide.views.listPaneRow
      view.$el.addClass('filtered_tag')
    })
  }

  onRowClic (event) {
    var model = $(event.currentTarget).data('model')
    if (!model) {
      model = new this.collection.Model()
      // model.views = {};
      // model.views.listPaneRow =
    }
    this.mediator.publish('activatePerson', model, { skipListScroll: true })
  }

  onActivatePersonConfirmed (person, opts) {
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
}

// ============================
// ======= PersonRow ==========
// ============================

export class PersonRow extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.tagName = 'li'
    this.className = 'person'
  }

  initialize () {
    _.bindAll(this)

    this.nameEl = null

    this.model.views = this.model.views || {}
    this.model.views.listPaneRow = this

    this.model.on('change:fullname', this.render)
    this.model.on('change:photo', this.renderPhoto)

    this.$el.data('model', this.model)
  }

  render () {
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
  }

  renderPhoto (person, photoPath) {
    this.photoImg.attr('src', photoPath)
  }
}

// ============================
// ======= SearchBox ==========
// ============================

export class SearchBox extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.className = 'queryContainer'
    this.events = {'keyup input.query': 'changeQuery'}
  }

  initialize () {
    _.bindAll(this)
    this.textField = null
  }

  render () {
    if (this.$el.is(':empty')) {
      this.textField = $('<input>', { type: 'text', placeholder: 'Search', class: 'query', autocomplete: 'off', value: '' })
      this.$el.append(this.textField)
    }
    return this.el
  }

  /*
  changeQuery: _.throttle(function (event) {
    this.mediator.publish('change:query', event.target.value)
  }, 50) */

  changeQuery (event) {
    this.mediator.publish('change:query', event.target.value)
  }
}

// ============================
// ======== TagGrid ===========
// ============================

export class TagGrid extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.className = 'tags'
    this.events = {'click .tag': 'onTagClick'}
  }

  initialize () {
    _.bindAll(this)
    this.filterState = {}
    this.collection.on('reset', this.populate)
  }

  render () {
    // WAS LODASH/UNDERSCORE
    this.filterState
      .filter(function (tagFilterState) {
        return !tagFilterState.tagGridEl
      })
      .forEach((tagFilterState) => {
        var tagEl = $('<a>')
          .attr({
            href: '#',
            title: 'show/hide ' + this.depTeams[tagFilterState.tagName] || tagFilterState.tagName
          })
          .addClass('tag')
          .data('tagName', tagFilterState.tagName)
          .text(tagFilterState.tagName)
        tagFilterState.tagGridEl = tagEl
        this.$el.append(tagEl)
      }, this)

    // WAS LODASH/UNDERSCORE
    this.filterState.forEach((tagFilterState) => {
      tagFilterState.tagGridEl && tagFilterState.tagGridEl.toggleClass('filtered', tagFilterState.isFiltered)
    }, this)

    return this.el
  }

  populate (coll) {
    // WAS LODASH/UNDERSCORE
    var tagNames = coll.map('tags').flatten().compact().unique().sortBy().value()
    _.extend(this.filterState, _.zipObject(tagNames.map(function (tagName) {
      return [tagName, {
        tagName: tagName,
        tagGridEl: null,
        isFiltered: false
      }]
    })))
    this.render()
  }

  onTagClick (event) {
    event.preventDefault()

    /*
    * If we were showing all people, then clicking will first hide all people, so the following common logic can show only one tag
    */
    if (!this._isAnyTagFiltered()) { // case c
      // WAS LODASH/UNDERSCORE
      this.filterState.forEach((tagFilterState) => {
        tagFilterState.isFiltered = true
      })
    }

    var tagFilterState = this.filterState[$(event.currentTarget).data('tagName')]
    tagFilterState.isFiltered = !tagFilterState.isFiltered

    /*
    * If no people would be shown, then show everybody
    */
    if (this._isEveryTagFiltered()) { // case b
      // WAS LODASH/UNDERSCORE
      this.filterState.forEach((tagFilterState) => {
        tagFilterState.isFiltered = false
      })
    }

    this.render()

    /*
    * For this event, tagsToShow = null means show everybody, and tagsToShow = [] means show nobody
    */
    // WAS LODASH/UNDERSCORE
    this.mediator.publish('filterByTag', {
      tagsToShow: (this._isAnyTagFiltered())
        ? this.filterState
          .where({ isFiltered: false })
          .map('tagName')
          .value()
        : null
    })
  }

  _isAnyTagFiltered () {
    // WAS LODASH/UNDERSCORE
    return this.filterState.any('isFiltered')
  }

  _isEveryTagFiltered () {
    // WAS LODASH/UNDERSCORE
    return this.filterState.all('isFiltered')
  }
}

// ============================
// ======== OfficeGrid ========
// ============================
export class OfficeGrid extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.tagName = 'nav'
  }

  initialize () {
    _.bindAll(this)
  }

  // TODO: make dependent on client config
  render () {
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
          return ($(this).attr('href') === window.floorplanParams.officeID) ||
          // WAS LODASH/UNDERSCORE; specific to BlueJeans
        (['mv2', 'mv3'].includes(window.floorplanParams.officeID) && $(this).attr('href') === 'mv')
        })
        .addClass('active')
    }

    return this.el
  }
}

// ============================
// ============ map ===========
// ============================

export class BVMap extends BackboneViews {
  /*
  * options: {
    *     office: 'mv',
    *     skipFilters: false,
    *     skipEndpoints: false
    * }
    */
  constructor (...args) {
    super(...args)
    this.events = {
      'click .photos image': 'onIconClick',
      'click .seats rect': 'onSeatClick',
      'click .roomNames .roomArea': 'onRoomClick',
      'click .arrow': 'onArrowClick'
    }
  }

  initialize () {
    _.bindAll(this)

    this.collection.on('reset', this.addMany)
    this.collection.on('add', this.addOne)
    this.collection.on('change:office', this.addOne)

    this.photosGroup = this.$('.photos')
    this.seatsGroup = this.$('.seats')
    this.activeRectangle = null

    this.clockUpdateInterval = null

    this.mediator.subscribe('activatePersonConfirmed', this.activatePersonConfirmed)
    if (!this.options.skipFilters) {
      this.mediator.subscribe('filterByTag', this.filterByTag)
      this.mediator.subscribe('change:query', this.filterByName)
    }

    if (!this.options.skipEndpoints) {
      this.data.endpoints.on('change:status', this.renderEndpointBadge)
    }
  }

  render () {
    if (this.seatsGroup.is(':empty')) {
      var seatData = this.SEATS[this.options.office]
      var seatPositions = seatData.seatPositions
      var numSeats = seatPositions.length
      var iconSize = seatData.iconSize

      var seatsFragment = document.createDocumentFragment()
      for (var seatIdx = 0; seatIdx < numSeats; seatIdx++) {
        var deskEl = document.createElementNS(this.SVG_NAMESPACE, 'rect')
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
  }

  addMany (coll) {
    var iconsFragment = document.createDocumentFragment()

    coll.each(function (model) {
      if (model.get('office') === this.options.office) {
        iconsFragment.appendChild(this.createAndRenderPersonIcon(model))
      }
    }, this)

    this.photosGroup.append(iconsFragment)
  }

  addOne (person) {
    if (person.get('office') === this.options.office) {
      this.photosGroup.append(this.createAndRenderPersonIcon(person))
    }
    this.renderActiveSeat(null) // remove blue active seat marker when leaving an office
  }

  createAndRenderPersonIcon (person) {
    var personIcon = new this.PersonIcon({ model: person })
    return personIcon.render()
  }

  onIconClick (event) {
    var model = $(event.currentTarget).data('model')
    this.mediator.publish('map:clickPerson', model)
  }

  onSeatClick (event) {
    var deskId = $(event.currentTarget).data('desk')
    this.renderActiveSeat(deskId)
    this.mediator.publish('map:clickDesk', deskId)
  }

  onRoomClick (event) {
    if (!this.options.skipEndpoints) {
      var roomEl = $(event.currentTarget).closest('.room')
      var endpointId = roomEl.attr('endpoint:id')
      this.mediator.publish('map:clickRoom', endpointId, { seatingCapacity: roomEl.attr('endpoint:seatingCapacity') })
    }
  }

  onArrowClick (event) {
    switch (this.options.office) {
      case 'mv':
        window.location = (this.svgHasClass(event.currentTarget, 'right')) ? 'mv2' : 'mv3'
        break
      case 'mv2':
      case 'mv3':
        window.location = 'mv'
        break
      default:
        break
    }
  }

  filterByTag (params) {
    var tagsToShow = params.tagsToShow

    var peopleToHide = (tagsToShow != null)
      ? this.collection.filter(function (person) {
        var personTags = person.get('tags')
        return !personTags || !personTags.length || _.intersection(personTags, tagsToShow).length === 0
      })
      : []

    this.photosGroup.children().each(function (index, photoEl) {
      this.svgRemoveClass(photoEl, 'filtered_tag')
    })

    // WAS LODASH/UNDERSCORE
    peopleToHide.forEach(peopleToHide, (personToHide) => {
      var view = personToHide.views.mapIcon
      view && this.svgAddClass(view.el, 'filtered_tag')
    })
  }

  filterByName (query) {
    query = query.toLowerCase().trim()

    var peopleToHide = this.collection.filter(function (person) {
      return person.get('fullname').toLowerCase().indexOf(query) === -1
    })

    this.photosGroup.children().each(function (index, photoEl) {
      this.svgRemoveClass(photoEl, 'filtered_name')
    })

    // WAS LODASH/UNDERSCORE
    peopleToHide.forEach((personToHide) => {
      var view = personToHide.views.mapIcon
      view && this.svgAddClass(view.el, 'filtered_name')
    })
  }

  activatePersonConfirmed (model) {
    if (model.get('office') === this.options.office) {
      this.photosGroup.children().each(function (index, photoEl) {
        this.svgRemoveClass(photoEl, 'active')
      })

      var activeEl = model.views.mapIcon.el
      this.svgAddClass(activeEl, 'active')

      this.renderActiveSeat(model.get('desk'))
    }
  }

  renderActiveSeat (desk) {
    var activeSeatEl = this.seatsGroup.find('[class~=active]').get(0) // LOL chrome SVG attribute selectors
    activeSeatEl && this.svgRemoveClass(activeSeatEl, 'active')

    if (_.isNumber(desk)) {
      this.svgAddClass(this.seatsGroup.find('[data-desk=' + desk + ']')[0], 'active')
    }
  }

  renderEndpointBadge (endpoint, status) {
    var badgeEl = this.$(".roomNames .room[endpoint\\:id='" + endpoint.id + "'] .statusBadge").get(0)
    if (badgeEl) {
      var titleText = endpoint.getAvailability()
      // var isAvailable = (titleText === 'available')

      this.setTitle(badgeEl, titleText)
      this.svgAddClass(badgeEl, 'loaded')
      this.svgRemoveClass(badgeEl, 'offline in-a-call reserved available')
      this.svgAddClass(badgeEl, endpoint.getAvailability().replace(/\s/g, '-'))
    }
  }

  initClockUpdate () {
    this.clockUpdateInterval && window.clearInterval(this.clockUpdateInterval)
    this.clockUpdateInterval = window.setInterval(this.renderClock, 60 * 1000)
    this.renderClock()
  }

  renderClock () {
    /*
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
      }) */
  }

  /**
    * Would love to use jQuery here, but jQuery's *Class() methods expect el.className to be a String.
    * In SVG land, it's an SVGAnimatedString object, with baseVal and animVal children.
    * Modern browsers expose el.classList with add() and remove(), but IE 10 does not, so we must reimplement.
    *
    * @param SVGElement el - element with the class attribute to modify; not jQuery-wrapped (ex: <image> element)
    * @param String classStr - the class to add; separate multiple classes with whitespace (ex: "active hover")
    */
  svgAddClass (el, classStr) {
    var oldClassList = el.className.baseVal.split(/\s/)
    // WAS LODASH/UNDERSCORE
    // var newClassList = _.compact(_.unique(oldClassList.concat(classStr.split(/\/s/))))
    // TODO: CHECK THIS!!!!
    var newClassList = [...new Set(oldClassList.concat(classStr.split(/\/s/)))].filter()
    el.className.baseVal = newClassList.join(' ')
  }

  /**
    * Similar to svgAddClass, we cannot use jQuery or el.classList.
    *
    * @param SVGElement el - element with the class attribute to modify; not jQuery-wrapped (ex: some <image> element)
    * @param String classStr - the class to remove; separate multiple classes with whitespace (ex: "active hover")
    */
  svgRemoveClass (el, classStr) {
    var oldClassList = el.className.baseVal.split(/\s/)
    var newClassList = _.without.apply(null, [oldClassList].concat(classStr.split(/\s/)))
    el.className.baseVal = newClassList.join(' ')
  }

  svgHasClass (el, classStr) {
    var classList = el.className.baseVal.split(/\s/)
    // WAS LODASH/UNDERSCORE
    return classList.includes(classStr)
  }

  setTitle (el, titleText) {
    var titleEl = $(el).children('title')
    if (!titleEl.length) {
      titleEl = document.createElementNS(this.SVG_NAMESPACE, 'title')
      $(el).append(titleEl)
    }
    $(titleEl).text(titleText)
  }
}

// ============================
// ======= PersonIcon =========
// ============================

export class PersonIcon extends BVMap {
  initialize () {
    _.bindAll(this)
    this.setElement(document.createElementNS(this.SVG_NAMESPACE, 'image'))

    this.model.views = this.model.views || {}
    this.model.views.mapIcon = this

    this.$el.data('model', this.model)

    this.model.on('change:office', this.onChangeOffice)
    this.model.on('change:desk', this.onChangeDesk)
    this.model.on('change:photo', this.renderPhoto)

    this.iconSize = this.SEATS[this.model.get('office')].iconSize
  }

  render () {
    if (this.$el.is(':empty')) {
      this.setTitle(this.$el, this.model.get('fullname'))

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
        this.console.warn('office ' + this.model.get('office') + ' has no desk at index ' + desk)
      }
    }

    return this.el
  }

  onChangeOffice (person, office) {
    this.remove()
  }

  onChangeDesk (person, desk) {
    this.render()
  }

  renderPhoto (person, photoPath) {
    this.el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', photoPath)
  }

  getSeatPosition (deskId) {
    return this.SEATS[this.model.get('office')].seatPositions[deskId]
  }
}

// ============================
// ===== roomDetailsView ======
// ============================

export class RoomDetailsView extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.className = 'roomDetailsView detailsView'
    this.CONTROL_PROTOCOL_TO_MANUFACTURER = {
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
  }

  initialize () {
    _.bindAll(this)
    this.els = {}
    this.data.endpoints.on('status', this.onStatusUpdate)
  }

  render () {
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

      dl.append($('<dt>', { text: 'Capacity' }))
      dl.append(this.els.seatingCapacity)

      dl.append($('<dt>', { text: 'Endpoint' }))
      dl.append(this.els.endpointManufacturer)

      dl.append($('<dt>', { text: 'IP Address' }))
      dl.append(this.els.endpointIpAddress)

      this.$el.append(dl)
    }

    if (this.model) {
      this.els.photo.attr('src', urljoin(this.baseURL, '/endpoints/', this.model.id, '/photo')) // causes flickering in Opera

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
  }

  renderStatus () {
    var statusBadgeEl = this.els.availabilityStatus.find('.statusBadge')

    if (this.model.get('status')) {
      this.els.availabilityStatus.find('.statusLabel').text(this.getStatusLabel())

      statusBadgeEl.removeClass('offline in-a-call reserved available')
      statusBadgeEl.addClass(this.getStatusLabel().replace(/\s/g, '-'))
      statusBadgeEl.show()
    } else {
      statusBadgeEl.hide()
    }
  }

  onStatusUpdate (endpoint, status) {
    if (this.model && (endpoint.id === this.model.id)) {
      this.renderStatus()
    }
  }

  getManufacturerLabel () {
    return this.CONTROL_PROTOCOL_TO_MANUFACTURER[this.model.get('controlProtocol')] || 'other'
  }

  getStatusLabel () {
    return this.model.getAvailability()
  }

  isBusy () {
    return this.model.getAvailability() !== 'available'
  }

  onImageLoadSuccess (event) {
    this.els.photo.show()
  }

  onImageLoadFailure (event) {
    this.els.photo.hide()
  }
}

// ============================
// ===== personDetailsView ====
// ============================

export class PersonDetailsView extends BackboneViews {
  constructor (...args) {
    super(...args)
    this.className = 'personDetailsView detailsView'
  }

  initialize () {
    _.bindAll(this)
    this.els = {}
  }

  formatPhoneNumber (phoneNumber) {
    // NO USELESS ESCAPE
    if (phoneNumber) return phoneNumber.replace(/[()]/g, '').replace(/[.]/g, '-')
    else return phoneNumber
  }

  render () {
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
        .attr('href', 'mailto:' + email + ((email || '').indexOf('@') === -1 ? '@bluejeans.com' : ''))
        .text(email)
        .closest('dd').prev('dt').addBack().toggle(!!email)

      this.els.linkedInProfile
        .attr('href', this.model.getLinkedInProfileUrl())
        .closest('dd').prev('dt').addBack().toggle(!!this.model.get('linkedInId'))

      this.els.mobilePhone
        .text(this.formatPhoneNumber(this.model.get('mobilePhone')))
        .prev('dt').addBack().toggle(!!this.model.get('mobilePhone'))

      this.els.workPhone
        .text(this.formatPhoneNumber(this.model.get('workPhone')))
        .prev('dt').addBack().toggle(!!this.model.get('workPhone'))

      this.$el.show()
    } else {
      this.$el.hide()
    }

    return this.el
  }
}
