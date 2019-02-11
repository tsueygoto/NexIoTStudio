
var App = App || {};

App.Settings = ( function()
{
    function loadSettings(targetId)
    {
        var dfd = $.Deferred();
        
        if (targetId == undefined) { targetId = -1; }
        // 
        $.getJSON( "api/user/settings", {tId: targetId} )
            .done( function( data , status , xhr )
            {
                //App.Model.Dashboard.checkSysConfDebug()&&console.log(data);
                if( data.hasOwnProperty( "dashboards" ) )
                { 
                    //App.Model.Dashboard.unserializeAll( data.dashboards );
                    dfd.resolve(data);
                }
                else
                {
                    dfd.reject();
                }
            })
            .fail( function( jqxhr, textStatus, error )
            {
                var err = textStatus + ", " + error;
                App.View.Status.set( "Request Failed: " + err );
                dfd.reject("Request Failed: " + err);
            });
        //
        return dfd.promise();
    }

    /**
    
     */
    function saveSettings() {
        var settings = {};
        settings.dashboards = App.Model.Dashboard.serializeAll();
    
        $.ajax({
            method : "POST",
            url : "api/user/settings",
            data : JSON.stringify( settings ),
            contentType : "text/plain"
        })
        .done( function( data ) {
            if( data != "ok" )
            {
                console.error( "Error saving settings: " + data );
            }
        });
    }

    /**
        saveNewSettings
        
        description:
            do save settings only for new dashboard.
            
     */
    function saveNewSettings() {
        var settings = {};
        settings.dashboards = App.Model.Dashboard.serializeAll();
        $.ajax({
            method : "POST",
            url : "api/user/newSettings",
            data : JSON.stringify( settings ),
            contentType : "text/plain"
        })
        .done( function( data ) {
            if( data != "ok" ) {
                console.error( "Error saving settings: " + data );
            }
        });
    }

    /**
    
     */
    function delSettings( delObj )
    {
        var dfd = $.Deferred();
        
        var settings = {};
        settings.dashboards = [delObj];
        console.info("delSettings : ", settings);
       
        $.ajax({
            method : "POST",
            url : "api/user/delsettings",
            data : JSON.stringify( settings ),
            contentType : "text/plain"
        })
        .done( function( data ) {
            if( data != "ok" )
            {
                console.error( "Error delete settings: " + data );
                dfd.reject("Error delete settings: " + data);
            }
            else
            {
                console.info("del settings OK. " + delObj);
                dfd.resolve();
            }
        });
        
        return dfd.promise();
    }
    
    return {
        loadSettings    : loadSettings,
        saveSettings    : saveSettings,
        saveNewSettings : saveNewSettings,
        delSettings     : delSettings
    };

} )();
