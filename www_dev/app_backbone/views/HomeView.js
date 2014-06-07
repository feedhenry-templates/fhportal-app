define([
    'underscore',
    'backbone',
    'snapjs',
    'text!template_path/HomeTemplate.html'
], function(_, Backbone, Snap, HomeTemplate) {
    var HomeView = Backbone.View.extend({
        initialize: function(options) {
            this.render = _.bind(this.render, this);
        },

        render: function() {
            _.templateSettings.variable = "data";
            console.info("Rendering Home")
            var userDetail = App.globalUserData.userInfo;
            var compiledTemplate = _.template(HomeTemplate, userDetail);
            $(this.el).html(compiledTemplate);
            $(this.el).hide();

            // Modify the model of the sidebar now to trigger a render of new data
            App.SideBarView.sideBarData.resetSettings();
            App.SideBarView.sideBarData.set("demo", true)
            return this;
        },

        close: function(closedCallback) {
            $(this.el).fadeOut(300, function() {
                this.remove();
            });
            closedCallback();
        },

        onShow: function() {
            $(this.el).fadeIn();
        }

    });
    return HomeView;

});