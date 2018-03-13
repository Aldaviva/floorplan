this.DetailsPane = (function () {
  var DetailsPane = Backbone.View.extend({
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

      this.introView = new IntroView()
      this.personDetailsView = new PersonDetailsView()
      this.roomDetailsView = new RoomDetailsView()
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

  return DetailsPane
})()
