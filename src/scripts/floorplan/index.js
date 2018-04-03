// Declarations
import * as $ from './lib/jquery-min.js'
import * as Mediator from './lib/mediator.js'
import * as BackboneModels from './BackboneModels.js'
import * as BackboneViews from './BackboneViews.js'

// Instantation
let mediator = new Mediator()
var people = BackboneModels.People.fetch({ reset: true, success: initDeepLinking })
var endpoints = BackboneModels.Endpoints.fetch({ reset: true, success: initEndpointStatusPoll })
var listPane = BackboneViews.ListPane({ el: $('#listPane')[0], collection: people })
var detailsPane = BackboneViews.DetailsPane({ el: $('#detailsPane')[0] })
// var map = BackboneViews.Map({ el: $('.map')[0], collection: data.people, office: window.floorplanParams.officeID })
var map = BackboneViews.Map({ el: $('.map')[0], collection: people })

render()
bindEvents()

function render () {
  listPane.render()
  detailsPane.render()
  map.render()
}

function bindEvents () {
  mediator.subscribe('activatePerson', function (person, opts) {
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

  mediator.subscribe('map:clickPerson', function (person, opts) {
    mediator.publish('activatePerson', person, opts)
  })

  mediator.subscribe('map:clickRoom', function (endpointId, opts) {
    if (endpointId) {
      var endpoint = endpoints.get(endpointId)
      if (endpoint) {
        endpoint.set({ seatingCapacity: opts.seatingCapacity })
        mediator.publish('activateRoom', endpoint, opts)
      }
    }
  })
}

function initDeepLinking () {
  mediator.subscribe('activatePersonConfirmed', function (person, opts) {
    if (!opts.skipHistory) {
      var path = getDeepLink(person)
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
      mediator.publish('activatePerson', person, { skipHistory: true })
    }
  }, false)

  var hashParts = window.location.hash.replace(/^#/, '').split('/')
  var personToActivate

  if (hashParts[0]) {
    var personId = hashParts[0]
    var person = people.get(personId)
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
