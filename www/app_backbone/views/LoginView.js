define([
    'underscore',
    'jquery',
    'backbone',
    'model_path/LoginModel',
    'text!template_path/LoginTemplate.html'
], function(_, $, Backbone, LoginModel, LoginTemplate) {
    var LoginView = Backbone.View.extend({
        self: this,
        model: new LoginModel(),

        /*##################################
        ## MAIN FUNCTIONALITY ENTRY
        #################################### */
        // Define the events that can be invoked in this view
        events: {
            'submit #fhLoginForm': 'startLoginFlow', // using submit to get simple form validation
            'click #retryLogin': 'resetLoginForm'
        },

        // How the login operation is performed. Step by step. Beautiful.
        // NOTE: There is heavy use of deferred/promises, nice guide below
        // http://danieldemmel.me/blog/2013/03/22/an-introduction-to-jquery-deferred-slash-promise/
        startLoginFlow: function() {
            $.when(this.toggleFormHidden(true))
                .then(this.getCredentials)
                .then(this.validateDomain)
                .then(this.doLogin)
                .then(this.getUserData)
                .then(this.transitToHome)
                .fail(this.handleError) // rejects will cascade to final then to find an error function.
            .progress(this.transitionProgress); // handles updates that cascade via .notify()
            return false;
        },

        // Reset the form for logging in again if there is an error.
        resetLoginForm: function() {
            $.when(this.toggleFormHidden(false))
                .then(function() {
                    $("#loginButtonCollapse").collapse("show");
                    $("#retryButtonCollapse").collapse("hide");
                })
        },

        /*##################################
        ## BACKBONE FUNCTIONALITY
        #################################### */
        initialize: function(options) {
            this.render = _.bind(this.render, this);
            this.model.bind('change', this.render);
        },

        // render the view
        render: function() {
            var compiledTemplate = _.template(LoginTemplate, this.model.attributes);
            $(this.el).html(compiledTemplate);
            $(this.el).hide();
            if (!$("#navbar").find(".navbar").is(":hidden")) {
                $("#navbar").find(".navbar").hide();
            }
            $('body').addClass("gradient_back_1");
            App.SideBar.disable();
            return this;
        },

        // kill it
        close: function(closedCallback) {
            console.log("Closing LoginView")
            $('body').removeClass("gradient_back_1");
            $(this.el).fadeOut(300, function() {
                App.SideBar.enable();
                this.remove();
            });
            this.unbind();
            closedCallback();
        },

        // transition to perform when ready to view
        onShow: function() {
            $(this.el).fadeIn();
            App.SideBar.disable();
        },

        /*##################################
        ## CORE OPERATIONS
        #################################### */
        getCredentials: function() {
            var deferred = $.Deferred();
            var domain = $("#fhLoginForm").find("input[name='domain']").val();
            var username = $("#fhLoginForm").find("input[name='user']").val();
            var password = $("#fhLoginForm").find("input[name='password']").val();

            deferred.resolve({
                "domain": domain,
                "u": username,
                "p": password
            });
            return deferred.promise();
        },

        validateDomain: function(dataObj) {
            var deferred = $.Deferred();
            // Send a notification for updating the status
            deferred.notify({
                opStatus: 0,
                textStatus: "Validating Domain..",
                stateName: "state_domain"
            });
            // Perform the operation
            $fh.act({
                    act: "auth_validateDomain",
                    req: {
                        "domain": dataObj['domain']
                    }
                },
                function(res) {
                    if (!res.error) { // if no error, notify with success (opStatus = 1)
                        deferred.notify({
                            opStatus: 1,
                            stateName: "state_domain"
                        });
                        deferred.resolve(dataObj);
                    } else { // if error, notify with failure (opStatus = 2)
                        deferred.notify({
                            opStatus: 2,
                            stateName: "state_domain"
                        });
                        deferred.reject(res.error);
                    }
                },
                function(errType, res) {
                    deferred.notify({
                        opStatus: 2,
                        stateName: "state_domain"
                    });
                    deferred.reject(res.error);
                }
            );
            return deferred.promise();
        },

        doLogin: function(dataObj) {
            var deferred = $.Deferred();
            deferred.notify({
                opStatus: 0,
                textStatus: "Validating Login..",
                stateName: "state_login"
            });
            $fh.act({
                    act: "auth_doLogin",
                    req: { // I know the dataObj is basically what I should send, but it may have additional parameters in future
                        "u": dataObj['u'],
                        "p": dataObj['p'],
                        "domain": dataObj['domain']
                    }
                },
                function(res) {
                    if (!res.error) {
                        deferred.notify({
                            opStatus: 1,
                            stateName: "state_login"
                        });
                        App.globalUserData.userInfo.set("IDKEY", res.sessionId);
                        App.globalUserData.userInfo.set("root", res.root);
                        App.globalUserData.userInfo.set("csrftoken", res.csrftoken);
                        App.globalUserData.userInfo.set("domain", dataObj.domain);
                        deferred.resolve(dataObj);
                    } else {
                        deferred.notify({
                            opStatus: 2,
                            stateName: "state_login"
                        });
                        deferred.reject(res.error);
                    }
                },
                function(errType, res) {
                    deferred.notify({
                        opStatus: 2,
                        stateName: "state_login"
                    });
                    deferred.reject(res.error);
                }
            );
            return deferred.promise();
        },

        getUserData: function(dataObj) {
            var deferred = $.Deferred();
            deferred.notify({
                opStatus: 0,
                textStatus: "Preparing App..",
                stateName: "state_load"
            });
            $fh.act({
                    act: "auth_getUserData",
                    req: {
                        "sessionID": App.globalUserData.userInfo.get("IDKEY"),
                        "username": dataObj['u'],
                        "domain": dataObj['domain']
                    }
                },
                function(res) {
                    console.log("Response", res);
                    if (!res.error) {
                        deferred.notify({
                            opStatus: 1,
                            stateName: "state_load"
                        });
                        console.log("Setting User Data:", res)
                        App.globalUserData.userInfo.setRoles(res['roleInfo']['list']);
                        App.globalUserData.userInfo.setUserInfo(res['userInfo']['fields']);
                        deferred.resolve(dataObj);
                    } else {
                        failureTransit();
                        deferred.notify({
                            opStatus: 2,
                            stateName: "state_load"
                        });
                        deferred.reject(res.error);
                    }
                },
                function(errType, res) {
                    deferred.notify({
                        opStatus: 2,
                        stateName: "state_load"
                    });
                    deferred.reject(res.error);
                }
            );
            return deferred.promise();
        },

        transitToHome: function(dataObj) {
            setTimeout(function() {
                App.router.navigate("/home", true);
            }, 500);
        },

        handleError: function(errorMsg) {
            $('#alert').html(errorMsg);
            $('#alert').toggleClass("in");
            setTimeout(function() {
                $('#alert').toggleClass("in")
            }, 3500);
            $("#loginButtonCollapse").collapse("hide");
            $("#retryButtonCollapse").collapse("show");
        },

        ////////////////////////////////////
        // COSMETICS
        ////////////////////////////////////
        toggleFormHidden: function(hidden) {
            var deferred = $.Deferred();
            if (hidden) {
                $("#loginButtonCollapse button").attr("disabled", "disabled").text("Signing in..");
                $('#formBlockCollapse').collapse('hide');
                $('#formBlockCollapse').on('hidden.bs.collapse', function() {
                    $('#progressBlockCollapse').collapse('show');
                });
                $('#progressBlockCollapse').on('shown.bs.collapse', function() {
                    deferred.resolve({});
                });
            } else {
                $("#loginButtonCollapse button").removeAttr("disabled").text("Sign in");
                $('#progressBlockCollapse').collapse('hide');
                $('#progressBlockCollapse').on('hidden.bs.collapse', function() {
                    $('#formBlockCollapse').collapse('show');
                });
                $('#formBlockCollapse').on('shown.bs.collapse', function() {
                    deferred.resolve({});
                });
                // fix up some progress notification leftovers
                $('#progressBlockStatus').html("");
                $('#progressBlockCollapse').find("button").each(function() {
                    $(this).attr("class", "btn btn-info btn-circle btn-lg circle-state");
                    $(this).html('<i class="glyphicon glyphicon-time"></i>');
                });
            }
            return deferred.promise();

        },

        transitionProgress: function(notifyObj) {
            console.log("Received Update", notifyObj)
            var textSlideId = "progressBlockText_" + notifyObj['stateName'];
            var circleStateButton = $('#progressBlockCollapse').find("button[name='circle_" + notifyObj['stateName'] + "']");

            var operationState = notifyObj['opStatus'];
            if (operationState == 0) { // starting
                var textSlideStatus = '<div id="' + textSlideId + '" class="slidein_prepare"><span name="progressBlockText" class="label label-default">' + notifyObj['textStatus'] + '</span></div>';
                $('#progressBlockStatus').append(textSlideStatus).show(); // Append status HTML code. show() enforces the dom to update to help the transition
                $('#' + textSlideId).addClass("slidein_active");
                circleStateButton.addClass("circle-state-active");
            } else if (operationState == 1) { // complete 
                $('#' + textSlideId).find("span[name='progressBlockText']").toggleClass("label-default label-success");
                circleStateButton.find("i").toggleClass("glyphicon-time glyphicon-ok");
                circleStateButton.toggleClass("btn-info btn-success");
                $('#' + textSlideId).addClass("slidein_finished");
            } else if (operationState == 2) { // failure
                $('#' + textSlideId).find("span[name='progressBlockText']").toggleClass("label-default label-danger");
                circleStateButton.find("i").toggleClass("glyphicon-time glyphicon-remove");
                circleStateButton.toggleClass("btn-info btn-danger");
            }
        }

    });
    return LoginView;

});