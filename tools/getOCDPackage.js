/***

 */

var request = require('request');

var isWin = process.platform === 'win32';

/**
    function Area
    
 */

/**
    downloadOCDPackage
 */
function downloadOCDPackage(fileUrl, apiPath, callback) {
    var fs = require('fs');
    var url = require('url'),
        http = require('http'),
        p = url.parse(fileUrl),           
        timeout = 10000;
        
//        console.log(p.pathname);
//        console.log(p.pathname.lastIndexOf('/'));
        
    var file_name = p.pathname.slice(p.pathname.lastIndexOf('/') + 1);
    var file = fs.createWriteStream(apiPath);
    
    var timeout_wrapper = function( req ) {
        return function() {
            console.log('abort');
            req.abort();
            callback("File transfer timeout!");
        };
    };
 
    //console.log('before');

    var request = http.get(fileUrl).on('response', function(res) { 
        // console.log('in cb');           
        var len = parseInt(res.headers['content-length'], 10);
        var downloaded = 0;
        
        res.on('data', function(chunk) {
            file.write(chunk);
            downloaded += chunk.length;
            process.stdout.write("Downloading " + (100.0 * downloaded / len).toFixed(2) + "% " + downloaded + " bytes" + isWin ? "\033[0G": "\r");
            // reset timeout
            clearTimeout( timeoutId );
            timeoutId = setTimeout( fn, timeout );
        }).on('end', function () {
            // clear timeout
            clearTimeout( timeoutId );
            file.end();
            console.log(file_name + ' downloaded to: ' + apiPath);
            callback(null);
        }).on('error', function (err) {
            // clear timeout
            clearTimeout( timeoutId );                
            callback(err.message);
        });           
    });
    
    // generate timeout handler
    var fn = timeout_wrapper( request );

    // set initial timeout
    var timeoutId = setTimeout( fn, timeout );
}
    

/**
    genOCDPackage
 */
function genOCDPackage(url, Authorization) {
    var options = {};
    options.uri = url + "/oneclickdeployer/ocdgwconfigure";
    options.method = "GET";
    
    options.headers = {
        "Authorization" : Authorization
    };
    
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            // check body : 'Please donwload [One-Click Deployer Setup Package](ocd/ocdSetupPackage.zip) to enable One-Click Deploer.'
            
            downloadOCDPackage(url + "/ocd/ocdSetupPackage.zip", './ocdSetupPackage.zip', function(ret) {
                //console.log(ret);
                if (ret == null) {  // means downlaod completed
                    console.log("ocdSetupPackage.zip is donwload completed.")
                } else {    // error
                    console.log("ocdSetupPackage.zip donwload fail.", ret);
                }
            });
            
        } else {
            
        }
    });
}

var url = 'http://localhost:1880';
var acc = 'admin';
var pwd = 'admin';

// get authentication token

var options = {};
options.uri = url + "/auth/login";
options.method = "GET";

request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(typeof body);
        console.log(body);
        if (body == "{}") {
            console.log("No Auth")
        } else {
            console.log("Need Auth")
            options.uri = url + "/auth/token";
            options.method = "POST";
            options.headers = {
                'Content-Type': 'application/json'
            };
            options.json = {
                "client_id" : "node-red-admin",
                "grant_type" : "password",
                "scope" : "*",
                "username" : acc,
                "password" : pwd
            };
            
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //console.log(body.id) // Print the shortened url.
                    //response.json({flows: "ok"});
                    //console.log(body);
                    //console.log(typeof body);
                    console.log(body.token_type);
                    console.log(body.access_token);
                    var Authorization = body.token_type + ' ' + body.access_token;
                    console.log(Authorization);
                    
                    // gen OCD package
                    genOCDPackage(url, Authorization);
                    
                    
                    
                    
                } else {
                    log.error("ERROR:" + error + " statusCode:" + response.statusCode);
                    response.json({msg: "Send ISCD Errror",
                            error: error, 
                            statusCode : response.statusCode});
                }
            });
        }
    } else {
    }
})

return





var options = {
//     uri: 'http://localhost:1880/auth/token',
     uri: 'https://nexhyperocdwebapp999.azurewebsites.net/auth/token',
     headers: {
         'Content-Type': 'application/json'
     },                        
     method: 'POST',
     json: {
         "client_id" : "node-red-admin",
        "grant_type" : "password",
        "scope" : "*",
        "username" : "admin",
        "password" : "admin"
     }//,
     //timeout: 10000 (reserve for later modify)
};
 
request(options, function (error, response, body)
{
    if (!error && response.statusCode == 200) 
    {
        //console.log(body.id) // Print the shortened url.
        //response.json({flows: "ok"});
        console.log(body);
    }
    else
    {
        log.error("ERROR:" + error + " statusCode:" + response.statusCode);
        response.json({msg: "Send ISCD Errror",
                  error: error, 
                  statusCode : response.statusCode});
    }
});
 