/**
 *
 */
var path = require('path');

var ocdConfPath = path.join(__dirname, '..', '.node-red', 'OCD', 'config.json');
var ocdConf = require(ocdConfPath);
var iscd_flowsPath = path.join(__dirname, '..', '.node-red', 'flows', ocdConf.deviceId, 'iscd_config.json');
var iscd_flows = require(iscd_flowsPath);
var dashboardConfPath = path.join(__dirname, '..', '.node-red', '.dash', 'config_default.json');
var dashboardConf = require(dashboardConfPath);

/**
 * send to ISCD & setflows
 */
var options = {
    uri: 'http://'+ ocdConf.iscdUrl + '/oneclickdeployer/ocd_deploy',
    method: 'POST',
    json: {
        gwId : ocdConf.deviceId,
        flowData : iscd_flows,
        dashboardData : dashboardConf.dashboards
    }//,
    //timeout: 10000 (reserve for later modify)
};

console.info("POST option : \n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n",
    options,
    "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

var request = require('request');
console.info("send to ISCD : ", options.uri);
request(options, function (error, response, body)
{
    //console.info("error:", error);
    //console.info("response:", response.statusCode);
    if (!error && response.statusCode == 200) {
        //console.log(body.id) // Print the shortened url.
        console.info("Update Flows OK !!!");
    }
    //redNodes.setFlows(newConfig, 'full').then(function(flowId) {
    //    console.log("flowId : " + flowId);
    //    res.json({flows: newConfig,
    //              rev: flowId,
    //              deploy: response.statusCode});
    //});
});
                    