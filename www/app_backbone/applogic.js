/*###########################
## Why does this exist?
############################
This file exists to separate required
javascript stuff for backbone and app
operation, from app behavioral stuff
like a login state.

A login state is separate from a 
backbone router.
*/

define([
    'backbone',
    'collection_path/UserData'
], function(Backbone, UserData) {
    var initialize = function(options) {
        console.info("Initializing App Logic")
        var self = this;

        // Create a user instance for login data
        App.globalUserData = new UserData;
    };
    return {
        initialize: initialize
    };
});