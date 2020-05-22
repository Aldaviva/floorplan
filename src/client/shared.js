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
const listPane = new ListPane({ document, window, collection, mediator, jQ$: jQuery('#listPane').get(0) })
const editor = new Editor({ document, window, collection, mediator, jQ$: jQuery('#editor').get(0) })
