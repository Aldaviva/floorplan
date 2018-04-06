require.config({
  baseUrl: 'scripts',
  paths: {
    backbone: 'lib/backbone',
    jquery: 'lib/jquery',
    underscore: 'lib/underscore'
  },
  shim: {
    backbone: {
      deps: ['jQuery', 'underscore'],
      exports: 'Backbone'
    },
    underscore: {
      deps: ['jquery'],
      exports: '_'
    }
  }
})
