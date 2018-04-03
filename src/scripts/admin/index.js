// Declarations
import * as $ from './lib/jquery-min.js'
import * as Mediator from './lib/mediator.js'
import * as urljoin from './lib/url-join.js'
import * as BackboneModels from './BackboneModels.js'
import * as BackboneViews from './BackboneViews.js'

// Instantation
var mediator = new Mediator()
var people = BackboneModels.People.fetch()
var listPane = new BackboneViews.ListPane({ el: $('#listPane')[0], collection: people })
var editor = new BackboneViews.Editor({ el: $('#editor')[0], collection: people })

listPane.render()
editor.render()

listPane.$('.people')
  .prepend($('<li>', { class: 'person add active' })
    .append($('<span>', { class: 'icon', text: '+' }))
    .append($('<div>', { class: 'name', text: 'add person' })))

mediator.subscribe('activatePersonConfirmed', function (person, opts) {
  if (!opts.skipHistory) {
    var path = urljoin(global.baseURL, (person.isNew()
      ? '/admin/'
      : '/admin/', person.id, '#', person.get('fullname').replace(/\s/g, '_'))).toString()
    window.history.pushState({ personId: person.id }, null, path)
  }
})

window.addEventListener('popstate', function (event) {
  /*
     * Chrome fires popstate on fresh page load as well as intra-page navigation,
     * so we ignore popstate if the state is empty.
     * Drawback: load, go to person, hit back button results in staying on the person, not the empty form.
     */
  if (event.state) {
    var person = people.get(event.state.personId)
    this.mediator.publish('activatePerson', person, { skipHistory: true })
  }
}, false)

people.fetch({
  reset: true,
  success: function () {
    var pathnameParts = window.location.pathname.replace(new RegExp('^' + global.baseURL), '').split('/')
    var personToActivate

    if (pathnameParts.length >= 3) {
      var personId = pathnameParts[2]
      var person = people.get(personId)
      if (person) {
        personToActivate = person
      }
    }

    personToActivate = personToActivate || new BackboneModels.Person()

    mediator.publish('activatePersonConfirmed', personToActivate)
    editor.$el.show()
  }
})
