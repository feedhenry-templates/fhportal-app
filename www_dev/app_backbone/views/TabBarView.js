define([
    'underscore',
    'backbone',
    'model_path/TabBarModel',
    'text!template_path/TabBarTemplate.html'
], function(_, Backbone, TabBarModel, TabBarTemplate) {

    var TabBarView = Backbone.View.extend({
        el: $("#navbar"),
        model: new TabBarModel(),

        events: {
            'click .navbar-nav': 'autoCloseDropdown'
        },

        initialize: function(options) {
            console.info("Initializing TabBarView")
            this.render = _.bind(this.render, this);
            this.model.bind('change', this.render);
        },

        render: function() {
            console.info("Rendering TabBarView")
            var compiledTemplate = _.template(TabBarTemplate, this.model.attributes);
            this.$el.html(compiledTemplate);
            return this;
        },

        autoCloseDropdown: function() {
            if (!$('#diag_viewXs').is(':hidden')) { // Check if the diagnostic div in index.html is visible (bootstrap hides certain divs based on view size!)
                $('.navbar-collapse').collapse("hide");
            }
        }

    });
    return TabBarView;

});