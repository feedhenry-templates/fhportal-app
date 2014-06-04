define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var SideBarModel = Backbone.Model.extend({
    defaults : {
        "demo": false,
        "left-heading": "Left View",
        "left-data": '',
        "right-heading": "Right View",
        "right-data": ''
    },

    resetSettings: function(){
      this.set("demo", false);
      App.SideBar.settings({
        'speed': 0.3,
        'easing': "ease",
        'disable': "none"
      });
    },

    updateSettings: function(opts){
      App.SideBar.settings(opts);
    }

  });

  

  return SideBarModel;
});
