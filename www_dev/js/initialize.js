/*
    Require.js allows us to configure shortcut alias for complex paths. 
    These will be used later in app_init
*/
console.log("Initializing main.js -> Configuring RequireJS")
require.config({
    paths: {
        "jquery": '../components/jquery/jquery.min',
        "jqueryCookie": '../components/jquery.cookie/jquery.cookie',
        "fastButtons": '../js/fastButtons',
        "backbone": '../components/backbone/backbone-min',
        "bootstrap": '../components/bootstrap/dist/js/bootstrap.min',
        "snapjs": '../components/Snap.js/dist/latest/snap.min',
        "ladda": '../components/ladda/dist/ladda.min',
        "spin": '../components/ladda/dist/spin.min',
        "sprintf": '../components/sprintf/src/sprintf.min',
        "highcharts": '../components/highcharts/highcharts',
        "underscore": '../components/underscore/underscore-min',
        "template_path": '../app_backbone/templates',
        "view_path": '../app_backbone/views',
        "model_path": '../app_backbone/models',
        "collection_path": '../app_backbone/collections',
        "controller_path": '../app_backbone/controllers',
        "util_path": '../app_backbone/utils',
        "router": '../app_backbone/approuter',
        "applogic": '../app_backbone/applogic'
    },
    shim: { // Backbone Shim is required for templates to be loaded correctly http://stackoverflow.com/questions/14617523/requirejs-backbone-uncaught-typeerror-cannot-read-property-model-of-undefin
        'underscore': {
            exports: '_'
        },
        'sprintf': {
            exports: 'sprintf'
        },
        'fastButtons': {
            exports: 'fastButtons'
        },
        'bootstrap': {
            deps: ['jquery'],
            exports: 'bootstrap'
        },
        'backbone': {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'jqueryCookie': {
            deps: ['jquery']
        }
    }
});

require(
    ['app'] // Load our app module and pass it to our definition function 
    , function(App) { // The "app" dependency is returned as "App"
        window.App = App;
        console.log("Initializing App");
        App.initialize();
    }
);