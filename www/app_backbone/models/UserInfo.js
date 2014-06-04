define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var UserInfo = Backbone.Model.extend({
    defaults : {
        "IDKEY": 0,
        "csrftoken": null,
        "cookieJar": {},
        "root": "",
        "name": "Default Name",
        "email": "default.email@example.com",
        "domain": "NoDomain",
        "customer": "A Customer",
        "roles": [{
            "type": "sub",                
            "name": "AppStore User",
            "label_disabled": "label-default",
            "label_enabled": "label-info",
            "exists": false
          },{
            "type": "dev",                
            "name": "Developer",
            "label_disabled": "label-default",
            "label_enabled": "label-info",
            "exists": false
          },{
            "type": "analytics",                
            "name": "Reporting User",
            "label_disabled": "label-default",
            "label_enabled": "label-info",
            "exists": false
          },{
            "type": "devadmin",                
            "name": "Developer Admin",
            "label_disabled": "label-default",
            "label_enabled": "label-info",
            "exists": false
          },{
            "type": "portaladmin",                
            "name": "Portal Admin",
            "label_disabled": "label-default",
            "label_enabled": "label-info",
            "exists": false
          },{
            "type": "customeradmin",              
          	"name": "Customer Admin",
          	"label_disabled": "label-default",
            "label_enabled": "label-info",
            "exists": false
          }]
    },

    initialize: function(){
      console.log("Creating new userData object");
      App.EventBus.on("userInfo:transitLogin", this.transitToLogin)
    },

    setRoles: function(roleList){
      availableRoles = this.get("roles");
      for (roleIndex in roleList){
        role = roleList[roleIndex]
        for (aRoleIndex in availableRoles){
          aRole = availableRoles[aRoleIndex];
          if (aRole['type'] == role){
            aRole['exists'] = true;
          }
        }
      }
    },

    setUserInfo: function(userInfo){
       this.set("name", userInfo['name']);
       this.set("email", userInfo['email']);
       this.set("customer", userInfo['tenant']);
    },

    setLoginID: function(sessionID){
      this.set("IDKEY", sessionID);
      return this.get("IDKEY");
    },

    setCSRF: function(csrf){
      this.set("csrftoken", csrf);
    },

    setDomain: function(domain){
      console.log("Domain is being set: %s", domain)
      this.set("domain", domain);
      return this.get("domain");
    },
    
    logout: function(){
      console.log("Logging out!");
      this.set({
        name: null,
        email: null,
        customer: null,
        IDKEY: 0
      });
      App.EventBus.trigger("userInfo:transitLogin", {});
    },

    transitToLogin: function(){
      App.router.navigate("", true);
      Backbone.history.navigate("", true);
    }

  });
  return UserInfo;
});