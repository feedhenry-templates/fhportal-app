define([
    'jquery',
    'jqueryCookie',
    'underscore',
    'fastButtons',
    'backbone',
    'bootstrap',
    'view_path/SideBarView',
    'view_path/LoginView',
    'view_path/TabBarView',
    'view_path/HomeView',
    'view_path/UserView',
    'view_path/AppView'
], function($, $cookie, _, fastButtons, Backbone, bootstrap, SideBarView, Loginview, TabBarView, HomeView, UserView, AppView) {
    // IDEAS:
    // http://stackoverflow.com/questions/17634769/page-transitions-with-requirejs-and-backbone-js

    var Router = Backbone.Router.extend({
        routes: {
            "": "login",
            "login": "login",
            "home": "home",
            "logout": "logout",
            "users": "users",
            "apps": "apps",
            "stats": "stats"
        },

        initialize: function(options) {
            console.log("Initializing App Router");
            App.TabBarView = new TabBarView().render();
            App.SideBarView = new SideBarView().render();
            App.SideBar = new SideBarView().generateSnapper();
            // fastButtons.replace();
        },

        login: function() {
            console.log("Routing to Login");
            RegionManager.show(new Loginview());
            // fastButtons.replace();
        },

        home: function() {
            this.checkLogin(function() {
                console.log("Routing to Home")
                RegionManager.show(new HomeView());
                // fastButtons.replace();
            });
        },

        logout: function() {
            console.log("Modifying UserDetail")
            App.globalUserData.userInfo.logout();
        },

        users: function() {
            this.checkLogin(function() {
                console.log("Routing to Home")
                RegionManager.show(new UserView());
                // fastButtons.replace();
            });
        },

        apps: function() {
            this.checkLogin(function() {
                console.log("Routing to Apps")
                RegionManager.show(new AppView());
                // fastButtons.replace();
            });
        },

        checkLogin: function(successRenderCB) {
            if (parseInt(App.globalUserData.userInfo.get("IDKEY"), 16) > 0) { // convert the hex ID to a decimal for comparisons. It is set to 0 if no login available.
                if ($("#navbar").find(".navbar").is(":hidden")) { // render the navbar if it is hidden and login is ok. THis is a bit convoluted.
                    $("#navbar").find(".navbar").fadeIn(500);
                }
                successRenderCB();
            } else {
                console.log("User Session not found. Redirecting to Login");
                App.router.navigate("/login", true);
                App.globalUserData.userInfo.logout();
            }
        }
    });

    return Router;
});

// Handles closing and viewing... Used in Router!
RegionManager = (function(Backbone, $) {
    var currentView;
    var el = "#crux";
    var region = {};


    var closeView = function(view, closedCallback) {
        console.log("Attempting Closeview");
        killMigratedModalHTML();
        App.SideBar.close();
        if (view && view.close) {
            // if we are closing something, pass the rendering of the next page
            // as a callback, to make it look nicer
            console.log("Closing, calling callback")
            view.close(closedCallback);
        } else {
            console.log("Can't close, calling callback")
            closedCallback();
        }
    };

    var openView = function(view) {
        console.log("Rendering..")
        view.render();
        migrateModalHTML(view.el);

        $(el).html(view.el);
        if (view.onShow) {
            view.onShow();
        }
        App.currentView = view;
    };

    var killMigratedModalHTML = function(viewHTML) {
        console.log("Killing previous modal")
        // Check if a modal was created from the view and destroy it if so
        var modal = $('#modal-div').find(".modal");
        $(modal).remove();
    }

    var migrateModalHTML = function(viewHTML) {
        // Check if the view contains a modal for transfer outside of this el
        // <div name="transfer_modal_html_block"> <!-- this gets put in $('#modal-div') -->
        if ($(viewHTML).find('div[name="transfer_modal_html_block"]')) {
            var sourceHTML = $(viewHTML).find('div[name="transfer_modal_html_block"]').html();
            $('#modal-div').html(sourceHTML);
            $(viewHTML).find('div[name="transfer_modal_html_block"]').html("");
        }
    }

    region.show = function(view) {
        console.log("Render func called");
        closeView(currentView, function() {
            console.log("Attempting Open");
            currentView = view;
            openView(currentView);
        });
    };

    return region;
})(Backbone, jQuery);