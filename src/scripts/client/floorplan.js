// Primary dependencies
import jQuery from 'jquery'
import urlJoin from 'proper-url-join'
import { Mediator } from '../../../shared/mediator.min'

// Other dependencies
import { DetailsPane, ListPane, BVMap } from './BackboneViews'
import { People, Person, Endpoints } from './BackboneModels'
import './DataClasses'

// !!! Before version 3.0, this was "main.js" !!!

// Instantation
const mediator = new Mediator()
const collection = new People()
collection.fetch({ reset: true, success: initDeepLinking })
const endpoints = new Endpoints({ window })
endpoints.fetch({ reset: true, success: initEndpointStatusPoll })
const listPane = new ListPane({ document, window, collection, mediator, jQ$: jQuery('#listPane').get(0) })
const detailsPane = new DetailsPane({ document, window, collection, jQel: jQuery('#detailsPane').get(0) })
const map = new BVMap({ document, window, collection, mediator, jQel: jQuery('.map').get(0), office: window.floorplanParams.officeID })

// Do stuff
listPane.render()
detailsPane.render()
map.render()
bindEvents()

// ===== Other functions =====

function bindEvents () {
  mediator.subscribe('activatePerson', (inPerson, opts) => {
    const person = new Person(inPerson)
    if ((!person.get('office')) || (person.get('office') === window.floorplanParams.officeID)) {
      mediator.publish('activatePersonConfirmed', person, opts)
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

  mediator.subscribe('map:clickPerson', (person, opts) => {
    mediator.publish('activatePerson', person, opts)
  })

  mediator.subscribe('map:clickRoom', (endpointId, opts) => {
    if (endpointId) {
      const endpoint = endpoints.get(endpointId)
      if (endpoint) {
        endpoint.set({ seatingCapacity: opts.seatingCapacity })
        mediator.publish('activateRoom', endpoint, opts)
      }
    }
  })
}

function initDeepLinking () {
  mediator.subscribe('activatePersonConfirmed', (person, opts) => {
    if (!opts.skipHistory) {
      const path = getDeepLink(person)
      window.history.pushState({ personId: person.id }, null, path)
    }
  })

  window.addEventListener('popstate', (event) => {
    /*
       * Chrome fires popstate on fresh page load as well as intra-page navigation,
       * so we ignore popstate if the state is empty.
       * Drawback: load, go to person, hit back button results in staying on the person, not the empty form.
       */
    if (event.state) {
      const person = collection.get(event.state.personId)
      mediator.publish('activatePerson', person, { skipHistory: true })
    }
  }, false)

  const hashParts = window.location.hash.replace(/^#/, '').split('/')
  let personToActivate

  if (hashParts[0]) {
    const personId = hashParts[0]
    const person = collection.get(personId)
    if (person) {
      personToActivate = person
    }
  }

  if (personToActivate) {
    mediator.publish('activatePerson', personToActivate) // TODO should we skip history here?
  } else {
    detailsPane.toggleIntro(true)
  }
}

function getDeepLink (person) {
  return urlJoin(window.location.protocol, '/', (person.get('office') || ''), '#', person.id, '/', person.get('fullname').replace(/\s/g, '_'))
}

function initEndpointStatusPoll () {
  // TODO: Fix or eliminate this
  /*
  function pollEndpointStatus () {
    data.endpoints.each(function(endpoint){
    endpoint.fetchStatus().done(function(status){
       endpoint.trigger('status', endpoint, status);
     });
    });
    endpoints.fetchStatuses()
  }
  setInterval(pollEndpointStatus, 10 * 1000)
  pollEndpointStatus()
  */
  return true
}
