define([
    'underscore',
    'backbone',
    'model_path/SideBarModel',
    'text!template_path/SideBarTemplate.html'
], function(_, Backbone, SideBarModel, SideBarTemplate) {

    var SideBarView = Backbone.View.extend({
        el: $("#snap-window"),
        sideBarData: new SideBarModel(),

        events: {},

        initialize: function(options) {
            console.info("Initializing SideBarView")
            this.render = _.bind(this.render, this);
            this.sideBarData.bind('change', this.render);
        },

        render: function() {
            console.info("Rendering SideBarView")
            _.templateSettings.variable = "data";
            var compiledTemplate = _.template(SideBarTemplate, this.sideBarData);
            this.$el.html(compiledTemplate);
            return this;
        },

        generateSnapper: function() {
            // Create the snapper
            var snapBar = new Snap({
                element: document.getElementById('main-window')
            });
            // Major optimize speed on android
            snapBar.settings({
                flickThreshold: 500,
                hyperextensible: false,
                tapToClose: true,
                minDragDistance: 10
            })
            // Lock vertical scrolling while snapping
            snapBar.on('drag', function() { // this switch prevents the overscroll.js file from scrolling vertically while swiping
                window.lockscroll_Y = true;
            });
            snapBar.on('animated', function() {
                window.lockscroll_Y = false;
            });
            return snapBar;
        }

    });
    return SideBarView;

});