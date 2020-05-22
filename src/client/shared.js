/* eslint no-unused-vars: "off" */

import { Editor, ListPane, DetailsPane, BVMap } from './BackboneViews'
import { People, Person, Endpoints } from './BackboneModels'
import urlJoin from 'proper-url-join'
import './DataClasses'

// jQuery
const jQuery = require('jquery')
window.jQuery = jQuery
window.$ = jQuery.jQ$
window.jQ$ = jQuery.jQ$

// Mediator
const Mediator = require('mediator-js').Mediator
const mediator = new Mediator()

// Instantation
const collection = new People()
const listPane = new ListPane({
  document,
  window,
  collection,
  mediator,
  jQ$: jQuery('#listPane').get(0)
})
const editor = new Editor({
  document,
  window,
  collection,
  mediator,
  jQ$: jQuery('#editor').get(0)
})

window.addEventListener(
  'popstate',
  (event) => {
    /*
     * Chrome fires popstate on fresh page load as well as intra-page navigation,
     * so we ignore popstate if the state is empty.
     * Drawback: load, go to person, hit back button results in staying on the person, not the empty form.
     */
    if (event.state) {
      window.mediator.publish(
        'activatePerson',
        collection.get(event.state.personId),
        { skipHistory: true }
      )
    }
  },
  false
)
