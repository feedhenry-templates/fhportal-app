define([
    'underscore',
    'backbone',
    'model_path/UserInfo'
], function(_, Backbone, UserInfo){
    var UserCollection = Backbone.Collection.extend({

        initialize: function(models, options) {
        	this.userInfo = new UserInfo;
        }

    });

    return UserCollection;
});