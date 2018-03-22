// Imports
var BackboneViews = require('./app/BackboneViews')
var Models = require('./app/Models')
var Mediator = require('./lib/mediator').Mediator

// Declarations
var bv = new BackboneViews()
var models = new Models()
var mediator = new Mediator()
var data = models.data
var listPane = bv.listPane({ el: $('#listPane')[0], collection: data.people })
var detailsPane = bv.detailsPane({ el: $('#detailsPane')[0] })
var map = bv.map({ el: $('.map')[0], collection: data.people, office: floorplanParams.officeID })

render()
bindEvents()

data.people.fetch({ reset: true, success: initDeepLinking })
data.endpoints.fetch({ reset: true, success: initEndpointStatusPoll })

function render () {
  listPane.render()
  detailsPane.render()
  map.render()
}

function bindEvents () {
  mediator.subscribe('activatePerson', function (person, opts) {
    if ((!person.get('office')) || (person.get('office') == floorplanParams.officeID)) {
      mediator.publish('activatePersonConfirmed', person, opts)
    } else {
      window.location.replace(getDeepLink(person))
    }
  })

  mediator.subscribe('activatePersonConfirmed', function (person, opts) {
    if (_paq) {
      _paq.push(['trackEvent', 'person', 'view', person.get('fullname')])
    }
  })

  mediator.subscribe('map:clickPerson', function (person, opts) {
    mediator.publish('activatePerson', person, opts)
  })

  mediator.subscribe('map:clickRoom', function (endpointId, opts) {
    if (endpointId) {
      var endpoint = data.endpoints.get(endpointId)
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
      var person = data.people.get(event.state.personId)
      mediator.publish('activatePerson', person, { skipHistory: true })
    }
  }, false)

  var hashParts = window.location.hash.replace(/^#/, '').split('/')
  var personToActivate

  if (hashParts[0]) {
    var personId = hashParts[0]
    var person = data.people.get(personId)
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
    data.endpoints.fetchStatuses()
  }
  setInterval(pollEndpointStatus, 10 * 1000)
  pollEndpointStatus()
}
