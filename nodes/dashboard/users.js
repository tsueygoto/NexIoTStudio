
//var libURL = require( "url" );
var fs = require( "fs" );
var path = require( "path" );
var express = require( "express" );
var copyFileSync = require('./lib/fs-copy-file-sync');

var app = express();

var settings = {};
var configure = {};
var cfgDir;
var RED;

function init( _RED )
{
    RED = _RED;
    
    var oldCfgDir = path.join(__dirname, ".dash");
    cfgDir = path.join( RED.settings.userDir , ".dash" );
    
    RED.log.info( "\nDashboard OLD User Configure Folder : \n" +  oldCfgDir);
    RED.log.info( "\nDashboard User Configure Folder : \n" +  cfgDir);
  
    // process .dash folder
    try
    {
        fs.mkdirSync( cfgDir );
    }
    catch( e )
    {
        if( e.code != "EEXIST" )
        {
            console.error( "[Dashboard][User][" + e.code + "] Create dir : " + cfgDir );
            return;
        }
    }

    // process old data from dashboard/.dash/config_default.json
    var oldCfgData = null;
    try
    {
        // if there are exist the old folder and data then move to the userDir/.dash folder
        oldCfgData = fs.readFileSync( path.join( oldCfgDir , "config_default.json" ) );
        console.info("Old Dashboard Configure Data : ", oldCfgData);
        if( oldCfgData )
        {
            try
            {
                fs.unlinkSync( path.join( oldCfgDir , "config_default.json" ) );
                fs.rmdirSync( oldCfgDir );
                fs.writeFileSync( getSettingsFilename( "default" ) , oldCfgData );
                RED.log.info( "Moved dashboard config to " + cfgDir );
            }
            catch( e )
            {
                console.error( "Unable to move old config file: " + e.message );
            }
        }
    }
    catch( e )
    {
        console.info("Error Code", e.code);
        if ( e.code === "ENOENT" )
        {
            RED.log.info( "[Dasboard] No old config data.\n [" + path.join( oldCfgDir , "config_default.json" ) + "]" );
        }
    }
    
    // process user config_default.json
    var fname = path.join( cfgDir, "config_default.json");
    if (!fs.existsSync(fname)) // if not exist then copy default 
    {
        // no user_conf.json copy system default user_conf.json
        try {
            copyFileSync(path.join( __dirname, "conf", "config_default.json"), fname);
        } catch (err) {
            RED.log.error( err );
        }
    }

    /**
        GET
        /api/user/settings
        load .dash/config_default.json
     */
    app.get( "/settings" , function( req , res )
    {
        RED.log.info("[Dashboard] RESTFul API /api/user/settings load config_default.json with [" + req.query.tId + "]");
        var tId = req.query.tId;
        getSettings("default", tId)
            .then(
                function(settingsContent)
                {
                    res.setHeader( "Content-Type" , "application/json" );
                    res.end(JSON.stringify(settingsContent));
                }, function(settingsContent)
                {
                    res.setHeader( "Content-Type" , "application/json" );
                    res.end(JSON.stringify(settingsContent));
                }
            );
    });
    
    /**
     *  /api/user/configure
     *  load .dash/settings_default.json
     */
    app.get( "/configure" , function( req , res )
    {
        RED.log.info("[Dashboard] RESTFul API /api/user/configure load settings_default.json");
        getConfigure("default").then(function(configureContent)
        {
            res.setHeader( "Content-Type" , "application/json" );
            res.end(JSON.stringify(configureContent));
        });
    });

    /**
     *  /api/user/packageInfo
     *  load dasboard/package.json
     */
    app.get( "/packageInfo" , function( req , res )
    {
        RED.log.info("[Dashboard] RESTFul API /api/user/packageInfo load dashboard package.json");
        getPackageInfo().then(function(packageContent)
        {
            res.setHeader( "Content-Type" , "application/json" );
            res.end(JSON.stringify(packageContent));
        });
    });


    // save settings POST call
    app.post( "/settings", function( req , res )
    {
        var data = "";
        req.on( "data" , function( chunk )
        {
            data += chunk;
        });
    
        req.on( "end" , function()
        {
            try {
                settings.default = JSON.parse( data );
                saveSettings( "default" ).then(function(result){
                    res.end( "ok" );
                },function(err){
                    res.end( err );
                });
            } catch( e ) {
                res.end( e.message );
            }
        });
    });

    /**
        newSettings
        
        description:
            save new settings by POST call.
            
     */
    app.post( "/newSettings", function( req , res ) {
        var data = "";
        req.on( "data" , function( chunk ) {
            data += chunk;
        });
    
        req.on( "end" , function() {
            try {
                settings.default = JSON.parse( data );
                saveNewSettings( "default" ).then(function(result) {
                    res.end( "ok" );
                },function(err) {
                    res.end( err );
                });
            } catch( e ) {
                res.end( e.message );
            }
        });
    });
    
    // del settings POST call
    app.post( "/delsettings", function( req , res )
    {
        var data = "";
        req.on( "data" , function( chunk )
        {
            data += chunk;
        });
    
        req.on( "end" , function()
        {
            try {
                settings.default = JSON.parse( data );
                console.info("[delsettings] settings.default : ", settings.default);
                delSettings( "default" ).then(function(result){
                    res.end( "ok" );
                }, function(err){
                    res.end( err );
                });
                //res.end( "ok" );
            } catch( e ) {
                res.end( e.message );
            }
        });
    });

    app.post( "/configure" , function( req , res ) {
    
        var data = "";
    
        req.on( "data" , function( chunk ) {
            data += chunk;
        });
    
        req.on( "end" , function() {
            try {
                configure.default = JSON.parse( data );
                saveConfigure( "default" );
                res.end( "ok" );
            } catch( e ) {
                res.end( e.message );
            }
        });
    });
	/*kewei added*/
	app.post( "/saveBKSettings" , function( req , res ) {
		var backgroundImage = req.body.imgName;
		var dashbaordName = req.body.dashbaordName;
		var scale = req.body.scale;
		var center = req.body.center;
        saveBKSettings( backgroundImage, dashbaordName, scale, center );
		res.send("Done");
    });
    
	/*kewei added*/
	app.post( "/getBKSettings" , function( req , res ) {
		var dashbaordName = req.body.dashbaordName;
		res.send( getBKSettings( dashbaordName ) );
    });
}

/*kewei added*/
function saveBKSettings( backgroundImage, dashbaordName, scale, center )
{
    var configFilePath = path.join(cfgDir, "config_default.json");	
    var data = JSON.parse(fs.readFileSync(configFilePath));
	var BKImage = backgroundImage;
	var BKImageCheck = BKImage.split("/");
	var dashName = dashbaordName;
	var scale = scale;
	var center = center;
    var updated = false;
    if ( data.dashboards != [] )
    {
		for(var i=0; i<data.dashboards.length; i++)
        {
            if (data.dashboards[i].name === dashName)   // found
            {
				BKImageCheck[1] ? data.dashboards[i].background = BKImage:null;
				data.dashboards[i].scale = scale;
				data.dashboards[i].center = center;			
				updated = true;
                break;
            }
			else{
				continue;
			}				
        }
    }
	updated ? fs.writeFile(configFilePath,JSON.stringify(data,null,'\t')):null;
	return "Done";
}

/*kewei added*/
function getBKSettings( dashbaordName )
{
    var configFilePath = path.join(cfgDir, "config_default.json");	
    var data = JSON.parse(fs.readFileSync(configFilePath));
	var BKSetting = {
		BKImage : "",
		scale : "",
		center : ["",""]
	};
	var dashName = dashbaordName;
	//RED.log.info("[kewei] dashbaordName = " + dashName);
    if ( data.dashboards != [] )
    {
		for(var i=0; i<data.dashboards.length; i++)
        {
            if (data.dashboards[i].name === dashName)
            {
                BKSetting.BKImage = data.dashboards[i].background;
				BKSetting.scale = data.dashboards[i].scale;
				BKSetting.center = data.dashboards[i].center;
                break;
            }
			else{
				continue;
			}				
        }
    }
	return JSON.stringify(BKSetting);
}

/**
 *
 */
function getSettings( fName, tId )
{
    var fileName = getSettingsFilename( fName );
    return new Promise(function(fullfill, reject)
    {
        try
        {
            var data = JSON.parse(fs.readFileSync(fileName));
            var updated = false;
            // process check id
            if ( data.dashboards != [] )
            {
                for(var i=0; i<data.dashboards.length; i++)
                {
                    if (!data.dashboards[i].hasOwnProperty("id"))
                    {
                        data.dashboards[i].id = "nex.dashboard." + (1+Math.random()*4294967295).toString(16);
                        updated = true;
                    }
                }
            }
            if (updated)
            {
                fs.writeFileSync( fileName , JSON.stringify( data , null , '\t' ) );
            }

            //console.info(data);
            if (tId != -1) {
                fullfill({ dashboards: [ data.dashboards[tId] ]});
            }
            else
            { fullfill(data); }
        }
        catch( e )
        {
            RED.log.error( "Unable to load settings file [" + fileName + "] : " + e.message );
            reject({"dashboards":[]});
        }
    });    
}

/**
 *
 */
function getConfigure( id )
{
    var fileName = getConfigureFilename( id );
    return new Promise(function(fullfill, reject)
    {
        try
        {
            var data = JSON.parse(fs.readFileSync(fileName));
            fullfill(data);
        }
        catch( e )
        {
            RED.log.error( "Unable to load configure file [" + fileName + "] : " + e.message );
            reject({});
        }
    });    
}

/**
 *
 */
function getPackageInfo()
{
    var fileName = getPackageFilename();
    return new Promise(function(fullfill, reject)
    {
        try
        {
            var data = JSON.parse(fs.readFileSync(fileName));
            fullfill(data);
        }
        catch( e )
        {
            RED.log.error( "Unable to load package file [" + fileName + "] : " + e.message );
            reject({});
        }
    });
}


///
///
///
//function loadConfigure( id ) {
//    try {
//        //console.log(getConfigureFilename( id ));
//        //console.log(fs.readFileSync( getConfigureFilename( id ) ));
//        return JSON.parse( fs.readFileSync( getConfigureFilename( id ) ) );
//    }
//    catch( e ) {
//        console.log( "Unable to load configure file '" + id + "': " + e.message );
//    }
//    return null;
//}

///
///
///
//function loadPackage() {
//    try {
//        //console.log(getPackageFilename());
//        //console.log(fs.readFileSync( getPackageFilename() ));
//        return JSON.parse( fs.readFileSync( getPackageFilename() ) );
//    }
//    catch( e ) {
//        console.log( "Unable to load package.json file : " + e.message );
//    }
//    return null;
//}

/**
 *
 */
function saveSettings( fName )
{
    return new Promise(function(fullfill, reject)
    {
        if( !settings.hasOwnProperty( fName ) ) {
            reject("file :" + fName + " is not exist.");
            return;
        }
    
        try
        {
            var fileName = getSettingsFilename( fName );
            var data = JSON.parse(fs.readFileSync(fileName));
            var targetData = settings[ fName ];
            var len = targetData.dashboards.length;
            for(var i=0; i<len; i++)
            {
                var found = false;
                for(var j=0; j<data.dashboards.length; j++)
                {
                    if (data.dashboards[j].id == targetData.dashboards[i].id)   // found
                    {
                        found = true;
                        data.dashboards[j].charts = targetData.dashboards[i].charts;
                        break;
                    }
                }
                if (!found)
                {
                    data.dashboards.push(targetData.dashboards[i]);
                }
            }
            
            fs.writeFileSync( fileName , JSON.stringify( data , null , '\t' ) );
            
            fullfill("ok");
        }
        catch( e )
        {
            console.log( "Unable to save settings '" + fName + "': " + e.message );
            reject("Unable to save settings '" + fName + "': " + e.message);
        }
    });
}

/**
    saveNewSettings
    
    description:
        save settings only the new data
        
 */
function saveNewSettings( fName )
{
    return new Promise(function(fullfill, reject) {
        if( !settings.hasOwnProperty( fName ) ) {
            reject("file :" + fName + " is not exist.");
            return;
        }
    
        try {
            var fileName = getSettingsFilename( fName );
            var data = JSON.parse(fs.readFileSync(fileName));
            var targetData = settings[ fName ];
            var len = targetData.dashboards.length;
            for(var i=0; i<len; i++) {
                var found = false;
                for(var j=0; j<data.dashboards.length; j++) {
                    if (data.dashboards[j].id == targetData.dashboards[i].id)   // found
                    {
                        found = true;
                        //data.dashboards[j].charts = targetData.dashboards[i].charts;
                        break;
                    }
                }
                if (!found)
                {
                    data.dashboards.push(targetData.dashboards[i]);
                }
            }
            fs.writeFileSync( fileName , JSON.stringify( data , null , '\t' ) );
            fullfill("ok");
        }
        catch( e ) {
            console.log( "Unable to save settings '" + fName + "': " + e.message );
            reject("Unable to save settings '" + fName + "': " + e.message);
        }
    });
}

/**
 *
 */
function delSettings( fName )
{
    return new Promise(function(fullfill, reject)
    {
        if(!settings.hasOwnProperty( fName )) {
            reject("file :" + fName + " is not exist.");
            return;
        }

        try
        {
            var fileName = getSettingsFilename( fName );
            var data = JSON.parse(fs.readFileSync(fileName));
            
            var targetData = settings[ fName ];
            
            console.info("-----------------");
            console.info(targetData);
            console.info("-----------------");
            
            for(var j=0; j<data.dashboards.length; j++)
            {
                if (data.dashboards[j].id == targetData.dashboards[0].id)   // found
                {
                    found = true;
                    console.info("id:", j);
                    data.dashboards.splice(j, 1);
                    break;
                }
            }
            
            fs.writeFileSync( fileName , JSON.stringify( data , null , '\t' ) );
            fullfill("ok");
        }
        catch( e )
        {
            console.log( "Unable to delete settings '" + fName + "': " + e.message );
            reject("Unable to delete settings '" + fName + "': " + e.message);
        }
    });
}

function saveConfigure( id ) {
    if( !configure.hasOwnProperty( id ) ) { return; }
    try {
        fs.writeFileSync( getConfigureFilename( id ) , JSON.stringify( configure[ id ] , null , '\t' ) );
    } catch( e ) {
        console.log( "Unable to save configure '" + id + "': " + e.message );
    }
}

/**
 *
 */
function getSettingsFilename( id )
{
    var settingsFilename = path.join(cfgDir, "config_" + id + ".json");
    RED.log.info("[Dashboard] Get Settings Filename = " + settingsFilename);
    return settingsFilename;
}

/**
 *
 */
function getConfigureFilename( id )
{
    var configureFilename = path.join(cfgDir, "settings_" + id + ".json");
    RED.log.info("[Dashboard] Get Config Filename = " + configureFilename);
    return configureFilename;
}

/// <summary></summary>
/// <param></param>
/// <returns Type="String" >The package.json full path filename.</return>
function getPackageFilename()
{
    var packageFilename = path.join(__dirname, "package.json");
    RED.log.log("[Dashboard] Get Package Filename = " + packageFilename);
    return packageFilename;
}

module.exports = {
  app : app,
  init : init
};
