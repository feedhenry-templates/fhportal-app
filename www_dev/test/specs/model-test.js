define(function(require) {
  var models = require('userModel');
 
  describe('userModel', function() {
 
    describe('User Model', function() {
      it('sshould have actRoot of User"', function() {
        var sample = new models();
        sample.actRoot.should.equal('User');
      });
    });
 
  });
 
});