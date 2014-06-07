define([
    'underscore',
    'backbone',
    'ladda',
    'snapjs',
    'sprintf',
    'highcharts',
    'controller_path/HighChartCreation',
    'util_path/appUtils',
    'model_path/AppModel',
    'text!template_path/AppTemplate.html'
], function(_, Backbone, Ladda, Snap, sprintf, highcharts, hcHelper, utils, AppModel, AppTemplate) {

    var AppView = Backbone.View.extend({
        model: new AppModel(),

        /*##################################
        ## MAIN FUNCTIONALITY ENTRY
        #################################### */
        // Define the events that can be invoked in this view
        events: {
            'click #processStartBtn': 'startProcessFlow'
        },

        // NOTE: There is heavy use of deferred/promises, nice guide below
        // http://danieldemmel.me/blog/2013/03/22/an-introduction-to-jquery-deferred-slash-promise/

        startProcessFlow: function() {
            var currentView = App.currentView;
            console.info("Logging Ladda", Ladda);
            $.when(currentView.toggleIntro({}))
                .then(currentView.toggleProgressModalShown)
                .then(currentView.getLoginID)
                .then(currentView.requestApps)
                .then(currentView.populateAppList)
                .then(currentView.toggleProgressModalShown)
                .done(function() { // can't manage events outside of the div
                    // MAKE A MODEL UPDATE AND THEN RENDER SHITE!
                    $('.appListSelectable').unbind("click").click(currentView.startLoadAppFlow);
                })
                .fail(currentView.handleError) // rejects will cascade to final then to find an error function.
            .progress(currentView.transitionProgress) // handles updates that cascade via .notify()
        },

        startLoadAppFlow: function(event) {
            var currentView = App.currentView;
            console.info("Staring App Flow");
            $.when(currentView.getClickedApp({
                "clicked": this
            }))
                .then(currentView.populateAppData)
                .then(currentView.showAppData)
                .then(currentView.getLoginID)
                .done(currentView.startAppPingLoop)
                .fail(currentView.handleError)
        },

        buildApp: function(e) {
            var clickedButton = e.currentTarget;
            var appGuid = $(clickedButton).attr("app");
            var appID = $(clickedButton).attr("appID");
            var currentView = App.currentView;
            dataObj = {}; // payload through the deferred
            dataObj['finishColor'] = shadeColor2($(clickedButton).css("backgroundColor"), 0.5);
            dataObj['laddaBtn'] = Ladda.create(clickedButton);
            dataObj['laddaBtn'].start();
            dataObj['laddaBtn'].setProgress(0.0);
            dataObj['visibleSel'] = clickedButton;
            dataObj['appGuid'] = appGuid;
            dataObj['appID'] = appID;

            $.when(currentView.getBuildOptions(dataObj))
                .then(currentView.showFadeLayer)
                .then(currentView.getLoginID)
                .then(currentView.requestAppBuild)
                .then(currentView.readCacheKey)
                .then(currentView.getShortenedOTA)
                .then(currentView.hideFadeLayer)
                .then(currentView.buttonShowFinished)
                .then(currentView.presentBuiltApp)
                .always(function() {
                    var button = $(dataObj['visibleSel']);
                    button.css("z-index", 20);
                    dataObj['laddaBtn'].stop();
                })
                .done(function() {
                    var button = $(dataObj['visibleSel']);
                    button.css("background-color", dataObj['finishColor']);
                    button.find("span").text("COMPLETE");
                    button.attr("disabled", true);
                    button.attr("action", "");
                    button.unbind("click");
                })
                .fail(currentView.handleError)
                .progress(function(dataObj) {
                    dataObj['laddaBtn'].setProgress(parseFloat(dataObj['opPercent']));
                })
        },

        pullApp: function(e) {
            var clickedButton = e.currentTarget;
            var appGuid = $(clickedButton).attr("app");
            var currentView = App.currentView;
            dataObj = {}; // payload through the deferred
            dataObj['finishColor'] = shadeColor2($(clickedButton).css("backgroundColor"), 0.5);
            dataObj['laddaBtn'] = Ladda.create(clickedButton);
            dataObj['laddaBtn'].start();
            dataObj['laddaBtn'].setProgress(0.1);
            dataObj['visibleSel'] = clickedButton;
            dataObj['appGuid'] = appGuid;

            $.when(currentView.showFadeLayer(dataObj))
                .then(currentView.getLoginID)
                .then(currentView.requestAppPull)
                .then(currentView.readCacheKey)
                .then(currentView.hideFadeLayer)
                .then(currentView.buttonShowFinished)
                .always(function() {
                    var button = $(dataObj['visibleSel']);
                    button.css("z-index", 20);
                    dataObj['laddaBtn'].stop();
                })
                .done(function() {
                    button.css("background-color", dataObj['finishColor']);
                    button.find("span").text("COMPLETE");
                    button.attr("disabled", true);
                    button.attr("action", "");
                    button.unbind("click");
                })
                .fail(currentView.handleError)
                .progress(function(dataObj) {
                    dataObj['laddaBtn'].setProgress(parseFloat(dataObj['opPercent']));
                })
        },

        deployApp: function(e) {
            var clickedButton = e.currentTarget;
            var appGuid = $(clickedButton).attr("app");
            var appID = $(clickedButton).attr("appID");
            var currentView = App.currentView;
            dataObj = {}; // payload through the deferred
            dataObj['laddaBtn'] = Ladda.create(clickedButton);
            dataObj['laddaBtn'].start();
            dataObj['laddaBtn'].setProgress(0.0);
            dataObj['visibleSel'] = clickedButton;
            dataObj['appGuid'] = appGuid;
            dataObj['appID'] = appID;

            $.when(currentView.getDeployOptions(dataObj))
                .then(currentView.showFadeLayer)
                .then(currentView.getLoginID)
                .then(currentView.requestAppDeploy)
                .then(currentView.readCacheKey)
                .then(currentView.waitForAppState)
                .then(currentView.hideFadeLayer)
                .then(currentView.buttonShowFinished)
                .always(function() {
                    var button = $(dataObj['visibleSel']);
                    button.css("z-index", 20);
                    dataObj['laddaBtn'].stop();
                })
                .fail(currentView.handleError)
                .progress(function(dataObj) {
                    dataObj['laddaBtn'].setProgress(parseFloat(dataObj['opPercent']));
                })
        },

        /*##################################
        ## CORE OPERATIONS
        #################################### */

        getLoginID: function(dataObj) {
            console.info("Getting Login ID:", dataObj);
            var deferred = $.Deferred();
            var stateName = "get_login";
            var notification = "Getting Login Session";
            var startPercentage = "0%";
            var endPercentage = "10%";
            deferred.notify($.extend({
                "opStatus": 0,
                "textStatus": notification,
                "stateName": stateName,
                "opPercent": startPercentage
            }, dataObj));

            dataObj['domain'] = App.globalUserData.userInfo.get("domain").split(".")[0];
            var sessionID = App.globalUserData.userInfo.get("IDKEY");
            utils.syncDelay(function() {
                if (sessionID) {
                    dataObj.sessionID = sessionID;
                    deferred.notify($.extend({
                        "opStatus": 1,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    }, dataObj));
                    deferred.resolve(dataObj);
                } else {
                    deferred.notify($.extend({
                        "opStatus": 2,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    }, dataObj));
                    deferred.reject({
                        "errorMsg": "Invalid Login, please login again."
                    })
                }
            });
            return deferred.promise();
        },

        requestApps: function(dataObj) {
            var deferred = $.Deferred();
            var stateName = "state_Apps";
            var notification = "Requesting Apps";
            var path = "cloud/app_requestApps";
            var data = {
                "domain": dataObj['domain'],
                "sessionID": dataObj['sessionID'],
                "csrftoken": App.globalUserData.userInfo.get("csrftoken")
            };
            // Make the call. The response will exist in the dataObj under 'stateName'
            deferred = utils.deferredCloudCall(dataObj, deferred, stateName, notification, path, data, "30%", "50%");
            return deferred.promise();
        },

        populateAppList: function(dataObj) {
            var model = App.currentView.model;
            model.setAppData(dataObj['state_Apps']);
            var deferred = $.Deferred();

            appListHTML = model.generateAppList();
            // Set the sidebar html
            App.SideBarView.sideBarData.set({
                "left": appListHTML
            });
            App.SideBar.open("left");
            App.SideBar.on("animated", function() {
                App.SideBar.off("animated");
                deferred.resolve(dataObj);
            });
            return deferred.promise();
        },

        populateAppData: function(dataObj) {
            var deferred = $.Deferred();
            var model = App.currentView.model;
            var guid = dataObj['guid'];
            var currentView = App.currentView;

            appHtmlObj = model.generateAppPage(guid);
            $('#appBody').find("div[name='appSummary']").html(appHtmlObj['summary']);
            $('#appBody').find("div[name='appHeader']").html(appHtmlObj['header']);
            App.SideBarView.sideBarData.updateSettings({
                "disable": "none"
            });

            // Close the sidebar
            App.SideBar.close();
            App.SideBar.on("animated", function() {
                App.SideBar.off("animated");
                // Set the sidebar html stuff and bind control to it
                App.SideBarView.sideBarData.set({
                    "right": appHtmlObj['actions']
                });
                // because we are changing the HTML for the sidebar (all of it gets replaced), we have to rebind the click action
                $('.appListSelectable').unbind("click").click(currentView.startLoadAppFlow);
                // bind some functionality to them there buttons
                $('#appActions').find("button[action='build']").click(currentView.buildApp);
                $('#appActions').find("button[action='pull']").click(currentView.pullApp);
                $('#appActions').find("button[action='deploy']").click(currentView.deployApp);
                deferred.resolve(dataObj);
            });
            return deferred.promise();
        },

        handleError: function(errorObj) {
            var currentView = App.currentView;

            // Most of this code is replicating code in the COSMETICS toggle Functions.
            // But referencing internal functions is a pain in the nipples.
            $('#alert').html(errorObj['errorMsg']);
            $('#alert').toggleClass("in");
            Ladda.stopAll();
            setTimeout(function() {
                $('#alert').toggleClass("in");
                $('#processing-modal').modal('hide');
                $('#graphBody').collapse('hide');
            }, 3500);
            currentView.hideFadeLayer({});
            $("#processStartBtn").removeAttr("disabled").text("Process App Data");
        },

        getClickedApp: function(dataObj) {
            var deferred = $.Deferred();
            var clickedLink = dataObj['clicked']
            console.info("Starting app load flow")
            if ($(clickedLink).parent().hasClass('firingSlide') == false) {
                $(clickedLink).addClass("appListSlideIn");
                $(clickedLink).parent().addClass("firingSlide");
                var appGuid = $(clickedLink).attr("appGuid");
                dataObj['guid'] = appGuid;

                // Hide the appBody
                $('#appBody').collapse("hide");
                $('#appBody').on('hidden.bs.collapse', function() {
                    deferred.resolve(dataObj);
                    $('#appBody').off('hidden.bs.collapse');
                })
            };
            return deferred.promise();
        },

        showAppData: function(dataObj) {
            var deferred = $.Deferred();
            var clickedLink = dataObj['clicked']
            $(clickedLink).parent().removeClass("firingSlide");

            $('#appBody').collapse("show");
            $('#appBody').on('shown.bs.collapse', function() {
                $('#appBody').off('shown.bs.collapse');
                $(clickedLink).removeClass("appListSlideIn");
                deferred.resolve(dataObj);
            });
            return deferred.promise();
        },

        requestAppPull: function(dataObj) {
            var deferred = $.Deferred();
            dataObj['laddaBtn'].setProgress(0.2);
            var stateName = "state_AppPull";
            dataObj['requestState'] = stateName;

            var notification = "Performing Git Pull";
            var path = "cloud/app_gitPull";
            var data = {
                "domain": dataObj['domain'],
                "sessionID": dataObj['sessionID'],
                "appGuid": dataObj['appGuid'],
                "csrftoken": App.globalUserData.userInfo.get("csrftoken")
            };
            deferred = utils.deferredCloudCall(dataObj, deferred, stateName, notification, path, data, "0.2", "0.3");
            return deferred.promise();
        },

        requestAppBuild: function(dataObj) {
            var deferred = $.Deferred();
            dataObj['laddaBtn'].setProgress(0.2);
            var stateName = "state_AppBuild";
            dataObj['requestState'] = stateName;

            var notification = "Performing App Build";
            var path = "cloud/app_build";
            var data = {
                "domain": dataObj['domain'],
                "appGuid": dataObj['appGuid'],
                "appID": dataObj['appID'],
                "buildParams": dataObj['buildParams'],
                "sessionID": dataObj['sessionID'],
                "csrftoken": App.globalUserData.userInfo.get("csrftoken")
            };
            deferred = utils.deferredCloudCall(dataObj, deferred, stateName, notification, path, data, "0.25", "0.4");
            return deferred.promise();
        },

        requestAppDeploy: function(dataObj) {
            var deferred = $.Deferred();
            dataObj['laddaBtn'].setProgress(0.2);
            var stateName = "state_AppDeploy";
            dataObj['requestState'] = stateName;

            var notification = "Performing Deploy";
            if (dataObj['deployParams']['action'] == "stage") {
                var path = "cloud/app_stage";
            } else {
                var path = "cloud/app_deploy";
            }
            var data = {
                "domain": dataObj['domain'],
                "sessionID": dataObj['sessionID'],
                "deployParams": dataObj['deployParams'],
                "appGuid": dataObj['appGuid'],
                "csrftoken": App.globalUserData.userInfo.get("csrftoken")
            };
            deferred = utils.deferredCloudCall(dataObj, deferred, stateName, notification, path, data, "0.2", "0.3");
            return deferred.promise();
        },

        waitForAppState: function(dataObj) {
            // monitor cacheKey progress
            var deferred = $.Deferred();
            dataObj['laddaBtn'].setProgress(0.6);
            var stateName = "state_appPing";
            var parentCacheRequestID = dataObj.requestState;
            var notification = "Performing App Ping";
            var data = {
                "sessionID": dataObj['sessionID'],
                "deployParams": dataObj['deployParams']
            };

            // get the expected run state from the response of deploy
            if (dataObj[parentCacheRequestID]['expectedRunState']) {
                data["expectedState"] = dataObj[parentCacheRequestID]['expectedRunState'];
            } else {
                data["expectedState"] = "STOPPED";
            };

            // If the action performed was a stage, then it should be running.
            if (dataObj['deployParams']['action'] == "stage") {
                data["expectedState"] = "RUNNING";
            };

            dataObj['opPercent'] = 0.6;
            var stateQueryLoopID = setInterval(function() {
                try {
                    appPingCheck(dataObj, data, function(dataObj) {
                        try {
                            if (dataObj['appState'] != data['expectedState']) {
                                dataObj['opPercent'] = parseFloat(dataObj['opPercent']) + 0.01; // no useful status info
                                deferred.notify(dataObj);
                            } else {
                                clearInterval(stateQueryLoopID);
                                deferred.resolve(dataObj);
                            }
                        } catch (err) {
                            clearInterval(stateQueryLoopID);
                            throw (err);
                        }
                    });
                } catch (err) {
                    clearInterval(stateQueryLoopID);
                    throw ({
                        "errorMsg": err
                    });
                }
            }, 2000);

            return deferred.promise();
        },

        showBuildOptions: function(dataObj) {
            var deferred = $.Deferred();
            dataObj['laddaBtn'].setProgress(0.2);

            return deferred.promise();
        },

        presentBuiltApp: function(dataObj) {
            var deferred = $.Deferred();
            var model = App.currentView.model;
            var installData = {
                "links": dataObj['cacheStatus'],
                "shortened": dataObj['state_getShortay']
            }
            appInstallHtmlObj = model.generateInstallModal(installData);
            $('#installDataBody').html(appInstallHtmlObj['html']);
            $('#installDataBody').collapse("show");
            $('#installDataBody').on('shown.bs.collapse', function() {
                deferred.resolve(dataObj);
            });
            return deferred.promise();
        },

        readCacheKey: function(dataObj) {
            // monitor cacheKey progress
            var deferred = $.Deferred();
            dataObj['laddaBtn'].setProgress(0.4);
            var stateName = "state_cacheRead";
            var parentCacheRequestID = dataObj.requestState;

            var data = {
                "sessionID": dataObj['sessionID'],
                "cacheKey": dataObj[parentCacheRequestID]['cacheKey']
            };

            dataObj['opPercent'] = 0.4;
            if (data.cacheKey) { // Only wait for the cacheStatus to clear if a cacheKey was present in the last act call response.
                var cacheQueryLoopID = setInterval(function() {
                    cacheKeyCheck(dataObj, data, function(dataObj) {
                        if (dataObj['cacheStatus']['status'] == "error") {
                            clearInterval(cacheQueryLoopID);
                            console.log(dataObj['cacheStatus']);
                            deferred.reject({
                                "errorMsg": dataObj['cacheStatus']['error']
                            });
                        }
                        if (dataObj['cacheStatus']['status'] == "complete") {
                            clearInterval(cacheQueryLoopID);
                            deferred.resolve(dataObj);
                        } else {
                            dataObj['opPercent'] = parseFloat(dataObj['opPercent']) + 0.01; // no useful status info
                            deferred.notify(dataObj);
                        }
                    });
                }, 2000);
            } else {
                utils.syncDelay(function() {
                    deferred.resolve(dataObj);
                });
            }


            return deferred.promise();
        },

        getShortenedOTA: function(dataObj) {
            var deferred = $.Deferred();
            var stateName = "state_getShortay";

            if (dataObj['buildParams']['deviceType'] == "iphone") {
                var longUrl = "http://ota.feedhenry.com/ota/ios.html?url=" + dataObj['cacheStatus']['action']['ota_url'];
            } else {
                var longUrl = dataObj['cacheStatus']['action']['ota_url'];
            }

            var notification = "Requesting Shortened OTA URL";
            var path = "cloud/app_shortay";
            var data = {
                "domain": dataObj['domain'],
                "sessionID": dataObj['sessionID'],
                "csrftoken": App.globalUserData.userInfo.get("csrftoken"),
                "longUrl": longUrl
            };
            deferred = utils.deferredCloudCall(dataObj, deferred, stateName, notification, path, data, "0.95", "0.99");
            return deferred.promise();
        },

        startAppPingLoop: function(dataObj) {
            var environments = ["dev", "live"];
            var deferred = $.Deferred();


            if (window.appPingLoopID) {
                clearInterval(window.appPingLoopID);
            };

            window.appPingLoopID = setInterval(function() {
                try {
                    environments.forEach(function(env) {
                        appPingCheck(dataObj, {
                            "sessionID": dataObj['sessionID'],
                            "deployParams": {
                                'target': env,
                                "guid": $('button[action="deploy"]').attr("appID")
                            }
                        }, function(dataObj) {});
                    });
                } catch (err) {
                    clearInterval(window.appPingLoopID);
                    throw ({
                        "errorMsg": err
                    });
                }
            }, 3000);

            return deferred.promise();
        },

        ////////////////////////////////////
        // COSMETICS
        ////////////////////////////////////

        getBuildOptions: function(dataObj) {
            var deferred = $.Deferred();
            $('#build_options-modal').modal('show');
            $('#build_options-modal').find("button[name='btn_continue']").unbind("click").click(function() {
                $('#build_options-modal').modal('hide');
                dataObj['laddaBtn'].setProgress(0.1);
                dataObj['buildParams'] = {
                    "generateSrc": false,
                    "deviceType": $('div[name="platform_selection"]').find("label.active input").attr("param-value"),
                    "privateKeyPass": $('input[build-param="privateKeyPass"]').val(),
                    "certPass": $('input[build-param="certPass"]').val()
                };
                if (dataObj['buildParams']['deviceType'] == "iphone") {
                    dataObj['buildParams']['config'] = "distribution";
                    dataObj['buildParams']['version'] = "7.0";
                } else {
                    dataObj['buildParams']['config'] = "debug";
                    dataObj['buildParams']['version'] = "4.0";
                }

                deferred.resolve(dataObj);
            });
            $('#build_options-modal').find("button[name='btn_fail']").unbind("click").click(function() {
                $('#build_options-modal').modal('hide');
                dataObj['errorMsg'] = "User Abandoned";
                $('#build_options-modal').on('hidden.bs.modal', function() {
                    deferred.reject(dataObj);
                });
            });
            return deferred.promise();
        },

        getDeployOptions: function(dataObj) {
            var deferred = $.Deferred();
            $('#deploy_options-modal').modal('show');
            $('#deploy_options-modal').find("button[name='btn_continue']").unbind("click").click(function() {
                $('#deploy_options-modal').modal('hide');
                dataObj['laddaBtn'].setProgress(0.1);
                dataObj['deployParams'] = {
                    "guid": dataObj['appID'],
                    "target": $('div[name="deploy_env_select"]').find("label.active input").attr("param-value"),
                    "action": $('div[name="deploy_action_select"]').find("label.active input").attr("param-value")
                };
                deferred.resolve(dataObj);
            });
            $('#deploy_options-modal').find("button[name='btn_fail']").unbind("click").click(function() {
                $('#deploy_options-modal').modal('hide');
                dataObj['errorMsg'] = "User Abandoned";
                $('#deploy_options-modal').on('hidden.bs.modal', function() {
                    deferred.reject(dataObj);
                });
            });
            return deferred.promise();
        },

        showFadeLayer: function(dataObj) {
            var deferred = $.Deferred();
            var visibleSel = dataObj['visibleSel']
            var backDropSel = '.main-backdrop';
            var drawBackDropSel = '.drawer-backdrop';
            $('body').append('<div class="main-backdrop modal-backdrop"></div>');
            $('.snap-drawer').append('<div id="temp_backdrop" class="drawer-backdrop modal-backdrop"></div>');
            $(backDropSel).css("opacity", 0.5);
            $(drawBackDropSel).css("opacity", 0.5);
            // Sort out z-index shenanigans
            $('.snap-drawer').css("z-index", 2000);
            $(visibleSel).css("z-index", 2050);
            // Fade it in
            $(backDropSel).fadeIn(400);
            $(drawBackDropSel).fadeIn(400, function() {
                deferred.resolve(dataObj);
            })
            return deferred.promise();
        },

        hideFadeLayer: function(dataObj) {
            var deferred = $.Deferred();
            var backDropSel = '.main-backdrop';
            var drawBackDropSel = '.drawer-backdrop';

            if ($(backDropSel).length) {
                $(drawBackDropSel).fadeOut(400);
                // Fade it out
                $(backDropSel).fadeOut(400, function() {
                    // Sort out z-index shenanigans
                    $(drawBackDropSel).parent().css("z-index", 0);
                    $('.snap-drawer').css("z-index", 0);
                    $(backDropSel).remove();
                    $(drawBackDropSel).remove();
                    deferred.resolve(dataObj);
                });
            } else {
                utils.syncDelay(function() {
                    deferred.resolve(dataObj);
                });
            }
            return deferred.promise();
        },

        toggleIntro: function(dataObj) {
            var deferred = $.Deferred();
            console.info("Toggling intro stuff")
            if ($('#pageFooter').hasClass('in')) {
                $("#processStartBtn").removeAttr("disabled").text("Process App Data");
                $('#pageFooter').collapse('hide');
                $('#pageFooter').on('hidden.bs.collapse', function() {
                    $('#introBody').collapse('show');
                    $('#introBody').on('shown.bs.collapse', function() {
                        deferred.resolve(dataObj);
                    });
                });
            } else {
                $("#processStartBtn").attr("disabled", "disabled").text("Processing..");
                $('#introBody').collapse('hide');
                $('#introBody').on('hidden.bs.collapse', function() {
                    $('#pageFooter').collapse('show');
                    $('#pageFooter').on('shown.bs.collapse', function() {
                        deferred.resolve(dataObj);
                    });
                });
            }
            return deferred.promise();
        },

        toggleProgressModalShown: function(dataObj) {
            console.info("Toggling modal")
            var deferred = $.Deferred();
            if ($('#processing-modal').hasClass('in')) {
                $('#processing-modal').modal('hide');
                $('#processing-modal').on('hidden.bs.modal', function() {
                    deferred.resolve(dataObj);
                });
            } else {
                $('#processing-modal').modal('show');
                $('#processing-modal').on('shown.bs.modal', function() {
                    deferred.resolve(dataObj);
                });
            }
            return deferred.promise();
        },

        transitionProgress: function(notifyObj) {
            console.info("Received Update", notifyObj)
            var textSlideId = "progressBlockText_" + notifyObj['stateName'];
            var operationState = notifyObj['opStatus'];

            var operationPercent = notifyObj['opPercent'];
            var progressBar = $('#process_progress').find(".progress-bar")[0];

            if (operationState == 0) { // starting
                var textSlideStatus = '<div id="' + textSlideId + '" class="slidein_prepare"><span name="progressBlockText" class="label label-default">' + notifyObj['textStatus'] + '</span></div>';
                $('#progressBlockStatus').append(textSlideStatus).show(); // Append status HTML code. show() enforces the dom to update to help the transition
                $('#' + textSlideId).addClass("slidein_active");
            } else if (operationState == 1) { // complete 
                $('#' + textSlideId).find("span[name='progressBlockText']").toggleClass("label-default label-success");
                $('#' + textSlideId).addClass("slidein_finished");
                if (operationPercent && operationPercent == "100%") {
                    $(progressBar).removeClass("progress-bar-info").addClass("progress-bar-success");
                    $(progressBar).parent().removeClass("progress-striped");
                }
            } else if (operationState == 2) { // failure
                $('#' + textSlideId).find("span[name='progressBlockText']").toggleClass("label-default label-danger");
                $(progressBar).parent().removeClass("progress-striped");
                $(progressBar).addClass("progress-bar-danger");
            }

            if (operationPercent) {
                $(progressBar).css("width", operationPercent);
            }
        },

        /*##################################
        ## BACKBONE FUNCTIONALITY
        #################################### */
        initialize: function(options) {
            this.render = _.bind(this.render, this);
        },

        render: function() {
            _.templateSettings.variable = "data";
            console.info("Rendering App")
            var compiledTemplate = _.template(AppTemplate, {});
            $(this.el).html(compiledTemplate);
            $(this.el).hide();

            // Modify the model of the sidebar now to trigger a render of new data            
            App.SideBarView.sideBarData.resetSettings();
            App.SideBarView.sideBarData.updateSettings({
                "disable": "right"
            });

            var leftSideContent = $($(compiledTemplate).find("#sideBar_leftContent")[0]).html();
            App.SideBarView.sideBarData.set({
                "left": leftSideContent
            });

            $('#processing-modal').modal({
                "show": true,
                "backdrop": false
            });

            // manage orientation updates to the scrollable list!
            return this;
        },

        close: function(closedCallback) {
            $(this.el).fadeOut(300, function() {
                this.remove();
            });
            closedCallback();
        },

        onShow: function() {
            $(this.el).fadeIn();
        },

    });

    /*##################################
    ## UTIL
    #################################### */
    var cacheKeyCheck = function(dataObj, data, callback) {
        // Send a notification for updating the status
        console.info("Performing CacheKey check", data);
        // Perform the operation
        $fh.cloud({
                path: "cloud/app_readCacheKey",
                data: data
            },
            function(res) {
                if (!res.error) {
                    console.info("CacheKey call succeeded with response:", res);
                    dataObj['cacheStatus'] = res[0];
                    callback(dataObj);
                } else {
                    throw res.error;
                }
            },
            function(errType, res) {
                throw res.error;
            }
        );
    }

    var appPingCheck = function(dataObj, data, callback) {
        // Send a notification for updating the status
        console.info("Performing App Ping", data);
        // Perform the operation
        $fh.cloud({
                path: "cloud/app_ping",
                data: data
            },
            function(res) {
                if (!res.error) {
                    dataObj['appState'] = "RUNNING";
                    $('span[app_status_indicator="' + data['deployParams']['target'] + '"]').removeClass("label-danger").addClass("label-success");
                    callback(dataObj);
                } else {
                    dataObj['appState'] = "STOPPED";
                    $('span[app_status_indicator="' + data['deployParams']['target'] + '"]').removeClass("label-success").addClass("label-danger");
                    callback(dataObj);
                }
            },
            function(errType, res) {
                throw res.error;
            }
        );
    }

    // this function is used to dynamically find a brighter shade of a colour
    var shadeColor2 = function(rgb, percent) {
        rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);

        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        color = "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);

        var f = parseInt(color.slice(1), 16),
            t = percent < 0 ? 0 : 255,
            p = percent < 0 ? percent * -1 : percent,
            R = f >> 16,
            G = f >> 8 & 0x00FF,
            B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    }

    return AppView;

});