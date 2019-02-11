/**
 *
 */
var fs = require( "fs" );
var copyFileSync = require('./lib/fs-copy-file-sync');

var path        = require( "path" );
var express     = require( "express" );
var Mustache    = require( "mustache" );
var multer      = require( "multer" );

var plugins     = require( "./plugins" );
var users       = require( "./users" );
var datasources = require( "./datasources" );

var app = express();
var renderedIndex = "";

function init( RED )
{
    RED.log.info("[Dashboard] server init.");
    
    // first check .dash folder
    var fname = path.join( RED.settings.userDir , ".dash");
    if (!fs.existsSync(fname)) { // if not exist then mkdir
        RED.log.info("[Dashboard] .dash folder is not exit then create it.");
        fs.mkdirSync(fname);
    }
    
    // extract account database to JSON object
    var userConfig = {};
    fname = path.join( RED.settings.userDir , ".dash", "user_conf.json");
    if (!fs.existsSync(fname)) { // if not exist then copy default 
        // no user_conf.json copy system default user_conf.json
        try {
            copyFileSync(path.join( __dirname, "conf", "user_conf.json"), fname);
        } catch (err) {
            RED.log.error( err );
        }
    }
    try {
        userConfig = JSON.parse( fs.readFileSync( fname ) );
    } catch ( err ) {
        RED.log.error( err );
    }

    // check sysConf
    var sysConfig = {};
    fname = path.join( RED.settings.userDir , ".dash", "settings_default.json");
    if (!fs.existsSync(fname)) // if not exist then copy default 
    {
        // no user_conf.json copy system default settings_default.json
        try {
            copyFileSync(path.join( __dirname, "conf", "settings_default.json"), fname);
        } catch (err) {
            RED.log.error( err );
        }
    }
    try {
        sysConfig = JSON.parse( fs.readFileSync( fname ) );
    } catch ( err ) {
        RED.log.error( err );
    }
    
    var pageData;
    fs.readFile( path.join(__dirname, "template", "index.mst"), function( err , data )
    {
        if( err ) { throw err; }
        pageData = data;
        //renderedIndex = Mustache.render( data.toString(), { baseUrl : RED.settings.get( "httpNodeRoot" ) } );
    });

    RED.log.info( "**************************" );
    RED.log.info( " Dashboard up and running " );
    RED.log.info( "**************************" );

    var dashRootFilePath = __dirname + "/static";
    app.use( "/" , express.static( dashRootFilePath ) );
    
    plugins.init( RED );
    app.use( "/api/plugins" , plugins.app );

    users.init( RED );
    app.use( "/api/user" , users.app );

    datasources.init( RED );
    app.use( "/api/datasources" , datasources.app );

    /**
     *
     */
    app.get( "/imagesources" , function( request , response ) {
        var files = fs.readdirSync( dashRootFilePath + "/images" );
		/**
		 *kewei modified : Check files format
		 *Reg : Check image format
		 */
		var reg = /\.(jpg|gif|png|jpeg|svg)$/i;
		for( i=0; i<files.length; i++){
			if (reg.test(files[i])){
				continue;
			}  
			else{
				files.splice(i, 1);  //Wrong format >> delete
				i -= 1;  //index - 1
			}
			}
        response.send(files);
    });
	
	/*kewei added : Image upload*/
	var saveImg = multer.diskStorage({
		destination: function(req, file, cb) {
			cb(null, dashRootFilePath + "/images" )    //path
			},
		filename: function(req, file, cb) {
			cb(null, file.originalname)    //file name
		}
	})

	var uploadZip = multer({
		storage: saveImg
	});

	app.post( "/imgUpload" , uploadZip.single('file') , function( req , res ) {
        res.json(req.file);
    });

    var contentLocation = "";
    app.get( "*" , function( request , response )
    {
        //console.info(">>>>>>> originalUrl :",request.originalUrl);
        //console.info(">>>>>>> host :",request.get('host'));
        //console.info(">>>>>>> url :",request.url);
        //console.info(">>>>>>> referer :",request.get('referer'));
        //console.info("origin :", request.get('origin'));

        var contentLoc = request.get('content-location');
        //console.info(">>>> contentLoc : ", contentLoc);
        if ( contentLoc != contentLocation )
        {
            contentLocation = contentLoc;
            if ( contentLocation == undefined ) {
                contentLocation = RED.settings.get("httpNodeRoot"); 
            }
            console.info("contentLocation : ", contentLocation);
            renderedIndex = Mustache.render( pageData.toString(),
                { baseUrl : contentLocation.replace('/dash/',"/") } );
        }
            
        response.send( renderedIndex );
    });
  
    //app.get( "*" , function( request , response ) {
    //      console.log(request.url);
    //      console.log(request.query);
    //      var query = request.query;
    //      if (query.hasOwnProperty('name') && query.hasOwnProperty('pwd')) {
    //              // create a session for user
    //              
    //              fs.readFile( __dirname + "/template/index.mst" , function( err , data ) {
    //                  if( err ) throw err;
    //                  renderedIndex = Mustache.render( data.toString() , { baseUrl : RED.settings.get( "httpNodeRoot" ), display : "none"} );
    //                  response.send(renderedIndex);
    //              });
    //      } else {
    //          response.send( renderedIndex );
    //      }
    //  } );
        
    RED.httpNode.use( "/dash/" , app );
  
    //var session = require('client-sessions');
    //app.use(session({
    //    cookieName: 'session',
    //    secret: 'random_string_goes_here',
    //    duration: 30 * 60 * 1000,
    //    activeDuration: 5 * 60 * 1000,
    //})); 
    
    
    /**
    *
    */
    function IoTStudioAuthentication(host, name, pwd, cb) {
        var request = require('request');

        var options = {};
        options.uri = host + "/auth/login";
        RED.log.info("[Dashboard] get options.uri : " + options.uri);
        options.method = "GET";
        
        var status = {};
        status.login = false;
        
        request(options, function (error, response, body) {
            status.error = error;
            //status.response = response;
            status.body = body;
            
            if (!error && response.statusCode == 200) {
                if (body == "{}") {
                    RED.log.info("[Dashboard] no auth.");
                    status.auth = false;
                    status.login = true;
                    cb(status);
                } else {
                    status.auth = true;
                    
                    RED.log.info("[Dashboard] Need Auth, To get token.");
                    
                    options.method = "POST";
                    options.uri = host + "/auth/token";
                    RED.log.info("[Dashboard] post options.uri : " + options.uri);
                    
                    options.headers = {
                        'Content-Type': 'application/json'
                    };
                    options.json = {
                        "client_id" : "node-red-admin",
                        "grant_type" : "password",
                        "scope" : "read",
                        "username" : name,
                        "password" : pwd
                    };
                    
                    request(options, function (error, response, body) {
                        status.error = error;
                        //status.response = response;
                        status.body = body;

                        console.log('error', error);
                        console.log('response', response.statusCode);
                        console.log('body', body);
                        if (!error && response.statusCode == 200) {
                            //console.log(body.id) // Print the shortened url.
                            //response.json({flows: "ok"});
                            //console.log(body);
                            //console.log(typeof body);
                            //console.log(body.access_token);
                            //console.log(body.token_type);
                            //cb(body.token_type+" "+body.access_token)
                            status.login = true;
                            status.token = body.token_type+" "+body.access_token;
                            cb(status);
                        } else {
                            console.log("error", error);
                        //    //log.error("ERROR:" + error + " statusCode:" + response.statusCode);
                        //    console.info("error : ", error);
                        //    //console.info("response : ", response);
                        //    console.info("body :", body);
                        //    //response.json({msg: "Get Auth Token Errror",
                        //    //        error: error, 
                        //    //        statusCode : response.statusCode});
                        
                            //status.code = response.statusCode;
                            //status.error = body.error;
                            //status.error_description = body.error_description;
                            status.login = false;
                            cb(status);
                        }
                    });
                }
            } else {
            //    console.info("error : ", error);
            //    console.info("response : ", response);
            //    response.json({msg: "Get Auth Login Errror",
            //            error: error, 
            //            statusCode : response.statusCode});
            //
                status.login = false;
                cb(status);
            }
        });
    }
    
    /**
        Dashboard login handle in backend
        
     */
    app.post( "/login" , function( req , res )
    {
        console.info("request.body.name :", req.body.name);
        console.info("request.body.pwd :", req.body.pwd);
        console.info("fname :", fname);
        console.info("userConfig :", userConfig);
        
        // check IoT Studio authentication
        return IoTStudioAuthentication(
            req.protocol + "://" + req.get('host'),
            req.body.name,
            req.body.pwd,
            function(objStatus) {
                if (objStatus.login) {   // login success
                    var user;
                    if (userConfig.hasOwnProperty(req.body.name))
                    {
                        user = userConfig[req.body.name];
                    }
                    // if iot-studio auth ok but account not exit in dashboard,
                    // then adopot the 'nexcom' for this account
                    else
                    {
                        user = userConfig["nexcom"];
                    }
                    user.name = req.body.name;
                    delete user.password;   // remvoe password for response
                    res.end(JSON.stringify(user));
                } else {   // login fail
                    res.end(JSON.stringify(objStatus));
                }
            });
    });
    
    return sysConfig;
}

function initapp(parent) {
    console.log("express.static");
    app.use( "/" , express.static( __dirname + "/static" ) );
    
    plugins.init();
    app.use( "/api/plugins" , plugins.app );

    //app.get( "*" , function( request , response ) {
    //    response.send( renderedIndex );
    //} );
    
}

module.exports = {
  init : init,
  initapp : initapp
};
