/*
import { $, jQuery } from '../lib/jquery.js'
import { urljoin } from '../lib/url-join.js'
import { Mediator } from '../lib/mediator.js'
import { People, Person } from './BackboneModels.js'
import * as BackboneViews from './BackboneViews.js'
*/

// Async calls per http://requirejs.org/docs/errors.html#notloaded
// RequireJS + Babel isn't smart enough for imports (yet)
const $ = require(['./lib/jquery'], () => {})
const urljoin = require(['./lib/url-join'], () => {})
const Mediator = require(['./lib/Mediator'], () => {})
const People = require(['./client/BackboneModels'], () => {}).People
const Person = require(['./client/BackboneModels'], () => {}).Person
const BackboneViews = require(['./client/BackboneViews'], () => {})

// Instantation
const bvObj = new BackboneViews()
const people = new People()
const listPane = bvObj.ListPane({ el: $('#listPane')[0], collection: people })
const editor = bvObj.Editor({ el: $('#editor')[0], collection: people })

listPane.render()
editor.render()

listPane.$('.people')
  .prepend($('<li>', { class: 'person add active' })
    .append($('<span>', { class: 'icon', text: '+' }))
    .append($('<div>', { class: 'name', text: 'add person' })))

Mediator.subscribe('activatePersonConfirmed', function (person, opts) {
  if (!opts.skipHistory) {
    let path = urljoin(global.baseURL, (person.isNew()
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
  if (event.state) this.mediator.publish('activatePerson', people.get(event.state.personId), { skipHistory: true })
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

    personToActivate = personToActivate || new Person()

    Mediator.publish('activatePersonConfirmed', personToActivate)
    editor.$el.show()
  }
})
