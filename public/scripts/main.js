// Original source: https://github.com/volojs/create-template
// Reference: http://requirejs.org/docs/api.html

// Config
requirejs.config({
  baseUrl: 'scripts',
  paths: {
    loadImage: 'loadImage',
    jquery: 'lib/jquery-3.3.1.min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
    lodash: 'lib/lodash.min',
    mediator: 'lib/mediator.min',
    oauth: 'lib/oauth',
    q: 'lib/q.min',
    sha1: 'lib/sha1-min',
    store: 'lib/store.min',
    svg: 'lib/svg.min',
    urljoin: 'lib/url-join.min'
  },
  shim: {
    backbone: {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    },
    underscore: {
      exports: '_'
    }
  }
})

// Assorted library scripts
requirejs(['jquery', 'underscore', 'backbone', 'lodash', 'mediator', 'oauth', 'q', 'sha1', 'store', 'underscore', 'svg', 'urljoin'])

// https://github.com/blueimp/JavaScript-Canvas-to-Blob
requirejs(['lib/canvas-to-blob.min'])
global.dataURLtoBlob = require['lib/canvas-to-blob.min']

// loadImage scripts (combined version doesn't load right)
requirejs(['loadImage/load-image'])
requirejs(['loadImage/load-image-exif'])
requirejs(['loadImage/load-image-exif-map'])
requirejs(['loadImage/load-image-fetch'])
requirejs(['loadImage/load-image-meta'])
requirejs(['loadImage/load-image-orientation'])
requirejs(['loadImage/load-image-scale'])

// Local provider scripts
requirejs(['app/data'])
requirejs(['app/DetailsPane'])
requirejs(['app/ListPane'])
requirejs(['app/Map'])
requirejs(['app/Editor'])
requirejs(['app/yelp'])

// Local consumer scripts
requirejs(['app/IntroView'])
requirejs(['app/PersonDetailsView'])
requirejs(['app/RoomDetailsView'])
requirejs(['app/admin'])
requirejs(['app/main'])
