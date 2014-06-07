define([
    'underscore',
    'backbone',
    'snapjs',
    'sprintf',
    'highcharts',
    'controller_path/HighChartCreation',
    'util_path/appUtils',
    'model_path/UserModel',
    'text!template_path/UserTemplate.html'
], function(_, Backbone, Snap, sprintf, highcharts, hcHelper, utils, UserModel, UserTemplate) {
    var UserView = Backbone.View.extend({
        self: this,
        model: new UserModel(),

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
            $.when(this.toggleIntroOrGraph({}))
                .then(this.toggleProgressModalShown)
                .then(this.getLoginID)
                .then(this.requestUsers)
                .then(this.createUserSegregation)
                .then(this.toggleProgressModalShown)
                .done(this.graphThat)
                .done(this.createSidePanelData)
                .fail(this.handleError) // rejects will cascade to final then to find an error function.
            .progress(this.transitionProgress) // handles updates that cascade via .notify()
        },

        /*##################################
        ## BACKBONE FUNCTIONALITY
        #################################### */
        initialize: function(options) {
            this.render = _.bind(this.render, this);
        },

        render: function() {
            _.templateSettings.variable = "data";
            console.info("Rendering User")
            var compiledTemplate = _.template(UserTemplate, {});
            $(this.el).html(compiledTemplate);
            $(this.el).hide();

            // Modify the model of the sidebar now to trigger a render of new data            
            App.SideBarView.sideBarData.resetSettings();
            App.SideBarView.sideBarData.updateSettings({
                "disable": "left"
            });

            var rightSideContent = $($(compiledTemplate).find("#sideBar_rightContent")[0]).html();
            App.SideBarView.sideBarData.set({
                "right": rightSideContent
            });

            $('#processing-modal').modal({
                "show": true,
                "backdrop": false
            });
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

        /*##################################
        ## CORE OPERATIONS
        #################################### */

        getLoginID: function(dataObj) {
            var deferred = $.Deferred();
            var stateName = "get_login";
            var notification = "Getting Login Session";
            var startPercentage = "0%";
            var endPercentage = "20%";
            deferred.notify({
                "opStatus": 0,
                "textStatus": notification,
                "stateName": stateName,
                "opPercent": startPercentage
            });

            var sessionID = App.globalUserData.userInfo.get("IDKEY");
            utils.syncDelay(function() {
                if (sessionID) {
                    dataObj.sessionID = sessionID;
                    deferred.notify({
                        "opStatus": 1,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    });
                    deferred.resolve(dataObj);
                } else {
                    deferred.notify({
                        "opStatus": 2,
                        "stateName": stateName,
                        "opPercent": endPercentage
                    });
                    deferred.reject({
                        "errorMsg": "Invalid Login, please login again."
                    })
                }
            });
            return deferred.promise();
        },

        requestUsers: function(dataObj) {
            var stateName = "state_users";
            var notification = "Requesting Users";
            var path = "cloud/user_requestUsers";
            var data = {
                "domain": dataObj['domain'],
                "sessionID": dataObj['sessionID']
            };
            // Make the call
            var deferred = $.Deferred();
            deferred = utils.deferredCloudCall(dataObj, deferred, stateName, notification, path, data, "30%", "50%");
            return deferred.promise();
        },

        createUserSegregation: function(dataObj) {
            var deferred = $.Deferred();
            var stateName = "segregate";
            var notification = "Separating Users";
            var startPercentage = "60%";
            var endPercentage = "100%";
            deferred.notify({
                "opStatus": 0,
                "textStatus": notification,
                "stateName": stateName,
                "opPercent": startPercentage
            });

            // Separate the users by email domain
            var segregatedUsers = {};
            // 'state_users' was the key used in the requestUsers function. The response is stored in the 
            // data object using this key so other data can be persisted easily.
            var userList = dataObj['state_users'].list;
            for (var userIndex in userList) {
                var user = userList[userIndex];
                var userEmail = user.fields.email;
                var userEmailDomain = userEmail.split("@")[1];
                if (userEmailDomain in segregatedUsers) {
                    segregatedUsers[userEmailDomain].push(userEmail);
                } else {
                    segregatedUsers[userEmailDomain] = [userEmail];
                }
            };

            // Create highchart data using the separated emails
            var pieChartData = {
                "type": "pie",
                "name": "Users",
                "data": []
            };
            for (var userIndex in segregatedUsers) {
                var pieSlice = [userIndex, segregatedUsers[userIndex].length];
                pieChartData['data'].push(pieSlice);
            }

            var highChartDataObj = {
                "title": false,
                "data": [pieChartData]
            };
            dataObj['graphBody'] = highChartDataObj
            // as this is a synchronous call, allow a timeout so the promise 
            // is hooked up first.
            utils.syncDelay(function() {
                deferred.notify({
                    "opStatus": 1,
                    "stateName": stateName,
                    "opPercent": endPercentage
                });
                setTimeout(function() {
                    deferred.resolve(dataObj);
                }, 500); // only pausing this for cosmetic reasons
            });
            return deferred.promise();
        },

        graphThat: function(dataObj) {
            var deferred = $.Deferred();
            console.info("Graphing Data:", dataObj.graphBody);
            hcHelper.renderChartFromData(dataObj.graphBody, $('#graphBody'));
            utils.syncDelay(function() {
                deferred.resolve(dataObj);
            });
            return deferred.promise();
        },

        createSidePanelData: function(dataObj) {
            var sidePanelHTML = "";
            var sidePanelDataObj = [];
            var deferred = $.Deferred();
            var sideData = dataObj.graphBody['data'][0]['data']; // bit convoluted, but pulling data out of highchart object
            console.info("Generating Sidebar Data:", sideData);

            // get the legend in the graph for colors used and such
            var chartLegend = window.chart01.get().chart.legend.allItems;
            var userList = dataObj['state_users'].list;
            // create the list of users
            for (var legendItemIndex in chartLegend) {
                var legendItem = chartLegend[legendItemIndex];
                var sideUserLegendList = {
                    "name": legendItem.name,
                    "color": legendItem.color,
                    "users": []
                }
                for (var userIndex in userList) {
                    var user = userList[userIndex];
                    var userEmail = user.fields.email;
                    var userEmailDomain = userEmail.split("@")[1];
                    if (userEmailDomain == legendItem.name) {
                        sideUserLegendList.users.push(userEmail);
                    }
                }
                sidePanelDataObj.push(sideUserLegendList)
            }

            // generate html around the lists
            for (var userListIndex in sidePanelDataObj) {
                var userListData = sidePanelDataObj[userListIndex];
                sidePanelHTML += sprintf(' \
                <div class="row-fluid">  \
                    <div class="panel panel-primary"> \
                        <div class="panel-heading" style="background-color: %s; border-color: %s"> \
                            <h3 class="panel-title">%s</h3> \
                        </div> \
                        <div class="panel-body"> \
                            <div class="row-fluid"> \
                                <ul class="list-unstyled"> \
                ', userListData.color, userListData.color, userListData.name);
                for (var userIndex in userListData.users) {
                    var user = userListData.users[userIndex];
                    sidePanelHTML += sprintf('<li class="text-overflow"><span class="label label-primary">%s</span></li>', user);
                }
                sidePanelHTML += sprintf(' \
                                </ul> \
                            </div> \
                        </div> \
                    </div> \
                </div> \
                ');
            }

            // add a title
            sidePanelHTML = '<div class="text-center"> \
                <h4 class="text-muted"><strong> User Breakdown </strong></h4> \
                <hr> \
            </div>' + sidePanelHTML;

            App.SideBarView.sideBarData.set({
                "right": sidePanelHTML
            });
            setTimeout(function() {
                App.SideBar.open("right");
            }, 500); // only pausing this for cosmetic reasons
            App.SideBar.on('open', function() {
                App.SideBar.off("open");
                deferred.resolve(dataObj);
            });
            return deferred.promise();
        },

        handleError: function(errorObj) {
            // Most of this code is replicating code in the COSMETICS toggle Functions.
            // But referencing internal functions is a pain in the nipples.
            $('#alert').html(errorObj['errorMsg']);
            $('#alert').toggleClass("in");
            setTimeout(function() {
                $('#alert').toggleClass("in");
                $('#processing-modal').modal('hide');
                $('#graphBody').collapse('hide');
            }, 3500);
            $("#processStartBtn").removeAttr("disabled").text("Process User Data");
            $('#graphBody').on('hidden.bs.collapse', function() {
                $('#introBody').collapse('show');
            });
        },

        ////////////////////////////////////
        // COSMETICS
        ////////////////////////////////////
        toggleIntroOrGraph: function(dataObj) {
            console.info("Toggling intro stuff")
            var deferred = $.Deferred();
            if ($('#graphBody').hasClass('in')) {
                $("#processStartBtn").removeAttr("disabled").text("Process User Data");
                $('#graphBody').collapse('hide');
                $('#graphBody').on('hidden.bs.collapse', function() {
                    $('#introBody').collapse('show');
                    $('#introBody').on('shown.bs.collapse', function() {
                        deferred.resolve(dataObj);
                    });
                });
            } else {
                $("#processStartBtn").attr("disabled", "disabled").text("Processing..");
                $('#introBody').collapse('hide');
                $('#introBody').on('hidden.bs.collapse', function() {
                    $('#graphBody').collapse('show');
                    $('#graphBody').on('shown.bs.collapse', function() {
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
        }
    });

    /*##################################
    ## UTIL
    #################################### */

    return UserView;

});