define({
    /*
        dataObj: The data object that is passed through deffered chains. This will include a new key:value pair for the response from this call using the key of stateName
        deferred: The deferred object to add this to. We are including the call itself, and telling it what happens on success or failure
        stateName: The key to be used for various notifications and storing of responses in the dataObj
        notificationMsg: The text to be passed with notifications
        path: The path of the cloud call
        data: The data to be passed to the cloud call
        startPercentage: Passed with notifications to be used for adjusting percentage bars and such
        endPercentage: Passed with notifications to be used for adjusting percentage bars and such
        onResolve: function to be called within resolution of the call. Putting it here instead of in the next function of the chain prevents syncronous code executing early
    */
    deferredCloudCall: function(dataObj, deferred, stateName, notificationMsg, path, data, startPercentage, endPercentage, onResolve) {
        // Send a notification for updating the status
        console.info("Performing $fh.cloud call (%s)", path);
        console.info("Sending data: ", data);
        deferred.notify($.extend({
            "opStatus": 0,
            "textStatus": notificationMsg,
            "stateName": stateName,
            "opPercent": startPercentage
        }, dataObj));
        // Perform the operation
        $fh.cloud({
                path: path,
                data: data
            },
            function(res) {
                if (!res.error) {
                    // if no error, notify with success (opStatus = 1)
                    deferred.notify($.extend({
                        "opStatus": 1,
                        "textStatus": notificationMsg,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    }, dataObj));

                    console.info("Cloud call (%s) succeeded with response:", path, res);
                    dataObj[stateName] = res; // Store the response in the dataObj for future access
                    if (onResolve)
                        onResolve(); // Now run that onResolve function if it exists
                    deferred.resolve(dataObj); // Resolve the promise here
                } else {
                    // if error, notify with failure (opStatus = 2)
                    deferred.notify($.extend({
                        "opStatus": 2,
                        "textStatus": notificationMsg,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    }, dataObj));

                    console.error("Cloud call (%s) failed with response:", path, res);
                    deferred.reject({
                        "errorMsg": res.error
                    });
                }
            },
            function(errType, res) {
                deferred.notify($.extend({
                    "opStatus": 2,
                    "textStatus": notificationMsg,
                    "stateName": stateName,
                    "opPercent": endPercentage
                }, dataObj));
                deferred.reject({
                    "errorMsg": res.error
                });
            }
        );
        return deferred;
    },

    // I am so soo sorry this exists. But it must.
    // Deferred objects must be constructed fully
    // before any of it resolves! 
    // So we use this for calls that are synchronous, 
    // which generally exist because of drastically 
    // different functionality which should be separate
    syncDelay: function(func) {
        setTimeout(func, 5); // 1ms works, but 5ms to be safe.. I hate this.
    }

});