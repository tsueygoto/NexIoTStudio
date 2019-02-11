
var express  = require( "express" );
var fs       = require( "fs" );
var path     = require( "path" );
var security = require("../../red/runtime/security");

var app = express();

var pluginFiles = {};
var dashPluginData = "";
var RED = null;

function init( _RED ) {
    RED = _RED;
    app.get( "/" , function( req , res ) {
        RED.log.info("[Dashboard] plugin get /");
        RED.log.info("[Dashboard] GET Query : " + JSON.stringify(req.query));
        RED.log.info("[Dashboard] GET loadPlugins : " + req.query.loadPlugins);
        
        dashPluginData = loadPlugins( pluginFiles, req.query.loadPlugins )
        .then(
                function(dashPluginData) {
                    res.setHeader( "Content-Type" , "text/html" );
                    res.end( dashPluginData );
                }, function( err ) {
                    res.setHeader( "Content-Type" , "text/html" );
                    res.end(err);
                }
        );
    });
    pluginFiles = loadPluginFiles();
}

/**
    
 */
function loadPluginFiles() {
    var pluginFiles = {};
    var searchDirs = [ path.join(__dirname, "plugins") ];
    var type_regex = /App.Plugins.registerChartType\(\s*\"(.*)\"\s*,\s*(\S+)\s*,/;
    var category_regx = /category\s*:\s*\"(.*)\",/;
    var displayName_regx = /display_name\s*:\s*\"(.*)\",/;
    var pluginCharts = {};
    while( searchDirs.length > 0 ) {
        var dir = searchDirs.shift();
        var files = fs.readdirSync( dir );
        for(var i=0; i < files.length; i++) {
            //if (files.hasOwnProperty(i)) {
                var file = path.join(dir, files[i]);
                if( fs.statSync( file ).isDirectory() ) {
                    searchDirs.push( file + "/" );
                    continue;
                }
                if( file.substring( file.length - 5 ) == ".html" ) {
                    var content;
                    try {
                        //console.log( "Added plugin: " + file );
                        content = fs.readFileSync( file );
                        var match = type_regex.exec(content);
                        if ( match == null) {   // content is not ASCII
                            // try to decode content
                            var fname = security.decode(file);
                            if (fname != null) {
                                //console.log("encode file : %s", fname);
                                content = fs.readFileSync( fname );
                                fs.unlink(fname);
                                match = type_regex.exec(content);
                            }
                        }
                        //console.log("match : ", match);
                        if ( match != null ) {
                            if (match.index != -1) {  // means found
                                //console.log(match[1]);
                                //pluginFiles.push( file );
                                if (!pluginFiles.hasOwnProperty(match[1])) {
                                    pluginFiles[match[1]] = content;
                                }
                            }
                            var match2 = category_regx.exec(content);
                            var match3 = displayName_regx.exec(content);
                            
                            //console.info(file, match[1], match[2], match3[1]);
                            pluginCharts[match[1]] = {
                                chart : match[2],
                                category : (match2 ? match2[1] : null),
                                displayName : (match3 ? match3[1] : null)
                            };                            
                        }
                    } catch( e ) {
                        console.log( "Unable to read : " + e.message );
                    }
                }
        }
    }
    return pluginFiles;
}

function loadPlugins( fileList, usedPlugins )
{
    return new Promise(function(fullfill, reject)
    {
        var data = "";
        
        //for( var i = 0; i < fileList.length; i++ )
        //{
        //    try
        //    {
        //        data += fs.readFileSync( fileList[i] );
        //    }
        //    catch( e )
        //    {
//      //          console.log( "Unable to read " + fileList[i] + ": " + e.message );
//      //          reject( "Unable to read " + fileList[i] + ": " + e.message  );
        //    }
        //}
        
        if (usedPlugins == undefined)
        {
            var keys = Object.keys(fileList);
            for( var i=0; i<keys.length; i++ )
            {
                data += fileList[keys[i]];
            }
        }
        else {
            for ( var i=0; i<usedPlugins.length; i++ )
            {
                if (fileList.hasOwnProperty(usedPlugins[i]))
                {
                    data += fileList[usedPlugins[i]];
                }
            }
        }
        
        //console.info(">>>>> data:",data);
        //return data;
        fullfill(data);
    });
}

/**
    (TBD) reload plugins 
    
 */
function reload()
{
}

module.exports = {
    app : app,
    init : init,
    reload : reload
};
