
var request = require('request');


var options = {};
options.uri = "http://localhost:1880/auth/login";
options.method = "GET";

request(options, function (error, response, body)
{
    if (!error && response.statusCode == 200) {
        console.log(typeof body);
        console.log(body);
        if (body == "{}") {
            console.log("No Auth")
        } else {
            console.log("Need Auth")
            options.uri = "http://localhost:1880/auth/token";
            options.method = "POST";
            options.headers = {
                'Content-Type': 'application/json'
            };
            options.json = {
                "client_id" : "node-red-admin",
                "grant_type" : "password",
                "scope" : "*",
                "username" : "admin",
                "password" : "admin"
            };
            
            request(options, function (error, response, body)
            {
                if (!error && response.statusCode == 200) 
                {
                    //console.log(body.id) // Print the shortened url.
                    //response.json({flows: "ok"});
                    console.log(body);
                    console.log(typeof body);
                    console.log(body.access_token);
                    console.log(body.token_type);
                    
                }
                else
                {
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
 