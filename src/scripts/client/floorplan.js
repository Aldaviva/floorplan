/*
import { $, jQuery } from '../lib/jquery.js'
import { Mediator } from '../lib/mediator.js'
import { People, Person, Endpoints, Endpoint } from './BackboneModels.js'
import * as BackboneViews from './BackboneViews.js'
*/

// Async calls per http://requirejs.org/docs/errors.html#notloaded
// RequireJS + Babel isn't smart enough for imports (yet)
const $ = require(['./lib/jquery'], () => {})
const Mediator = require(['./lib/Mediator'], () => {})
const People = require(['./client/BackboneModels'], () => {}).People
const Person = require(['./client/BackboneModels'], () => {}).Person
const Endpoints = require(['./client/BackboneModels'], () => {}).Endpoints
const BackboneViews = require(['./client/BackboneViews'], () => {})

// Instantation
const bvObj = new BackboneViews()
const people = new People()
people.fetch({ reset: true, success: initDeepLinking })
const endpoints = Endpoints.fetch({ reset: true, success: initEndpointStatusPoll })
const listPane = bvObj.ListPane({ el: $('#listPane')[0], collection: people })
const detailsPane = bvObj.DetailsPane({ el: $('#detailsPane')[0] })
// var map = BackboneViews.Map({ el: $('.map')[0], collection: data.people, office: window.floorplanParams.officeID })
const map = bvObj.Map({ el: $('.map')[0], collection: people })

render()
bindEvents()

function render () {
  listPane.render()
  detailsPane.render()
  map.render()
}

function bindEvents () {
  Mediator.subscribe('activatePerson', function (inPerson, opts) {
    let person = new Person(inPerson)
    if ((!person.get('office')) || (person.get('office') === window.floorplanParams.officeID)) {
      Mediator.publish('activatePersonConfirmed', person, opts)
    } else {
      window.location.replace(getDeepLink(person))
    }
  })

  /* Piwik event
  mediator.subscribe('activatePersonConfirmed', function (person, opts) {
    if (_paq) {
      _paq.push(['trackEvent', 'person', 'view', person.get('fullname')])
    }
  }) */

  Mediator.subscribe('map:clickPerson', function (person, opts) {
    Mediator.publish('activatePerson', person, opts)
  })

  Mediator.subscribe('map:clickRoom', function (endpointId, opts) {
    if (endpointId) {
      let endpoint = endpoints.get(endpointId)
      if (endpoint) {
        endpoint.set({ seatingCapacity: opts.seatingCapacity })
        Mediator.publish('activateRoom', endpoint, opts)
      }
    }
  })
}

function initDeepLinking () {
  Mediator.subscribe('activatePersonConfirmed', function (person, opts) {
    if (!opts.skipHistory) {
      let path = getDeepLink(person)
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
      let person = people.get(event.state.personId)
      Mediator.publish('activatePerson', person, { skipHistory: true })
    }
  }, false)

  let hashParts = window.location.hash.replace(/^#/, '').split('/')
  let personToActivate

  if (hashParts[0]) {
    let personId = hashParts[0]
    let person = people.get(personId)
    if (person) {
      personToActivate = person
    }
  }

  if (personToActivate) {
    Mediator.publish('activatePerson', personToActivate) // TODO should we skip history here?
  } else {
    detailsPane.toggleIntro(true)
  }
}

function getDeepLink (person) {
  return global.baseURL + '/' + (person.get('office') || '') + '#' + person.id + '/' + person.get('fullname').replace(/\s/g, '_')
}

function initEndpointStatusPoll () {
  function pollEndpointStatus () {
    // data.endpoints.each(function(endpoint){
    //  endpoint.fetchStatus().done(function(status){
    //    endpoint.trigger('status', endpoint, status);
    //  });
    // });
    endpoints.fetchStatuses()
  }
  setInterval(pollEndpointStatus, 10 * 1000)
  pollEndpointStatus()
}
