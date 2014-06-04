define({
    deferredActCall: function(dataObj, deferred, stateName, notification, act, req, startPercentage, endPercentage) {
        // Send a notification for updating the status
        console.log("Performing ACT call (%s)", act);
        console.log("Sending ACT data", req);
        deferred.notify($.extend({
            "opStatus": 0,
            "textStatus": notification,
            "stateName": stateName,
            "opPercent": startPercentage
        }, dataObj));
        // Perform the operation
        $fh.act({
                act: act,
                req: req
            },
            function(res) {
                if (!res.error) { // if no error, notify with success (opStatus = 1)
                    deferred.notify($.extend({
                        "opStatus": 1,
                        "textStatus": notification,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    }, dataObj));
                    console.log("ACT call (%s) succeeded with response:", act, res);
                    dataObj[stateName] = res;
                    deferred.resolve(dataObj);
                } else { // if error, notify with failure (opStatus = 2)
                    deferred.notify($.extend({
                        "opStatus": 2,
                        "textStatus": notification,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    }, dataObj));
                    console.log("ACT call (%s) failed with response:", act, res);
                    deferred.reject({
                        "errorMsg": res.error
                    });
                }
            },
            function(errType, res) {
                deferred.notify($.extend({
                    "opStatus": 2,
                    "textStatus": notification,
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