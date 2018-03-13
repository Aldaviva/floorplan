// Original source: https://github.com/volojs/create-template
// Reference: http://requirejs.org/docs/api.html

// Config
requirejs.config({
  baseUrl: 'scripts/lib',
  paths: {
    app: '../app',
    loadImage: '../loadImage',
    jquery: 'jquery-3.3.1.min',
    underscore: 'underscore-min',
    backbone: 'backbone-min',
    lodash: 'lodash.min',
    mediator: 'mediator.min',
    oauth: 'oauth',
    q: 'q.min',
    sha1: 'sha1-min',
    store: 'store.min',
    svg: 'svg.min'
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
requirejs(['jquery', 'underscore', 'backbone', 'lodash', 'mediator', 'oauth', 'q', 'sha1', 'store', 'underscore', 'svg'])

// https://github.com/blueimp/JavaScript-Canvas-to-Blob
requirejs(['canvas-to-blob.min'])
global.dataURLtoBlob = require[requirejs.baseUrl + '/canvas-to-blob.min']

// loadImage scripts (combined version doesn't load right)
requirejs(['loadImage/load-image'])
requirejs(['loadImage/load-image-exif'])
requirejs(['loadImage/load-image-exif-map'])
requirejs(['loadImage/load-image-fetch'])
requirejs(['loadImage/load-image-meta'])
requirejs(['loadImage/load-image-orientation'])
requirejs(['loadImage/load-image-scale'])

// Local scripts in "app"
requirejs(['app/data'])
requirejs(['app/DetailsPane'])
requirejs(['app/Editor'])
requirejs(['app/IntroView'])
requirejs(['app/ListPane'])
requirejs(['app/Map'])
requirejs(['app/PersonDetailsView'])
requirejs(['app/RoomDetailsView'])
requirejs(['app/yelp'])
requirejs(['app/admin'])
requirejs(['app/main'])
