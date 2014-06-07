define([
    'underscore',
    'backbone'
], function(_, Backbone) {
    var AppModel = Backbone.Model.extend({
        defaults: {
            "list": [],
            "status": "ok"
        },

        setAppData: function(appRequestData) {
            this.set(appRequestData);
        },

        generateAppPage: function(guid) {
            var appData = null;
            var appList = this.get("list")
            for (var appIndex in appList) {
                if (appData)
                    continue;
                if (appList[appIndex]['app'] == guid) {
                    appData = appList[appIndex];
                }
            }

            console.info("Generating data from", appData);
            // now generate some beautiful html
            var appHeader = [];
            var appSummary = [];
            var appActions = [];

            // https://nguiapps.feedhenry.com/box/srv/1.1/wid/nguiapps/sandbox/lr6HH1EJ6pMmU14EX8SDvcpR/icon/large?t=1391353479594
            appHeader.push('<div class="row">')
            appHeader.push('<div class="col-sm-3 text-center"><img style="margin:10px" class="img-circle" src="https://' + App.globalUserData.userInfo.get('root') + '/box/srv/1.1/wid/nguiapps/sandbox/' + appData['id'] + '/icon/large' + '" alt="App Thumbnail"></div>')
            appHeader.push('<div class="col-sm-9"><h3>' + appData['title'] + '</h3><small>' + appData['description'] + '</small></div>')
            appHeader.push('</div>')

            appSummary.push('<div class="row-fluid">');
            appSummary.push('	<table class="table table-condensed table-bordered"><tbody>');
            appSummary.push('		<tr><td><strong>Owner</strong></td><td>' + appData['email'] + '</td></tr>');
            appSummary.push('		<tr><td><strong>GUID</strong></td><td>' + appData['app'] + '</td></tr>');
            appSummary.push('		<tr><td><strong>Modified</strong></td><td>' + appData['modified'] + '</td></tr>');
            appSummary.push('		<tr><td><strong>Version</strong></td><td>' + appData['version'] + '</td></tr>');
            appSummary.push('	</tbody></table>');
            appSummary.push('</div>');



            appActions.push("<ul class='list-unstyled' id='appActions'>")
            appActions.push('   <li>');
            appActions.push('       <button class="btn-block ladda-button" data-style="slide-left" data-color="green" action="build" app="' + appData['app'] + '" appID="' + appData['id'] + '">');
            appActions.push('           <i class="glyphicon glyphicon-cog pull-left" style="margin-left:10px"></i>');
            appActions.push('           <span class="ladda-label">Build</span>');
            appActions.push('       </button>');
            appActions.push('   <div id="installDataBody" class="collapse well">');
            appActions.push('   </div>');
            appActions.push('   </li><hr/>')
            appActions.push('   <li>')
            appActions.push('       <button class="btn-block ladda-button" data-style="slide-left" data-color="mint" action="pull" app="' + appData['app'] + '" appID="' + appData['id'] + '">');
            appActions.push('           <i class="glyphicon glyphicon-user pull-left" style="margin-left:10px"></i>');
            appActions.push('           <span class="ladda-label">Git Pull</span>');
            appActions.push('       </button>')
            appActions.push('   </li><hr/>')
            appActions.push('   <li>')
            appActions.push('       <button class="btn-block ladda-button" data-style="slide-left" data-color="blue" action="deploy" app="' + appData['app'] + '" appID="' + appData['id'] + '">');
            appActions.push('           <i class="glyphicon glyphicon-cloud-upload pull-left" style="margin-left:10px"></i>');
            appActions.push('           <span class="ladda-label">Deploy</span>');
            appActions.push('       </button>')
            appActions.push('       <span class="label label-block label-default" app_status_indicator="dev">DEV</span> <span class="label label-block label-default" app_status_indicator="live">LIVE</span>')
            appActions.push('   </li><hr/>')
            appActions.push("</ul>")
            return {
                "header": appHeader.join(""),
                "summary": appSummary.join(""),
                "actions": appActions.join("")
            }
        },

        generateAppList: function() {
            var appList = this.get("list");
            // now generate some html
            appListHTML = ['<div class="centered"><h3><span class="label label-success">Select an App</span></h3></div>'];
            appListHTML.push("<div id='sideBarAppList' class='list-group'>");
            for (var appIndex in appList) {
                var app = appList[appIndex];
                appListHTML.push('<a class="list-group-item appListSelectable" appGuid="' + app['app'] + '">');
                appListHTML.push('	<img class="img-circle img-responsive" style="float:left" src="https://' + App.globalUserData.userInfo.get('root') + app['icon'] + '">');
                appListHTML.push('	<h5 class="list-group-item-heading" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-left: 5px;">' + app['title'] + '</h5>');
                appListHTML.push('</a>');
            };
            appListHTML.push("</div>");
            return appListHTML.join("");
        },

        generateInstallModal: function(installData) {
            console.info("Viewing InstallData:", installData);
            var ua = navigator.userAgent.toLowerCase();
            var isAndroid = ua.indexOf("android") > -1;
            var appInstallHTML = [];

            if (isAndroid) {
                var downloadLinkHTML = 'navigator.app.loadUrl(\'<TARGET_URL>\', {openExternal : true});';
            } else {
                var downloadLinkHTML = 'window.open(\'<TARGET_URL>\', \'_system\');';
            }
            if (installData['links']['action']['url']) {
                appInstallHTML.push('<a onclick="' + downloadLinkHTML.replace("<TARGET_URL>", installData['links']['action']['url']) + '" class="btn btn-info btn-block"</a>');
                appInstallHTML.push('   <span class="glyphicon glyphicon-download"></span> Download ZIP');
                appInstallHTML.push('</a>');
            }
            if (installData['links']['action']['ipa_url']) {
                appInstallHTML.push('<a onclick="' + downloadLinkHTML.replace("<TARGET_URL>", installData['links']['action']['ipa_url']) + '" class="btn btn-info btn-block"</a>');
                appInstallHTML.push('   <span class="glyphicon glyphicon-download"></span> Download IPA');
                appInstallHTML.push('</a>');
            }
            appInstallHTML.push('<hr/><p class="text-center"><strong><a onclick="' + downloadLinkHTML.replace("<TARGET_URL>", installData['shortened']['url']) + '" </a>');
            appInstallHTML.push(installData['shortened']['url']);
            appInstallHTML.push('</a></strong></p>');
            appInstallHTML.push('<img src="' + installData['shortened']['url'] + '.qrcode" class="img-thumbnail">');


            return {
                "html": appInstallHTML.join("")
            }
        }

    });
    return AppModel;
});