var express = require( "express" );
var WebSocketServer = require( "ws" ).Server;
var util = require( "util" );
var RED = null;
var wsServer = null;
var app = express();

function init( _RED ) {
    'use strict';
    
    RED = _RED;

    /**
     * get IoT Studio all iot-datasource node ids
     */
    app.get( "/" , function( req , res )
    {
        RED.log.info("[Dashboard] datasources get /");
        RED.log.info("[Dashboard] datasources get used Datasources id " + JSON.stringify(req.query.usedDss));
        console.info("[Dashboard] datasources get used Datasources query ", req.query);
        
        var usedDss = req.query.usedDss;
        var data = {};
        RED.nodes.eachNode( function( nodeObj )
        {
            if( nodeObj.type == "iot-datasource" )
            {
                if (usedDss == undefined)
                {
                    var node = RED.nodes.getNode( nodeObj.id );
                    if( !node ) { return; }                
                    data[ nodeObj.id ] = node.getDatasourceConfig();
                }
                else if (usedDss.indexOf(nodeObj.id) != -1)
                {
                    var node = RED.nodes.getNode( nodeObj.id );
                    if( !node ) { return; }                
                    data[ nodeObj.id ] = node.getDatasourceConfig();
                }
            }
        });
        res.setHeader( "Content-Type" , "application/json" );
        res.end( JSON.stringify( data ) );
    });

    /**
     * RESTful API to get specific node id's history from start to end period
     */
    app.get( "/history" , function( request , response )
    {
        RED.log.info("[Dashboard] app get /history");

        var error = false;
        try
        {
            if( !request.query.hasOwnProperty( "start" ) ||
                !request.query.hasOwnProperty( "end" ) ||
                !request.query.hasOwnProperty( "id" ) )
            {
                throw 1;
            }
    
            var start = parseInt( request.query.start );
            var end = parseInt( request.query.end );
            if( isNaN( start ) || isNaN( end ) ) { throw 1; }
    
            var node = RED.nodes.getNode( request.query.id );
            if( !node ) { throw 1; }
    
            node.handleHistoryRequest( response , start , end );
        }
        catch( e )
        {
            error = true;
        }

        if( error ) { response.status( 400 ).end(); }
    });
    
    wsServer = new WebSocketServer({
        perMessageDeflate: false,
        server : RED.server,
        path : "/dash/dsws",
    } );

    wsServer.on( "connection" , handleWSConnection );
    
    
    
    var preobj = {}; 
    function report() {
        try {
            if (global.gc) {
                // do global gc
                global.gc();
                /*
                heapTotal and heapUsed refer to V8's memory usage.
                external refers to the memory usage of C++ objects bound to JavaScript objects managed by V8.
                rss, Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, which includes the heap, code segment and stack.
                */
                function strFormat(data, len) {
                    // parameter process
                    if (len == undefined) { len = 3 };
                    if (typeof data != 'string') { data = data.toString(); }
                    
                    var out = data;
                    var dataLen = data.length;
                    if (len > dataLen) {
                        out = data + ' '.repeat(len-dataLen);
                    } else if (len < dataLen) {
                        out = data.slice(0, len-1) + '*';
                    }
                    return out;
                }
                /**
                 */
                function storeObj(used, wsServer) {
                    if (used === undefined) { return preobj; }
                    preobj.rss = used.rss;
                    preobj.heapUsed = used.heapUsed;
                    preobj.heapTotal = used.heapTotal;
                    preobj.external = used.external;
                    preobj.clients = wsServer.clients.length;
                    return preobj;
                }
                const used = process.memoryUsage();
                
                if ( used ) {
                    var obj = storeObj();
                    //const rss = process.memoryUsage().rss / 1024 / 1024;
                    //var now = new Date();
                    // check clients
                    if (obj == {}) {
                        RED.log.info('[Dashboard] clients: ' + strFormat(wsServer.clients.length) + ' rss: ' + strFormat((used.rss / 1024 / 1024), 20) + ' heapUsed:' + strFormat((used.heapUsed / 1024 / 1024 ), 20));
                    } else {
                        var clientStatus = '=';
                        if (wsServer.clients.length > obj.clients) {
                            clientStatus = '+';
                        } else if (wsServer.clients.length < obj.clients) {
                            clientStatus = '-';
                        }
                        var rssStatus = '=';
                        if (used.rss > obj.rss) {
                            rssStatus = '+';
                        } else if (used.rss < obj.rss) {
                            rssStatus = '-';
                        }
                        var heapTotalStatus = '=';
                        if (used.heapTotal > obj.heapTotal) {
                            heapTotalStatus = '+';
                        } else if (used.heapTotal < obj.heapTotal) {
                            heapTotalStatus = '-';
                        }                    
                        var heapUsedStatus = '=';
                        if (used.heapUsed > obj.heapUsed) {
                            heapUsedStatus = '+';
                        } else if (used.heapUsed < obj.heapUsed) {
                            heapUsedStatus = '-';
                        }                    
                        RED.log.info(
                            '[Dashboard] clients: ' + strFormat(wsServer.clients.length) + clientStatus + ' rss: ' + strFormat((used.rss / 1024 / 1024), 8)  + rssStatus + ' heapTotal: ' + strFormat((used.heapTotal / 1024 / 1024 ), 8)  + heapTotalStatus + ' heapUsed: ' + strFormat((used.heapUsed / 1024 / 1024 ), 8)  + heapUsedStatus + ' ' + strFormat(((used.heapUsed * 100 ) / used.heapTotal), 4) + '%'
                        );
                        
                    }
                    // store data to preobj
                    storeObj(used, wsServer);
                }
            } else {
                RED.log.error('No GC hook! Start your program as `node --expose-gc file.js`.');
            }
        } catch ( e ) {
            RED.log.error('error: ' + e.message);
        }
    }
    setInterval(report, 60000);
}

var fs = require('fs');
var path = require('path');

/**

 */
function logErr(e, data) {
    // get year month day
    var date = new Date();
    var v = [
        date.getFullYear(),
        (date.getMonth() + 1),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ];
    var dt = v[0].toString() + ((v[1] > 9) ? v[1] : ('0'+v[1])) + ((v[2] > 9) ? v[2] : ('0'+v[2])) + '-' + ((v[3] > 9) ? v[3] : ('0'+v[3])) + ((v[4] > 9) ? v[4] : ('0'+v[4])) + ((v[5] > 9) ? v[5] : ('0'+v[5]));

    var wdata = {
        ename : e.name,
        emsg : e.message,
        data : data
    }
    
    var filename = path.resolve(path.join(__dirname, 'log', 'wsCatch.log'));
    var filenameOld = path.resolve(path.join(__dirname, 'log', 'wsCatch.log.old'));
    
    try {
        var stats = fs.statSync(filename);
        if (stats.size > 10240) { // > 1M
        //if (stats.size > 1048576) { // > 1M
            // check store exist
            try {
                fs.statSync(filenameOld);
                fs.unlinkSync(filenameOld);
                // rename file to 
                fs.renameSync(filename, filenameOld);
            } catch(e) {
                // rename file to 
                fs.renameSync(filename, filenameOld);
            }
        } else {
            // check file 
        }
    } catch(e) {
        console.log('check file [', filename, '] fail : ', e.message);
    }
    
    fs.appendFileSync(filename, dt + ' ' + JSON.stringify(wdata) + "\n"); 
}


/**
 *
 */
function handleWSConnection( ws ) {
    ws.on( "message" , function( msg ) {
        try {
            msg = JSON.parse( msg );
        }
        catch( e ) {
            // keep message to error.log
            logErr(e, msg);
            console.log( e.message );
            return;
        }

        logErr({name:'test', message:'...'}, msg);
        
        if( !msg.hasOwnProperty( "m" ) ) { return; }
    
        var node, i;
        if( msg.m == "sub" )    // subcribe
        {
            if( !util.isArray( msg.id ) ) { msg.id = [ msg.id ]; }
            for( i = 0; i < msg.id.length; i++ )
            {
                node = RED.nodes.getNode( msg.id[i] );
                if( node )
                {
                    node.addClient( { ws : ws } );
                }
            }
        }
        else if( msg.m == "unsub" ) // unscribe
        {
            if( !util.isArray( msg.id ) ) { msg.id = [ msg.id ]; }
            for( i = 0; i < msg.id.length; i++ )
            {
                node = RED.nodes.getNode( msg.id[i] );
                if( node )
                {
                    node.removeClient( ws );
                }
            }
        }
        else if( msg.m == "hist" )  // history
        {
            node = RED.nodes.getNode( msg.dsid );
            if( node )
            {
                node.handleHistoryRequest( ws , msg.cid , msg.start , msg.end );
            }
        }
        else if( msg.m == "button" )    // button
        {
            node = RED.nodes.getNode( msg.dsid );
            if( node ) {
                node.handleButtonRequest( ws , msg.cid , msg.start , msg.end );
            }
        }
        else if( msg.m == "click" )
        {
            node = RED.nodes.getNode( msg.dsid );
            if( node ) {
                node.handleClickRequest( ws , msg.cid , msg.data );
            }
        }
        else if( msg.m == "dataBroker" )
        {
            node = RED.nodes.getNode( msg.dsid );
            if( node ) {
                node.handleDataBroker( ws , msg.cid , msg.data );
            }
        }

    });

    ws.on( "close" , function( code , message )
    {
        if( code != 1000 && code != 1001 )
        {
            RED.log.warn( "[Dashboard] WS Connection closed [code=" + code + ( message ? ", message=" + message : "" ) + "]");
        }
    });

    ws.on( "error" , function( err )
    {
        RED.log.error( "[Dashboard] WS Error:" + err );
    });
}

module.exports = 
{
  app : app,
  init : init
};
