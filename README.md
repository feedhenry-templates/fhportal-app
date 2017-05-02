> NO LONGER MAINTAINED

FhPortal_v3 Client
==========================

A sample management Hybrid App for the old feedhenry studio.

# Grunt

This template uses [Grunt](http://gruntjs.com/), the Javascript Task Runner. To use Grunt with this Template App, do the following:

* Install grunt: ```npm install -g grunt-cli```
* In your App directory, run: ```npm install```. This installs Grunt plugins, etc for use with this App.

### Recommended Development Methods ###

## CLIENT

This template uses grunt, bower, requirejs, and backbone.

Here is how this app was developed:

* Make changes in www_dev
* Run ```grunt serve:local_dev``` to run an instance of the client, while pointing to a local instance of your cloud code
* Use bower to install any components you may need
* Run ```grunt build``` to build a version of the client with minified code and component documentation removed, etc.
* Use git as usual when your client changes are complete to push the code to the studio.

## CLOUD

You can also use Grunt to point your App at a local developement server. To do this, use the ```grunt serve:local``` command within your cloud directory (In this case: ```../FhPortal_v3-FhPortal_v3-MBAAS```). Some notes on using the serve:local task:

* by default, the local server development url is: http://localhost:8001
* you can change this directly in your local Gruntfile.js, in the app config:

```
  app: {
    // configurable paths
    app: 'www',
    url: '',
    default_local_server_url: 'http://localhost:8001'
  },
```

* you can also pass a 'url' optional flag to server:local, e.g. ```grunt serve:local --url=http://localhost:9000```

* We can also write your own tasks by extending the Gruntfile.js, e.g. add a 'serve:live' target that hits your server in your FeedHenry live enivronment.
