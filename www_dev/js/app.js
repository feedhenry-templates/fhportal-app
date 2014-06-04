// Filename: app.js
/*
	This file generates the app logic.
	initialize.js will load this file through requirejs
	and assign it to the window.App object

	Note: The modules below are likely shortcuts defined in initialize.js
*/

define([
        'jquery', // Load up some pre-requisites for the app
        'jqueryCookie',
        'underscore',
        'backbone',
        'feedhenry', // Load up the FH library
        'router', // Load up the app logic
        'applogic'
    ],
    function($, $cookie, _, Backbone, $fh, Router, AppLogic) {

        var initialize = function(options) {
            App.EventBus = new _.extend({}, Backbone.Events);
            // Initialize app behavior
            AppLogic.initialize();
            // Get the app Routing working
            App.router = new Router();
            Backbone.history.start();

        };

        return {
            initialize: initialize
        };
    }
);