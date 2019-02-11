
var App = App || {};

App.Net = ( function() {

    var ws = null;
    var reconnectAttempts = 0;

    function createConnection()
    {
        console.log("*** createConnection");
        var dfd = $.Deferred();

        //ws = new WebSocket( ( location.protocol == "https:" ? "wss" : "ws" ) + "://" + location.host + "/iotStudio/dash/dsws" );
        
        var path = location.hostname;
        var port = location.port;
        if (port.length !== 0)
        {
            path = path+":"+port;
        }

        console.dir(document.location);
        var index = document.location.pathname.indexOf('/dash/');
        if ( index == -1 )
        {
            path = ( location.protocol == "https:" ? "wss" : "ws" ) + "://" + location.host + "/dash/dsws";
        }
        else 
        {
            path = document.location.pathname.substr(0, index+5);
            console.info(" path : ", path);
            path = path+(path.slice(-1) == "/"?"":"/")+"dsws";
            path = "ws"+(document.location.protocol=="https:"?"s":"")+"://"+ location.host  + path;
            console.info("final path : " + path);   
        }
        
        ws = new WebSocket( path );

        ws.onopen = function( event ) 
        {
            if (reconnectAttempts > 0) {
                location.reload();
            }
            reconnectAttempts = 0;
            App.View.Status.setConnected( true );
            dfd.resolve();
        };

        ws.onmessage = function( event ) 
        {
            var data = event.data;
            try
            {
                data = JSON.parse( data );
            }
            catch( e ) {} // No worries, treat data as String

            if( typeof data === "string" )
            {
        
            }
            else
            {
                App.Controller.Dashboard.onNetworkMessage( data );
            }
        };

        ws.onclose = function( event ) 
        {
            console.log( "Close" , event );
            ws = null;
            if( event.code === 1000 )
            {
                App.Controller.Dashboard.onNetworkDisconnect();
            }
            //alert("ws onclose");
            App.View.Status.setConnected( false );

            reconnectAttempts++;
            App.View.Status.set("try to reconnect ... " + reconnectAttempts);
            if (reconnectAttempts < 10) {
                setTimeout(createConnection,1000);
                //if (reconnectAttempts > 5 && errornotification == null) {
                //    errornotification = RED.notify(RED._("notification.errors.lostConnection"),"error",true);
                //}
            } else if (reconnectAttempts < 20) {
                setTimeout(createConnection,2000);
            } else {
                connectCountdown = 60;
                connectCountdownTimer = setInterval(function() {
                    connectCountdown--;
                    if (connectCountdown === 0) {
                        //errornotification.update(RED._("notification.errors.lostConnection"));
                        clearInterval(connectCountdownTimer);
                        createConnection();
                    } else {
                        //var msg = RED._("notification.errors.lostConnectionReconnect",{time: connectCountdown})+' <a href="#">'+ RED._("notification.errors.lostConnectionTry")+'</a>';
                        //errornotification.update(msg);
                        //$(errornotification).find("a").click(function(e) {
                        //    e.preventDefault();
                        //    errornotification.update(RED._("notification.errors.lostConnection"));
                        //    clearInterval(connectCountdownTimer);
                        //    connectWS();
                        //})
                        App.View.Status.set("wait " + connectCountdownTimer + " sec to reconnect");
                    }
                },1000);
            }
        };

        ws.onerror = function( event ) 
        {
            console.log( "Error" , event );
            ws = null;
            App.View.Status.setConnected( false );
        };

        return dfd.promise();
    }

    function closeConnection()
    {
        console.log("*** closeConnection");
        ws.onclose = null;
        ws.close();
        ws = null;
        App.View.Status.setConnected( false );
    }

    /*
     *
     */
    function subscribeToDatasources( datasources ) {
        if( ws === null ) { return; }
        console.info("[subscribeToDatasources] ", JSON.stringify( { m : "sub" , id : datasources } ));
        ws.send( JSON.stringify( { m : "sub" , id : datasources } ) );
    }

    function unsubscribeFromDatasources( datasources )
    {
        if( ws === null ) { return; }
        ws.send( JSON.stringify( { m : "unsub" , id : datasources } ) );
    }

    function requestHistoryData( dsid , cid , start , end )
    {
        console.log("ws sent!!!");
        if( ws === null ) { return; }
        ws.send( JSON.stringify( { m : "hist" , dsid : dsid , cid : cid , start : start , end : end } ) );
    }

    function buttonRequest( dsid , cid , start , end )
    {
        console.log("button ws sent!!!");
        if( ws === null ) { return; }
        ws.send( JSON.stringify( { m : "button" , dsid : dsid , cid : cid , start : start , end : end } ) );
    }

    ///
    ///
    ///
    function clickRequest( dsid , cid , data )
    {
        console.log("click ws sent!!!");
        if( ws === null ) { return; }
        ws.send( JSON.stringify( { m : "click" , dsid : dsid , cid : cid , data : data } ) );
    }
  
    function dataBroker( dsid , cid , data )
    {
        console.log("dataBroker ws sent!!!");
        if( ws === null ) { return; }
        ws.send( JSON.stringify( { m : "dataBroker" , dsid : dsid , cid : cid , data : data } ) );
    }

    return {
        createConnection : createConnection,
        closeConnection : closeConnection,
        subscribeToDatasources : subscribeToDatasources,
        unsubscribeFromDatasources : unsubscribeFromDatasources,
        requestHistoryData : requestHistoryData,
        buttonRequest : buttonRequest,
        clickRequest : clickRequest,
        dataBroker : dataBroker
    };

} )();
