// npm + Browserify dependencies
import jQuery from 'jquery'
import { Mediator } from 'mediator-js'
import urlJoin from 'proper-url-join'

// Other dependencies
import { People, Person } from './BackboneModels'
import { Editor, ListPane } from './BackboneViews'
import Data from './Data'

// Instantation
const collection = new People()
const mediator = new Mediator()
const listPane = new ListPane({$el: ('#listPane')[0]})
const editor = new Editor({$el: ('#editor')[0]})

listPane.render()
editor.render()

listPane.$('.people')
  .prepend(jQuery('<li>', { class: 'person add active' })
    .append(jQuery('<span>', { class: 'icon', text: '+' }))
    .append(jQuery('<div>', { class: 'name', text: 'add person' })))

mediator.subscribe('activatePersonConfirmed', function (person, opts) {
  if (!opts.skipHistory) {
    let path = urlJoin(window.location.protocol, (person.isNew()
      ? '/admin/'
      : '/admin/', person.id, '#', person.get('fullname').replace(/\s/g, '_'))).toString()
    window.history.pushState({ personId: person.id }, null, path)
  }
})

window.addEventListener('popstate', (event) => {
  /*
     * Chrome fires popstate on fresh page load as well as intra-page navigation,
     * so we ignore popstate if the state is empty.
     * Drawback: load, go to person, hit back button results in staying on the person, not the empty form.
     */
  if (event.state) window.mediator.publish('activatePerson', collection.get(event.state.personId), { skipHistory: true })
}, false)

collection.fetch({
  reset: true,
  success: () => {
    let person
    let pathnameParts = window.location.pathname.replace(new RegExp('^' + Data.nodeData.baseURL), '').split('/')
    if (pathnameParts.length >= 3) person = collection.get(pathnameParts[2])
    mediator.publish('activatePersonConfirmed', person || new Person())
    editor.$el.show()
  }
})
