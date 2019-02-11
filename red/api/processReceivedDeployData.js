var path = require('path');
var fs = require('fs');
const { settings, doRenameFile, redNodes } = require("./oneclickdeployer");
/**
 * processReceivedDeployData
 *
 * Depends:
 *
 * @param {*} objData
 *   objData: {
 *       flow: flowsContent,
 *       flowcred: flowsCredContent,
 *       dashboard: dashboardContent,
 *       images: oRet    // {fileName1: content, fileName2: content, ...}
 *   }
 * @param {*} cb : callback entry
 */
function processReceivedDeployData(objData, cb) {
    try {
        // process flow
        var flowsFile = path.join(settings.userDir, 'flows', 'flows-ISCD.json');
        if (fs.existsSync(flowsFile)) {
            doRenameFile(flowsFile);
        }
        fs.writeFileSync(flowsFile, JSON.stringify(objData.flow, null, 4));
        // process flow
        var flowsCredFile = path.join(settings.userDir, 'flows-ISCD_cred.json');
        if (fs.existsSync(flowsCredFile)) {
            doRenameFile(flowsCredFile);
        }
        fs.writeFileSync(flowsCredFile, JSON.stringify(objData.flowcred, null, 4));
        // process dahboard
        var dashboardFile = path.join(settings.userDir, '.dash', 'config_default.json');
        if (fs.existsSync(dashboardFile)) {
            doRenameFile(dashboardFile);
        }
        fs.writeFileSync(dashboardFile, JSON.stringify(objData.dashboard, null, 4));
        // process images
        var dashboardImagesFolder = path.join(settings.userDir, '..', 'nodes', 'dashboard', 'static', 'images');
        var imgs = Object.keys(objData.images);
        for (var idx = 0; idx < imgs.length; idx++) {
            var img_content = Buffer.from(objData.images[imgs[idx]]);
            // console.log(img_content);
            fs.writeFileSync(path.join(dashboardImagesFolder, imgs[idx]), img_content);
        }
        //        redNodes.setFlows(objData.flow, 'full').then(function(flowId) {
        redNodes.loadFlows().then(function (flowId) {
            //var result = {
            //    updateFlowConf : newFlowConfig,
            //    updateDashboardConf : newDashboardConfig
            //};
            //res.json("ocd_deploy ok newFlowConfig !!!");
            // res.json("remote deploy reload !!!");
            cb();
        }).otherwise(function (err) {
            //log.warn(log._("api.flows.error-save",{message:err.message}));
            //log.warn(err.stack);
            //res.status(500).json({error:"unexpected_error", message:err.message});
            cb(err);
        });
        //fnstop().then(function(){
        //    fnStart().then(function(){
        //        cb();
        //    })
        //});
    }
    catch (e) {
        cb(e);
    }
}
exports.processReceivedDeployData = processReceivedDeployData;