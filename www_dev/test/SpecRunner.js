require.config({
  baseUrl: '/test',
  paths: {
    'jquery'        : '/js/libs/jquery/jquery-min',
    'underscore'    : '/js/libs/underscore/underscore-min',
    'backbone'      : '/js/libs/backbone/backbone-min',
    'mocha'         : 'libs/mocha',
    'chai'          : 'libs/chai',
    'chai-jquery'   : 'libs/chai-jquery',
    'userModel'        : '/js/models/UserModel'
  },
  shim: {
    'underscore': {
      exports: '_'
    },
    'jquery': {
      exports: '$'
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'chai-jquery': ['jquery', 'chai']
  },
  urlArgs: 'bust=' + (new Date()).getTime()
});
 
require(['require', 'chai', 'chai-jquery', 'mocha', 'jquery'], function(require, chai, chaiJquery){
 
  // Chai
  var should = chai.should();
  chai.use(chaiJquery);
 
  /*globals mocha */
  mocha.setup('bdd');
 
  require([
    'test/specs/model-test.js',
  ], function(require) {
    mocha.run();
  });
 
});