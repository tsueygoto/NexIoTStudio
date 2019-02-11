
var App = App || {};

App.Configure = ( function() {

    var oUserConfigure = {};
    
    function loadConfigure() {
        var dfd = $.Deferred();
        $.getJSON( "api/user/configure" ).done( function( data , status , xhr ) {
            console.log("*************************** api/user/configure");
            console.log(data);
            if( data.hasOwnProperty( "sysconf" ) ) { 
                App.Model.Dashboard.setSysConf( data.sysconf );
            }
            //if( data.hasOwnProperty( "dashboards" ) ) App.Model.Dashboard.unserializeAll( data.dashboards );
            dfd.resolve();
        }).fail( function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
			console.log( "Request api/user/configure Failed: " + err );
            console.log( "Request Failed: " + err );
            dfd.reject("Request Failed: " + err);
        });
        return dfd.promise();
    }

    function loadPackageInfo() {
        var dfd = $.Deferred();
        $.getJSON( "api/user/packageInfo" ).done( function( data , status , xhr ) {
            //App.Model.Dashboard.checkSysConfDebug()&&console.log("*************************** api/user/packageInfo");
            //App.Model.Dashboard.checkSysConfDebug()&&console.log(data);
            App.Model.Package.setData( data );
            dfd.resolve();
        }).fail( function( jqxhr, textStatus, error ){
            var err = textStatus + ", " + error;
            console.log( "Request api/user/packageInfo Failed: " + err );
            App.View.Status.set( "Request Failed: " + err );
            dfd.reject("Request Failed: " + err);
        });
        return dfd.promise();
    }

    function saveConfigure() {
        var configure = {};
        //settings.dashboards = App.Model.Dashboard.serializeAll();
        configure.sysconf = App.Model.Dashboard.getSysConf();
        
        console.log("-------------");
        console.log(JSON.stringify( configure ));
        console.log("-------------");
    
        $.ajax({
            method : "POST",
            url : "api/user/configure",
            data : JSON.stringify( configure ),
            contentType : "text/plain"
        }).done( function( data ) {
            if( data != "ok" ) {
                console.error( "Error saving configure: " + data );
            }
        });
    }
    
    function createCookie(name,value,days)
    {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
        }
        document.cookie = name+"="+value+expires+"; path=/";
    }
    
    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') {
                c = c.substring(1,c.length);    
            }
            if (c.indexOf(nameEQ) == 0) {
                var ret = c.substring(nameEQ.length,c.length);
                // {"password":"admin","dashboardList":[],"role":0};
                return ret;
            }
        }
        return null;
    }
    
    function eraseCookie(name) {
        createCookie(name,"",-1);
    }
    
    function getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) { return null; }
        if (!results[2]) { return ''; }
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    
    function genRandomID( len ) {
        len = len || 16;
        var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var id = "";
        for( var i = 0; i < len; i++ ) {
            id += chars[ Math.floor( Math.random() * 62 ) ];
        }
        return id;
    }
    
    function setUserConfigure( conf ) {
        oUserConfigure = conf;
    }
    
    function getUserConfigure() {
        return oUserConfigure;
    }

    return {
        loadConfigure : loadConfigure,
        saveConfigure : saveConfigure,
        loadPackageInfo : loadPackageInfo,
        createCookie : createCookie,
        readCookie : readCookie,
        eraseCookie : eraseCookie,
        getParameterByName : getParameterByName,
        genRandomID : genRandomID,
        setUserConfigure : setUserConfigure,
        getUserConfigure : getUserConfigure
    };

})();
