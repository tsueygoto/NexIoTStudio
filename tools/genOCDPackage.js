/**
 
 */
var path = require('path');
var request = require('request');

// global variable
var uri, acc, pwd = '';

/**
 *
 */
function noderedAuthentication(host, cb)
{
    var options = {};
    options.uri = host + (host.slice(-1) == '/' ? "auth/login" : "/auth/login");
    options.method = "GET";
    options.rejectUnauthorized = false;

    request(options, function (error, response, body) {
        //console.log(response);
        
        if (!error && response.statusCode == 200) {
            if (body == "{}") {
                console.log("No Auth")
                cb();
            } else {
                console.log("Need Auth")
                options.uri = host + (host.slice(-1) == '/' ? "auth/token" : "/auth/token");
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
                        console.log(body);
                        console.log(typeof body);
                        console.log(body.access_token);
                        console.log(body.token_type);
                        cb(body.token_type+" "+body.access_token)
                    } else {
                        console.log("ERROR:" + error + " statusCode:" + response.statusCode);
                        //response.json({msg: "Get Auth Token Errror",
                        //        error: error, 
                        //        statusCode : response.statusCode});
                    }
                });
            }
        } else {
            console.log("Get Auth Login Errror [%s][%s]", error, response.statusCode);
            //response.json({msg: "Get Auth Login Errror",
            //        error: error, 
            //        statusCode : response.statusCode});
        }
    });
}

/**
    main
 */
 
// process parameters
var argv = process.argv;
if ((argv.length != 5)) {
    console.log("\nUsage:\n   node %s {[in]uri} {[in]account} {[in]password}\n", path.basename(argv[1]));
    console.log("   [in]uri      : The IoT Studio URI. Ex: https://10.13.1.39:1443/iotStudio");
    console.log("   [in]account  : The IoT Studio Account.");
    console.log("   [in]password : The IoT Studio Password.");
    return;
}

var uri = argv[2];
var acc = argv[3];
var pwd = argv[4];

noderedAuthentication( uri, // ex: 'https://10.13.1.39:1443/iotStudio'
    function(authorization) {
            console.log(authorization);
            var options = {
                uri: uri + (uri.slice(-1) == '/' ? 'oneclickdeployer/ocdgwconfigure' : '/oneclickdeployer/ocdgwconfigure'),
                headers: {
                //    'Node-RED-API-Version': 'v2',
                //    'Node-RED-Deployment-Type': 'full'
                },                        
                method: 'GET'
                //json: {
                //    gwId : settings.ocdCurConf.deviceId,
                //    flowData : iscd_flows,
                //    dashboardData : dashboardConf
                //}//,
                //timeout: 10000 (reserve for later modify)
            };
                
            if (authorization != undefined) {
                options.headers.Authorization = authorization;
            }
            
            //log.info("POST option : \n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n" + JSON.stringify(options, null, 2) + "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
            options.rejectUnauthorized = false;

            //log.info("send to ISCD URI : " + options.uri);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //console.log(body.id) // Print the shortened url.
                    console.log("Update ISCD Flows OK !!!");
                    //newConfig = arrOthers.concat(arrIoTDatasource);
                    //redNodes.setFlows(newConfig, 'full').then(function(flowId)
                    //{
                    //    log.info("setFlows completed!");
                    //    log.info("flowId : " + flowId);
                    //    log.info("body : " + JSON.stringify(body, null, 2));
                    //    res.json({flows: newConfig,
                    //        rev: flowId,
                    //        deploy: body});
                    //});
                    //res.json("OK");
                } else {
                    console.log("ERROR: %d  statusCode: %d  body : %s" , error, response.statusCode, body);
                    //res.json({msg: "Send ISCD Errror",
                    //        error: error, 
                    //        statusCode : response.statusCode});
                }
            });
        });