define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var TabBarModel = Backbone.Model.extend({
    defaults : {
        items: [
            {
                title: "Home",
                href: "#home",
                glyphicon: "glyphicon-home"
            },
            {
                title: "Logout",
                href: "#logout",
                glyphicon: "glyphicon-log-out"
            },
            {
                title: "Users",
                href: "#users",
                glyphicon: "glyphicon-user"
            },
            {
                title: "Apps",
                href: "#apps",
                glyphicon: "glyphicon-phone"
            }
            // ,
            // {
            //     title: "Stats",
            //     href: "#stats",
            //     glyphicon: "glyphicon-stats"
            // }
        ]
    }
  });
  return TabBarModel;
});
