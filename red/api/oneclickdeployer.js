/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * One-Click Deployer
 *  
 *
 *
 **/

var path        = require('path');
var fs          = require('fs');
var when        = require('when');
var crypto      = require('crypto');
var iothub      = require('azure-iothub');
var clone       = require("clone");
var request     = require('request').defaults({ rejectUnauthorized: false });
var redUtil     = require("../runtime/util");
var flowUtil    = require("../runtime/nodes/flows/util");
var credentials = require("../runtime/nodes/credentials");
var security    = require("../runtime/security");
var ui          = require("./ui");

/***
    global variable
 */
 
var log;
var fnStop;
var fnStart;
var redNodes;
var settings;
var ocdConf = null;
var arrDeviceInfo = [];
var goRemote = {
    acc: "admin",
    pwd: "admin"
};

/***
    function
 */

 

/**
    verifyBuildFolder
    
 */
function verifyBuildFolder(folder) {
    try {
        var arrPath = folder.split(path.sep);
        //console.log(arrPath);
        var targetPath = (arrPath[0] == '') ? path.sep : arrPath[0];
        for(var i=1; i<arrPath.length; i++) {
            targetPath = path.join(targetPath, arrPath[i]);
            // if target path is not exist then to create it.
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath);
            }
        }
        return {code:0, msg:null}
    } catch (e) {
        return {code:1, msg:JSON.stringify(e)}
    }
}

/**
 * The regitry IoT Device will find out this deviceId is exist or not !!!
 */
function regDevice(arrDevices, idxArr, cb) {
    if (idxArr >= arrDevices.length) {
        log.info("Finish Device Registry !!!");
        cb();
        return;
    } else {
        var device = {
            //deviceId : arrDevices[idxArr]   // nodeId
            deviceId : arrDevices[idxArr].id   // nodeId
        };
        if(!arrDevices[idxArr].hasOwnProperty('protocol')) {
            arrDevices[idxArr].protocol = 'amqp';
        }
        
        var connectionString = settings.ocdCurConf.connectionString;
        log.info("[Dashboard][regDevice] IoT Hub CS: " + connectionString);

        var hostname = iothub.ConnectionString.parse(connectionString).HostName;
        var registry = iothub.Registry.fromConnectionString(connectionString);
        //
        registry.create(device, function(err, deviceInfo, resp) {
            if (err)    // means IoT Device ID is exist
            {   // get IoT Device Info
                registry.get(device.deviceId, function(err, deviceInfo, resp)
                {
                    if(deviceInfo) {
                        log.info("Device Info : \n<<<\n" + JSON.stringify(deviceInfo, null, 2) + "\n>>>");
                        var devCS = genConnectionString(hostname, deviceInfo);
                        //redNodes.addCredentials(device.deviceId, {connectionstring: devCS});
                        if (redNodes.getCredentials(device.deviceId) == undefined) {
                            arrDevices[idxArr]["credentials"] = {"connectionstring" : devCS};
                        }                        
                        arrDevices[idxArr].cloudReady = true;
                        regDevice(arrDevices, (idxArr+1), cb);
                    }
                });
            }
            else if (deviceInfo)    // means new IoT Device Created success
            {
                var devCS = genConnectionString(hostname, deviceInfo);
                var devInfo = {
                        deviceId : deviceInfo.deviceId,
                        deviceCS : devCS
                };
                arrDeviceInfo.push(devInfo);
                log.info("Device Created : " + JSON.stringify(devInfo, null, 2));
                //redNodes.addCredentials(device.deviceId, {connectionstring: devCS});
                arrDevices[idxArr]["credentials"] = {"connectionstring" : devCS};
                arrDevices[idxArr].cloudReady = true;
                regDevice(arrDevices, (idxArr+1), cb);
            }
        });
    }
}

/**
 TBD: to generate a self folder for unzip
 */
function zipFolder(srcFolder, zipFilePath, callback) {
    var archiver = require('archiver');
    // first to check target file exist then delete then create
    if (fs.existsSync(zipFilePath)) {
        fs.unlinkSync(zipFilePath);
    }
    
    var output = fs.createWriteStream(zipFilePath);
    var zipArchive = archiver('zip',{
        zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', function() {
        callback();
    });

    zipArchive.pipe(output);

    //zipArchive.bulk([
    //    { cwd: srcFolder, src: ['**/*'], dot: true, expand: true }
    //]);
    
    // append a file
    /**
     * The auto deploy needs cloud info
        file        : ocds-setup.bat
        file        : cloudConfigure.ps1
        [removed]directory   : azure-profile
     */
    zipArchive.file(path.join(srcFolder,'..','azurePackage','ocds-setup.bat'),
        {name: 'ocds-setup.bat' });
    zipArchive.file(path.join(srcFolder,'..','azurePackage','cloudConfigure.ps1'),
        {name: 'cloudConfigure.ps1' });
    // append files from a sub-directory and naming it `new-subdir` within the archive
    //zipArchive.directory(path.join(srcFolder,'..','azurePackage','azure-profile'), 'azure-profile');
    
    /**
     * The auto deploy needs GW Info
        file        : gw.conf
     */
    zipArchive.file(path.join(srcFolder, 'OCD', 'One-ClickDeployerSetupPackage','gw.conf'),
        {name: 'gw.conf' });

        /**
     * The IoT Studio Cloud Dashboard Package
        DIRECTORY
            red
            public
                icons
                red
                vendor
            nodes
                core
                    analysis
                    core
                    io
                    locales
                    logic
                    parsers
                    storage
                dashboard
                googleSheets
                node-red-contrib-azure-iot-hub
            .node-red
                .dash
//                    .[GW folder]
                    settings_default.json
                    user_conf.json
                .flows
//                    .[GW folder]
//                    flows-ISCD.json   
            ISCD
                package.json
                settings.js
        FILE
            public/favicon.ico
            editor/templates/index.mst
            .gitignore
            .jshintrc
            .nodemonignore
            .travis.yml
            CHANGELOG.md
            CODE_OF_CONDUCT.md
            CONTRIBUTING.md
            README.md
            LICENSE
            IoT-Studio.js
            package.json
            red.js
            settings.js
     */
    
    zipArchive.directory(path.join(srcFolder,'..','red'), path.join('IoT-Studio-Cloud-Dashboard','red'));
    //zipArchive.directory(path.join(srcFolder,'/../public/'), 'IoT-Studio-Cloud-Dashboard/public');

    //zipArchive.directory(path.join(srcFolder,'..','nodes'), path.join('IoT-Studio-Cloud-Dashboard','nodes'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','analysis'),   path.join('IoT-Studio-Cloud-Dashboard','nodes','core','analysis'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','core'),       path.join('IoT-Studio-Cloud-Dashboard','nodes','core','core'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','io'),         path.join('IoT-Studio-Cloud-Dashboard','nodes','core','io'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','locales'),    path.join('IoT-Studio-Cloud-Dashboard','nodes','core','locales'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','logic'),      path.join('IoT-Studio-Cloud-Dashboard','nodes','core','logic'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','parsers'),    path.join('IoT-Studio-Cloud-Dashboard','nodes','core','parsers'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','storage'),    path.join('IoT-Studio-Cloud-Dashboard','nodes','core','storage'));
    
    zipArchive.directory(path.join(srcFolder,'..','nodes','dashboard'), path.join('IoT-Studio-Cloud-Dashboard','nodes','dashboard'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','googleSheets'), path.join('IoT-Studio-Cloud-Dashboard','nodes','googleSheets'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','node-red-contrib-azure-iot-hub'), path.join('IoT-Studio-Cloud-Dashboard','nodes','node-red-contrib-azure-iot-hub'));
    
    zipArchive.file(path.join(srcFolder,'..','public','favicon.ico'), { name: path.join('IoT-Studio-Cloud-Dashboard','public','favicon.ico')});    
    
    zipArchive.directory(path.join(srcFolder,'..','public','icons'),    path.join('IoT-Studio-Cloud-Dashboard','public','icons'));
    zipArchive.directory(path.join(srcFolder,'..','public','red'),      path.join('IoT-Studio-Cloud-Dashboard','public','red'));
    zipArchive.directory(path.join(srcFolder,'..','public','vendor'),   path.join('IoT-Studio-Cloud-Dashboard','public','vendor'));
    
    zipArchive.directory(path.join(srcFolder,'..','tools'),   path.join('IoT-Studio-Cloud-Dashboard','tools'));
    
    zipArchive.directory(path.join(srcFolder,'..','.private'),   path.join('IoT-Studio-Cloud-Dashboard','.private'));

    // create .node-red folder
    zipArchive.append(' ', {name: path.join('IoT-Studio-Cloud-Dashboard','editor','.placehold')});
    zipArchive.file(path.join(srcFolder,'..','editor','templates','index.mst'), { name: path.join('IoT-Studio-Cloud-Dashboard','editor','templates','index.mst')});    
    
    zipArchive.file(path.join(srcFolder,'..','.gitignore'),         { name: path.join('IoT-Studio-Cloud-Dashboard','.gitignore')});
    zipArchive.file(path.join(srcFolder,'..','.jshintrc'),          { name: path.join('IoT-Studio-Cloud-Dashboard','.jshintrc')});
    zipArchive.file(path.join(srcFolder,'..','.nodemonignore'),     { name: path.join('IoT-Studio-Cloud-Dashboard','.nodemonignore')});
    zipArchive.file(path.join(srcFolder,'..','.travis.yml'),        { name: path.join('IoT-Studio-Cloud-Dashboard','.travis.yml')});
    zipArchive.file(path.join(srcFolder,'..','CHANGELOG.md'),       { name: path.join('IoT-Studio-Cloud-Dashboard','CHANGELOG.md')});
    zipArchive.file(path.join(srcFolder,'..','CODE_OF_CONDUCT.md'), { name: path.join('IoT-Studio-Cloud-Dashboard','CODE_OF_CONDUCT.md')});
    zipArchive.file(path.join(srcFolder,'..','CONTRIBUTING.md'),    { name: path.join('IoT-Studio-Cloud-Dashboard','CONTRIBUTING.md')});
    zipArchive.file(path.join(srcFolder,'..','IoT-Studio.js'),      { name: path.join('IoT-Studio-Cloud-Dashboard','IoT-Studio.js')});
    zipArchive.file(path.join(srcFolder,'..','LICENSE'),            { name: path.join('IoT-Studio-Cloud-Dashboard','LICENSE')});
    zipArchive.file(path.join(srcFolder,'..','README.md'),          { name: path.join('IoT-Studio-Cloud-Dashboard','README.md')});
    zipArchive.file(path.join(srcFolder,'..','red.js'),             { name: path.join('IoT-Studio-Cloud-Dashboard','red.js')});

    // ISCD package.json & settings.js
    zipArchive.file(path.join(srcFolder,'..','ISCD','package.json'),{name: path.join('IoT-Studio-Cloud-Dashboard','package.json')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','settings.js'), {name: path.join('IoT-Studio-Cloud-Dashboard','settings.js')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','.deployment'), { name: path.join('IoT-Studio-Cloud-Dashboard','.deployment')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','deploy.cmd'),  { name: path.join('IoT-Studio-Cloud-Dashboard','deploy.cmd')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','iisnode.yml'), { name: path.join('IoT-Studio-Cloud-Dashboard','iisnode.yml')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','web.config'),  { name: path.join('IoT-Studio-Cloud-Dashboard','web.config')});
    
    // create .node-red folder
    zipArchive.append(' ', {name: path.join('IoT-Studio-Cloud-Dashboard','.node-red','.placehold')});
    
    // process .node-red/flows folder
    //zipArchive.file(path.join(srcFolder,'/flows/flows-ISCD.json'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/flows/flows-ISCD.json'});
    zipArchive.append(' ', {name: path.join('IoT-Studio-Cloud-Dashboard','.node-red','flows','.placehold')});

    // create GW folder
    //zipArchive.file(path.join(srcFolder, '/flows/', settings.ocdCurConf.deviceId, '.placehold'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/flows/'+settings.ocdCurConf.deviceId+'/.placehold'});

    // process .node-red/.dash folder
    zipArchive.file(path.join(srcFolder,'..','azurePackage','settings_default.json'),{name: path.join('IoT-Studio-Cloud-Dashboard','.node-red','.dash','settings_default.json')});
    zipArchive.file(path.join(srcFolder,'.dash','user_conf.json'),       {name: path.join('IoT-Studio-Cloud-Dashboard','.node-red','.dash','user_conf.json')});
    
    //zipArchive.file(path.join(srcFolder, '/.dash/', settings.ocdCurConf.deviceId, '.placehold'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/.dash/'+settings.ocdCurConf.deviceId+'/.placehold'});

    var filepath = path.join(srcFolder,'..','azurePackage','.ocdkey');
    var fname = security.decode(filepath);
    zipArchive.file(fname,       {name: path.join('IoT-Studio-Cloud-Dashboard','red','runtime','.publickey')});
    
    filepath = path.join(srcFolder,'sn.json');
    // console.log("sn.json path %s", filepath);
    if (fs.existsSync(filepath)) {
        zipArchive.file(filepath,       {name: path.join('IoT-Studio-Cloud-Dashboard','.node-red','sn.json')});
    }
    
    filepath = path.join(srcFolder,'..','.licenseRule');
    if (fs.existsSync(filepath)) {
        zipArchive.file(filepath,       {name: path.join('IoT-Studio-Cloud-Dashboard','.licenseRule')});
    }
    
    zipArchive.finalize(function(err, bytes) {
        // remove the template file
        fs.unlink(fname);
        if(err) {
            callback(err);
        }
    });
}

/**
 TBD: to generate a self folder for unzip
 */
function zipFolder2(srcFolder, zipFilePath, callback, cbProgress) {
    var archiver = require('archiver');
    // first to check target file exist then delete then create
    if (fs.existsSync(zipFilePath)) {
        fs.unlinkSync(zipFilePath);
    }
    
    var output = fs.createWriteStream(zipFilePath);
    var zipArchive = archiver('zip',{
        zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', function() {
        callback();
    });

    zipArchive.pipe(output);

    zipArchive.on('progress', function(data) {
        cbProgress(data);
    });
    
    //zipArchive.bulk([
    //    { cwd: srcFolder, src: ['**/*'], dot: true, expand: true }
    //]);
    
    // append a file
    /**
     * The auto deploy needs cloud info
        file        : ocds-setup.bat
        file        : cloudConfigure.ps1
        [removed]directory   : azure-profile
     */
    //zipArchive.file(path.join(srcFolder,'..','azurePackage','ocds-setup.bat'),
    //    {name: 'ocds-setup.bat' });
    //zipArchive.file(path.join(srcFolder,'..','azurePackage','cloudConfigure.ps1'),
    //    {name: 'cloudConfigure.ps1' });
    // append files from a sub-directory and naming it `new-subdir` within the archive
    //zipArchive.directory(path.join(srcFolder,'..','azurePackage','azure-profile'), 'azure-profile');
    
    /**
     * The auto deploy needs GW Info
        file        : gw.conf
     */
    //zipArchive.file(path.join(srcFolder, 'OCD', 'One-ClickDeployerSetupPackage','gw.conf'),
    //    {name: 'gw.conf' });

        /**
     * The IoT Studio Cloud Dashboard Package
        DIRECTORY
            red
            public
                icons
                red
                vendor
            nodes
                core
                    analysis
                    core
                    io
                    locales
                    logic
                    parsers
                    storage
                dashboard
                googleSheets
                node-red-contrib-azure-iot-hub
            .node-red
                .dash
//                    .[GW folder]
                    settings_default.json
                    user_conf.json
                .flows
//                    .[GW folder]
//                    flows-ISCD.json   
            ISCD
                package.json
                settings.js
        FILE
            public/favicon.ico
            editor/templates/index.mst
            .gitignore
            .jshintrc
            .nodemonignore
            .travis.yml
            CHANGELOG.md
            CODE_OF_CONDUCT.md
            CONTRIBUTING.md
            README.md
            LICENSE
            IoT-Studio.js
            package.json
            red.js
            settings.js
     */
     
    zipArchive.directory(path.join(srcFolder,'..','red'), 'red');
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','analysis'),   path.join('nodes','core','analysis'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','core'),       path.join('nodes','core','core'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','io'),         path.join('nodes','core','io'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','locales'),    path.join('nodes','core','locales'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','logic'),      path.join('nodes','core','logic'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','parsers'),    path.join('nodes','core','parsers'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','core','storage'),    path.join('nodes','core','storage'));
    
    zipArchive.directory(path.join(srcFolder,'..','nodes','dashboard'), path.join('nodes','dashboard'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','googleSheets'), path.join('nodes','googleSheets'));
    zipArchive.directory(path.join(srcFolder,'..','nodes','node-red-contrib-azure-iot-hub'), path.join('nodes','node-red-contrib-azure-iot-hub'));
    
    zipArchive.file(path.join(srcFolder,'..','public','favicon.ico'), { name: path.join('public','favicon.ico')});
    
    zipArchive.directory(path.join(srcFolder,'..','public','icons'),    path.join('public','icons'));
    zipArchive.directory(path.join(srcFolder,'..','public','red'),      path.join('public','red'));
    zipArchive.directory(path.join(srcFolder,'..','public','vendor'),   path.join('public','vendor'));
    
    zipArchive.directory(path.join(srcFolder,'..','tools'),   path.join('tools'));
    
    //zipArchive.directory(path.join(srcFolder,'..','.private'),   path.join('.private'));
    zipArchive.directory(path.join(srcFolder,'..','.private','dashboard-plugins'),   path.join('.private','dashboard-plugins'));
    zipArchive.directory(path.join(srcFolder,'..','.private','node-red-contrib-azure-iot-hub'),   path.join('.private','node-red-contrib-azure-iot-hub'));
    zipArchive.directory(path.join(srcFolder,'..','.private','node-red-contrib-nexnode-dp'),   path.join('.private','node-red-contrib-nexnode-dp'));

    // create .node-red folder
    zipArchive.append(' ', {name: path.join('editor','.placehold')});
    zipArchive.file(path.join(srcFolder,'..','editor','templates','index.mst'), { name: path.join('editor','templates','index.mst')});    
    
    zipArchive.file(path.join(srcFolder,'..','.gitignore'),         { name: path.join('.gitignore')});
    zipArchive.file(path.join(srcFolder,'..','.jshintrc'),          { name: path.join('.jshintrc')});
    zipArchive.file(path.join(srcFolder,'..','.nodemonignore'),     { name: path.join('.nodemonignore')});
    zipArchive.file(path.join(srcFolder,'..','.travis.yml'),        { name: path.join('.travis.yml')});
    zipArchive.file(path.join(srcFolder,'..','CHANGELOG.md'),       { name: path.join('CHANGELOG.md')});
    zipArchive.file(path.join(srcFolder,'..','CODE_OF_CONDUCT.md'), { name: path.join('CODE_OF_CONDUCT.md')});
    zipArchive.file(path.join(srcFolder,'..','CONTRIBUTING.md'),    { name: path.join('CONTRIBUTING.md')});
    zipArchive.file(path.join(srcFolder,'..','IoT-Studio.js'),      { name: path.join('IoT-Studio.js')});
    zipArchive.file(path.join(srcFolder,'..','LICENSE'),            { name: path.join('LICENSE')});
    zipArchive.file(path.join(srcFolder,'..','README.md'),          { name: path.join('README.md')});
    zipArchive.file(path.join(srcFolder,'..','red.js'),             { name: path.join('red.js')});

    // ISCD package.json & settings.js
    zipArchive.file(path.join(srcFolder,'..','ISCD','package.json'),{name: path.join('package.json')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','settings.js'), {name: path.join('settings.js')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','.deployment'), { name: path.join('.deployment')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','deploy.cmd'),  { name: path.join('deploy.cmd')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','iisnode.yml'), { name: path.join('iisnode.yml')});
    zipArchive.file(path.join(srcFolder,'..','ISCD','web.config'),  { name: path.join('web.config')});
    
    // create .node-red folder
    zipArchive.append(' ', {name: path.join('.node-red','.placehold')});
    
    // process .node-red/flows folder
    //zipArchive.file(path.join(srcFolder,'/flows/flows-ISCD.json'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/flows/flows-ISCD.json'});
    zipArchive.append(' ', {name: path.join('.node-red','flows','.placehold')});

    // create GW folder
    //zipArchive.file(path.join(srcFolder, '/flows/', settings.ocdCurConf.deviceId, '.placehold'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/flows/'+settings.ocdCurConf.deviceId+'/.placehold'});

    // process .node-red/.dash folder
    zipArchive.file(path.join(srcFolder,'..','azurePackage','settings_default.json'),{name: path.join('.node-red','.dash','settings_default.json')});
    zipArchive.file(path.join(srcFolder,'.dash','user_conf.json'),       {name: path.join('.node-red','.dash','user_conf.json')});
    
    //zipArchive.file(path.join(srcFolder, '/.dash/', settings.ocdCurConf.deviceId, '.placehold'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/.dash/'+settings.ocdCurConf.deviceId+'/.placehold'});

    var filepath = path.join(srcFolder,'..','azurePackage','.ocdkey');
    var fname = security.decode(filepath);
    zipArchive.file(fname,       {name: path.join('red','runtime','.publickey')});
    
    filepath = path.join(srcFolder,'sn.json');
    // console.log("sn.json path %s", filepath);
    if (fs.existsSync(filepath)) {
        zipArchive.file(filepath,       {name: path.join('.node-red','sn.json')});
    }
    
    filepath = path.join(srcFolder,'..','.licenseRule');
    if (fs.existsSync(filepath)) {
        zipArchive.file(filepath,       {name: path.join('.licenseRule')});
    }
    
    zipArchive.finalize(function(err, bytes) {
        // remove the template file
        fs.unlink(fname);
        if(err) {
            callback(err);
        }
    });
}

/**
 *
 */
//function genGWISCDFlow(arrDeviceInfo)
//{
//    // create ISD Flows
//    var isd_flows = [];
//    // create a tab node
//    var isd_tabNode = {
//        "id": redUtil.generateId(),
//        "type": "tab",
//        "label": "Flow 1"
//    };
//    isd_flows.push(isd_tabNode);
//    // create a iot event hub node
//    var isd_ioteventhubNode = {
//        "id": redUtil.generateId(),
//        "type":"azureioteventhub",
//        "z": isd_tabNode.id,
//        "name":"Azure IoT Event Hub",
//        "credentials":{"connectionstring":settings.ocdCurConf.connectionString,
////"HTHub002.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=Vk7gO6fsVdkyt7m2Om60rRa6HRMIrjnTjyBKKL7Kj18="},
//        "x":240,"y":100,"wires":[[]]};
//    // create a switch for DS
//    var isd_switchNode = {
//        "id": redUtil.generateId(),
//        "type": "switch",
//        "z": isd_tabNode.id,
//        "name": "",
//        "property": "deviceId",
//        "propertyType": "msg",
//        "rules": [],
//        //    {
//        //        "t": "eq",
//        //        "v": "id1",
//        //        "vt": "str"
//        //    },
//        //    {
//        //        "t": "eq",
//        //        "v": "id2",
//        //        "vt": "str"
//        //    },
//        //    {
//        //        "t": "eq",
//        //        "v": "id3",
//        //        "vt": "str"
//        //    }
//        //],
//        "checkall": "true",
//        "outputs": 3,
//        "x": 350,
//        "y": 100,
//        "wires": [[]]
//        //    [
//        //        "108ffd07.8a2653"
//        //    ],
//        //    [
//        //        "12b1d01d.bbf2d"
//        //    ],
//        //    []
//        //]
//    };
//    isd_ioteventhubNode.wires[0].push(isd_switchNode.id);
//    isd_flows.push(isd_ioteventhubNode);
//    
//    // create iot-datasource
//    if (arrDeviceInfo.length > 0) {
//        isd_switchNode.wires = [];
//        for(var ii=0; ii < arrDeviceInfo.length; ii++)
//        {
//            var deviceInfo = arrDeviceInfo[ii];
//            var iot_datasorceNode = clone(activeFlowsConf.allNodes[deviceInfo.deviceId]);
//            iot_datasorceNode.z = isd_tabNode.id;
//            isd_switchNode.rules.push({
//                "t": "eq",
//                "v": iot_datasorceNode.id,
//                "vt": "str"
//                });
//            isd_switchNode.wires.push([iot_datasorceNode.id]);
//            if (iot_datasorceNode.wires[0].length > 0)
//            {
//                // create a C2D 
//                var azure_C2DNode = {
//                    "id": redUtil.generateId(),
//                    "type": "azureiothubsend",
//                    "z": isd_tabNode.id,
//                    "name": "Azure IoT Hub Send (C2D)",
//                    "credentials":{"connectionstring": deviceInfo.deviceCS},
//                    "x": 740,
//                    "y": 80,
//                    "wires": [
//                        []
//                    ]
//                };
//                isd_flows.push(azure_C2DNode);
//                iot_datasorceNode.wires[0] = [azure_C2DNode.id];
//            }
//            console.log(iot_datasorceNode);
//            isd_flows.push(iot_datasorceNode);
//        }
//        isd_switchNode.outputs = arrDeviceInfo.length;                        
//    }
//
//    isd_flows.push(isd_switchNode);
//    
//    fs.writeFileSync(ocdConfFile.substring(0, ocdConfFile.lastIndexOf('\\')+1) + "isd_config.json",
//    JSON.stringify(isd_flows, null, 4));
//}                    

/**
 * doIscdFlowsDeploy
    
    GWID            : req.body.gwId             : means the gw folder name in ISCD for flow & dashboard
    FlowData        : req.body.flowData
    DashboardData   : req.body.dashboardData
    
 */
function doIscdFlowsDeploy(req, res) {
    var gwId = req.body.gwId;
    
    //var flowsDir = path.join(settings.userDir,'flows',gwId);
    //var dashboardDir = path.join(settings.userDir,'.dash',gwId);
    
    // load gwConf in userDir
    var gwConfPath = path.join(settings.userDir, 'ocdGwConf.json');
    var allGwConf = {};
    if (fs.existsSync(gwConfPath)) {
        // load all gw conf
        //allGwConf = require(gwConfPath);
        allGwConf = JSON.parse(fs.readFileSync(gwConfPath));
    }
    // console.info(">>> allGwConf : ", allGwConf);
    
    var gwConf = {};
    // check this gw registered?
    if (allGwConf.hasOwnProperty(gwId)) {
        gwConf = allGwConf[gwId];
    } else {
        gwConf.flowDir = path.join(settings.userDir,'flows',gwId);
        gwConf.dashboardDir = path.join(settings.userDir,'.dash',gwId);
        allGwConf[gwId] = gwConf;
        
        // console.info("allGwConf : ", allGwConf);
        fs.writeFileSync(gwConfPath, JSON.stringify(allGwConf, null, 4));
        // gw registered !!!
    }
    
    if (!fs.existsSync(gwConf.flowDir)) {
        fs.mkdirSync(gwConf.flowDir);
    }
    
    fs.writeFileSync(path.join(gwConf.flowDir,'iscd_config.json'),
        JSON.stringify(req.body.flowData, null, 4));

    if (!fs.existsSync(gwConf.dashboardDir)) {
        fs.mkdirSync(gwConf.dashboardDir);
    }
    fs.writeFileSync(path.join(gwConf.dashboardDir,'iscd_config.json'),
        JSON.stringify(req.body.dashboardData, null, 4));
    
    /**
    * Do ISCD reload
    */
    // 1. load all gw flows from  userDir/flows/gwId/iscd_config.conf
    var arrGwsId = Object.keys(allGwConf);
    // console.log(arrGwsId);
    var newFlowConfig = [];
    var newDashboardConfig = [];
    for (var gwIndex=0; gwIndex < arrGwsId.length; gwIndex++) {
        var gwConf = allGwConf[arrGwsId[gwIndex]];
        // load gw flow content
        //var flowContent = require(path.join(gwConf.flowDir, 'iscd_config.json'));
        var flowContent = JSON.parse(fs.readFileSync(path.join(gwConf.flowDir, 'iscd_config.json')));
        newFlowConfig = newFlowConfig.concat(flowContent);
        
        //var dashboardContent = require(path.join(gwConf.dashboardDir, 'iscd_config.json'));
        var dashboardContent = JSON.parse(fs.readFileSync(path.join(gwConf.dashboardDir, 'iscd_config.json')));
        newDashboardConfig = newDashboardConfig.concat(dashboardContent);
        
        // console.info("newDashboardConfig : <<<", newDashboardConfig, ">>>");
    }
    // console.info("newFlowConfig : <<<", newFlowConfig, ">>>");
    // console.info("newDashboardConfig : <<<", newDashboardConfig, ">>>");

    // update dashboard content before update IoT Studio Flows
    var dashboardConfigPath = path.join(settings.userDir, '.dash', 'config_default.json');
    //if (fs.existsSync(dashboardConfigPath))
    //{
    //    // backup
    //    fs.renameSync(dashboardConfigPath, dashboardConfigPath +'.backup')
    //}
    fs.writeFileSync(dashboardConfigPath,
        JSON.stringify({"dashboards": newDashboardConfig}, null, 4));       

    
    
    
    
    
    
    //redNodes.setISCDFlows(newFlowConfig, 'full').then(function(flowId)
    redNodes.setFlows(newFlowConfig, 'full').then(function(flowId) {
        var result = {
            updateFlowConf : newFlowConfig,
            updateDashboardConf : newDashboardConfig
        };
        //res.json("ocd_deploy ok newFlowConfig !!!");
        res.json(result);
    });
}


/**
    noderedAuthentication
    
 */
function noderedAuthentication(host, cb) {
    var options = {};
    options.uri = host + "/auth/login";
    options.method = "GET";
    options.rejectUnauthorized = false;

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (body == "{}") {
                console.log("No Auth")
                cb();
            } else {
                console.log("Need Auth")
                options.uri = host + "/auth/token";
                options.method = "POST";
                options.headers = {
                    'Content-Type': 'application/json'
                };
                options.json = {
                    "client_id" : "node-red-admin",
                    "grant_type" : "password",
                    "scope" : "*",
//                    "username" : "admin",
//                    "password" :remote.acc"
                    "username" : goRemote.acc,
                    "password" : goRemote.pwd
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
                        cb(null, {msg: "Get Auth Token Errror",
                                error: error, 
                                statusCode : response.statusCode});
                    }
                });
            }
        } else {
            var status = {
                eno: (error ? error.errno : error),
                res: (response ? response.statusCode : response)
            };
            cb(null, status);
            //console.log(error);
            //console.log(response);
            //response.json({msg: "Get Auth Login Errror",
            //        error: error, 
            //        statusCode : response.statusCode});
        }
    });
}

/**
 *
 */
function prepareCloudPackage(destination, cb) {
    if (settings.cloudPackage)
    {
        var ncp = require('ncp').ncp;
        ncp.limit = 16;
        ncp(settings.cloudPackage, destination, function (err)
        {
            if (err)
            {
                return console.error(err);
            }
            //console.log('done!');
            cb();
        });
    }
}

/**
 */
function placehold(gwFolder) {
    // create a empty file ".placehold" in device folder
    var filePath = path.join(gwFolder,'.placehold');
    // console.info(" filePath > ", filePath);
    try {
        fs.statSync(filePath);
    } catch(err) {
        fs.closeSync(fs.openSync(filePath, 'w'));
    }
}


/**
 *
 */
function getGwConfigure(req)
{
    var obj = {};
    // get request IP
    var host=req.get('host').trim().split(":");
    //console.log(host);
    obj.ip = (host[0] == 'localhost') ? '127.0.0.1' : host[0];
    obj.port = host[1];
    
    // get MAC relative IP
    // setup package for download
    var os = require('os');
    var ifaces = os.networkInterfaces();
    var ifnames = Object.keys(ifaces);
    var found = false;
    for(var index=0; !found && (index < ifnames.length); index++)
    {
        var iface = ifaces[ifnames[index]];
        for(var jndex=0; !found && (jndex < iface.length); jndex++)
        {
            if ((iface[jndex].family == 'IPv4') && (iface[jndex].address == obj.ip)) {
                var now = new Date();
                now.setHours(now.getHours() + 2);
                obj.timestamp = now.getTime() / 1000;
                obj.mac = iface[jndex].mac.trim();
                found = true;
            }
        }
    }
    return obj;
}

/**
 *
 */
function ocdConfInit() {
    var obj = {};
    // set deviceId from MAC
    var deviceId = getDeviceMac();
    if ( deviceId == null ) {
        deviceId = runtime.util.generateId();;
    } else {
        deviceId = deviceId.replace(/:/g,'');
    }
    //console.info("deviceId:", deviceId);
    obj.deviceId = deviceId;
    obj.connectionString = null;
    obj.iscdUrl = null;
    
    return obj;
}

/**
 * getDeviceMac
 *  
 */
function getDeviceMac(ip)
{
    // get MAC
    var os = require('os');
    var ifaces = os.networkInterfaces();
    var ifnames = Object.keys(ifaces);
    var found = false;
    var mac = null;
    for(var index=0; !found && (index < ifnames.length); index++)
    {
        var iface = ifaces[ifnames[index]];
        for(var jndex=0; !found && (jndex < iface.length); jndex++)
        {
            if ((iface[jndex].family == 'IPv4') && (iface[jndex].internal == false)) {
                if ((ip == undefined) || (iface[jndex].address == ip)) {
                    mac = iface[jndex].mac.trim();
                    found = true;
                }
            }
        }
    }
    return mac;
}

/**
 *
 */
function printDeviceInfo(err, deviceInfo, res)
{
    if (deviceInfo) {
        //console.log(deviceInfo);
        //console.log(connectionString(deviceInfo));
        ocdConf.connectionString = genConnectionString(deviceInfo);
        //console.log('Device ID: ' + deviceInfo.deviceId);
        //console.log('Device key: ' + deviceInfo.authentication.symmetricKey.primaryKey);
    }
}

/**
 *
 */
function genConnectionString(device) {
  return 'HostName=' + hostname + ';' +
    'DeviceId=' + device.deviceId + ';' +
    'SharedAccessKey=' + device.authentication.SymmetricKey.primaryKey;
}

/**
 *
 */
function genConnectionString(hostname, device) {
  return 'HostName=' + hostname + ';' +
    'DeviceId=' + device.deviceId + ';' +
    'SharedAccessKey=' + device.authentication.SymmetricKey.primaryKey;
}

/**
    nodeAuthPost
    
    2018/07/13
    
    options:
        host:
        url: 'https://'+settings.ocdCurConf.iscdUrl
        data:
            json: {
                gwId : settings.ocdCurConf.deviceId,
                flowData : iscd_flows,
                dashboardData : dashboardConf
            }
 */
function nodeAuthPost(options, cb) {
    // process data size
    var str = JSON.stringify(options.data);
    var barr = Buffer.from(str, 'utf8');
    var outArr = [];
//    var size = 1024 * 1024; // 1M
    var size = 1024 * options.blockSize; // 1M
    // div data by 1M base size
    for(var index=0; index < barr.length; index=index+size) {
        var subarr = barr.slice(index, index+size);
        outArr.push(subarr);
    }
    
    str = null;
    barr = null;

    // Call send function for outArr
    sendMultipart(options.host, options.url, outArr, 0, cb);
}

/**
    sendPost
    
    return:
    
 */
function sendPost(obj, cb) {
    log.info("do sendPost [" + obj.host + "] " + obj.uploadData.index + "/" + obj.uploadData.length);
    // call noderedAuthentication
    noderedAuthentication(obj.host, function(authorization, status) {
        // process response status error
        if (status && status.eno) {
            cb({msg: "send POST error", error: status.eno, statusCode: status.res});
            return;
        }
        
        // set options
        var options = {
            uri: obj.host + obj.url,
            headers: {
                'Node-RED-API-Version': 'v2',
                'Node-RED-Deployment-Type': 'full'
            },                        
            method: 'POST',
            json: obj.uploadData,
            rejectUnauthorized: false
        };
            
        if (authorization != undefined) {
            options.headers.Authorization = authorization;
        }
        
        log.info("authorization:" + authorization);
        log.info("send to ISCD Options URI : " + JSON.stringify(options.uri));
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //console.log(body.id) // Print the shortened url.
                log.info("Update ISCD Flows OK !!!");
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
                var res = {
                        msg: "Send ISCD OK",
                        error: error,
                        statusCode : response.statusCode
                    };
                cb(res);
            } else {
                console.log("ERROR:", error, " statusCode:",  (response ? response.statusCode : null));
                var res = {
                        msg: "Send ISCD Errror",
                        error: error, 
                        statusCode : response ? response.statusCode : null
                    };
                        
                cb(res);
            }
        });
    });
}

/**
    sendMultipart
    
    host:
    url:
    arr: the multi data array
    index: the send data index
    cb: callback function entry
    
 */
function sendMultipart(host, url, arr, index, cb) {
    log.info("sendMultipart do index : " + index);
    if (index >= arr.length) {
        log.info("FINISH [" + index + "]");
        cb({statusCode:200, index: index, error: null});
    } else {
        sendPost(
            {
                host: host,
                url: url,
                uploadData: {index:index, length: arr.length, data: arr[index]}
            },
            function(res) {
                // process res status
                if (!res.error && (res.statusCode == 200)) {
                    sendMultipart(host, url, arr, index+1, cb);
                } else {
                    res.index = index;
                    cb(res);
                }
            });
    }
}

/**
    processReceivedData
    
 */
function processReceivedData( objData, cb ) {
    var gwId = objData.gwId;
    log.info("processReceivedData gwId : " + gwId);
//    
//    //var flowsDir = path.join(settings.userDir,'flows',gwId);
//    //var dashboardDir = path.join(settings.userDir,'.dash',gwId);
//    
    // load gwConf in userDir
    var gwConfPath = path.join(settings.userDir, 'ocdGwConf.json');
//    console.log(">>>>>>>>>> gwConfPath : ", gwConfPath);
    
    var allGwConf = {};
    if (fs.existsSync(gwConfPath)) {
        // load all gw conf
        //allGwConf = require(gwConfPath);
        allGwConf = JSON.parse(fs.readFileSync(gwConfPath));
    }
    //console.info(">>> allGwConf : ", allGwConf);
    var gwConf = {};
    // check this gw registered?
    if (allGwConf.hasOwnProperty(gwId)) {
        gwConf = allGwConf[gwId];
    } else {
        gwConf.flowDir = path.join(settings.userDir,'flows',gwId);
        gwConf.dashboardDir = path.join(settings.userDir,'.dash',gwId);
        allGwConf[gwId] = gwConf;
        
        //console.info("allGwConf : ", allGwConf);
        fs.writeFileSync(gwConfPath, JSON.stringify(allGwConf, null, 4));
        // gw registered !!!
    }
//    
    if (!fs.existsSync(gwConf.flowDir)) {
        fs.mkdirSync(gwConf.flowDir);
    }
//    
    fs.writeFileSync(path.join(gwConf.flowDir,'iscd_config.json'),
        JSON.stringify(objData.flowData, null, 4));
//
    if (!fs.existsSync(gwConf.dashboardDir)) {
        fs.mkdirSync(gwConf.dashboardDir);
    }
    fs.writeFileSync(path.join(gwConf.dashboardDir,'iscd_config.json'),
        JSON.stringify(objData.dashboardData, null, "\t"));

    // save images files list
    

    cb(allGwConf);
}

function doRenameFile(file) {
    var obj = path.parse(file);

    // check rename name
    var nameIsNotExist = false;
    var count = 1;
    do {
        var renameName = path.join(obj.dir, obj.name + '.' + count + obj.ext);
        if (fs.existsSync(renameName)) {
            count++;
        } else {
            nameIsNotExist = true;
            fs.renameSync(file, renameName);
        }
    } while ( !nameIsNotExist )
}

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
function processReceivedDeployData( objData, cb ) {
    try {
        // process flow
        var flowsFile = path.join(settings.userDir,'flows', 'flows-ISCD.json');
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
        var dashboardFile = path.join(settings.userDir,'.dash', 'config_default.json');
        if (fs.existsSync(dashboardFile)) {
            doRenameFile(dashboardFile);
        }
        fs.writeFileSync(dashboardFile, JSON.stringify(objData.dashboard, null, 4));

        // process images
        var dashboardImagesFolder = path.join(settings.userDir,'..', 'nodes', 'dashboard', 'static', 'images');
        var imgs = Object.keys(objData.images);
        for(var idx=0; idx < imgs.length; idx++) {
            var img_content = Buffer.from(objData.images[imgs[idx]]);
            // console.log(img_content);
            fs.writeFileSync(path.join(dashboardImagesFolder, imgs[idx]), img_content);
        }

//        redNodes.setFlows(objData.flow, 'full').then(function(flowId) {
        redNodes.loadFlows().then(function(flowId) {
            cb();
        }).otherwise(function(err) {
            cb(err);
        });
    } catch(e) {
        cb(e);
    }
}

/**
    doIscdFlowsDeployMultipart
    2018/07/13
    
    GWID            : req.body.gwId             : means the gw folder name in ISCD for flow & dashboard
    FlowData        : req.body.flowData
    DashboardData   : req.body.dashboardData
    
 */
var bufData = [];
function doIscdFlowsDeployMultipart(req, res) {
    log.info("doIscdFlowsDeployMultipart: " + req.body.index + "/" + req.body.length);
    if (req.body.index == 0) {   // start
        bufData = [];
    }
    bufData.push(Buffer(req.body.data));

    if ((req.body.index + 1) == req.body.length) {   // end
        log.info("process all received buf data.");
        var outStr = "";
        var cbuf = Buffer.concat(bufData);
        var obj = JSON.parse(cbuf.toString('utf8'));
        
        //fs.writeFileSync("dashboardData.json", JSON.stringify(obj.dashboardData, null, 2));
        
        processReceivedData(obj, function(allGwConf) {
            /**
                Do ISCD reload
            */
            // 1. load all gw flows from  userDir/flows/gwId/iscd_config.conf
            var arrGwsId = Object.keys(allGwConf);
            log.info("gw id : " + arrGwsId);
            var newFlowConfig = [];
            var newDashboardConfig = [];
            for (var gwIndex=0; gwIndex < arrGwsId.length; gwIndex++) {
                var gwConf = allGwConf[arrGwsId[gwIndex]];
                // load gw flow content
                //var flowContent = require(path.join(gwConf.flowDir, 'iscd_config.json'));
                var flowContent = JSON.parse(fs.readFileSync(path.join(gwConf.flowDir, 'iscd_config.json')));
                newFlowConfig = newFlowConfig.concat(flowContent);
                
                //var dashboardContent = require(path.join(gwConf.dashboardDir, 'iscd_config.json'));
                var dashboardContent = JSON.parse(fs.readFileSync(path.join(gwConf.dashboardDir, 'iscd_config.json')));
                newDashboardConfig = newDashboardConfig.concat(dashboardContent);
                
                //console.info("newDashboardConfig : <<<", newDashboardConfig, ">>>");
            }
            //console.info("newFlowConfig : <<<", newFlowConfig, ">>>");
            //console.info("newDashboardConfig : <<<", newDashboardConfig, ">>>");
        
            // update dashboard content before update IoT Studio Flows
            var dashboardConfigPath = path.join(settings.userDir, '.dash', 'config_default.json');
            //if (fs.existsSync(dashboardConfigPath))
            //{
            //    // backup
            //    fs.renameSync(dashboardConfigPath, dashboardConfigPath +'.backup')
            //}
            fs.writeFileSync(dashboardConfigPath,
                JSON.stringify({"dashboards": newDashboardConfig}, null, "\t"));       
        
            // process images file list

            
            //redNodes.setISCDFlows(newFlowConfig, 'full').then(function(flowId)
            redNodes.setFlows(newFlowConfig, 'full').then(function(flowId) {
                var result = {
                    updateFlowConf : newFlowConfig,
                    updateDashboardConf : newDashboardConfig
                };
                //res.json("ocd_deploy ok newFlowConfig !!!");
                res.json(result);
            }).otherwise(function(err) {
                log.warn(log._("api.flows.error-save",{message:err.message}));
                log.warn(err.stack);
                res.status(500).json({error:"unexpected_error", message:err.message});
            });

        });
        
    } else {
        res.json("ocd_deploy ok newFlowConfig !!!");
    }
    
}

/**
 * doRemoteDeployMultipart
 * 2018/10/15
 * 
 * Depends:
 *      global bufData
 * 
 * @param {*} req
 *      req.body.index
 *      req.body.length
 *      req.body.data
 *          data {
 *              flow: flowsContent,
 *              flowcred: flowsCredContent,
 *              dashboard: dashboardContent,
 *              images: oRet
 *          }
 * 
 * @param {*} res 
 */
function doRemoteDeployMultipart(req, res) {
    log.info("doRemoteDeployMultipart: " + req.body.index + "/" + req.body.length);
    if (req.body.index == 0) {   // start
        bufData = [];   // reset empty
    }
    // store data into buffer
    bufData.push(Buffer(req.body.data));
    if ((req.body.index + 1) == req.body.length) {   // end
        log.info("process all received buf data.");
        // var outStr = "";
        var cbuf = Buffer.concat(bufData);
        var obj = JSON.parse(cbuf.toString('utf8'));
        console.log('obj keys', Object.keys(obj));
        processReceivedDeployData(obj, function(err) {
            if (!err) {
                res.json("remote deploy reload !!!");
            } else {
                log.warn(log._("api.flows.error-save",{message:err.message}));
                log.warn(err.stack);
                res.status(500).json({error:"unexpected_error", message:err.message});
            }
        });
    } else {
        res.json("received partial data index " + req.body.index);
    }
}

/**
 * Write content to a file using UTF8 encoding.
 * This forces a fsync before completing to ensure
 * the write hits disk.
 */
function writeFile(path,content) {
    return when.promise(function(resolve,reject) {
        var stream = fs.createWriteStream(path);
        stream.on('open',function(fd) {
            stream.write(content,'utf8',function() {
                fs.fsync(fd,function(err) {
                    if (err) {
                        console.log("storage.localfilesystem.fsync-fail",{path: path, message: err.toString()});
                    }
                    stream.end(resolve);
                });
            });
        });
        stream.on('error',function(err) {
            reject(err);
        });
    });
}


function parseJSON(data) {
    if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1)
    }
    return JSON.parse(data);
}

function readFile(path,backupPath,emptyResponse,type) {
    return when.promise(function(resolve) {
        fs.readFile(path,'utf8',function(err,data) {
            if (!err) {
                if (data.length === 0) {
                    console.log("storage.localfilesystem.empty",{type:type});
                    try {
                        var backupStat = fs.statSync(backupPath);
                        if (backupStat.size === 0) {
                            // Empty flows, empty backup - return empty flow
                            return resolve(emptyResponse);
                        }
                        // Empty flows, restore backup
                        console.log("storage.localfilesystem.restore",{path:backupPath,type:type});
                        fs.copy(backupPath,path,function(backupCopyErr) {
                            if (backupCopyErr) {
                                // Restore backup failed
                                console.log("storage.localfilesystem.restore-fail",{message:backupCopyErr.toString(),type:type});
                                resolve([]);
                            } else {
                                // Loop back in to load the restored backup
                                resolve(readFile(path,backupPath,emptyResponse,type));
                            }
                        });
                        return;
                    } catch(backupStatErr) {
                        // Empty flow file, no back-up file
                        return resolve(emptyResponse);
                    }
                }
                try {
                    return resolve(parseJSON(data));
                } catch(parseErr) {
                    console.log("storage.localfilesystem.invalid",{type:type});
                    return resolve(emptyResponse);
                }
            } else {
                resolve(emptyResponse);
            }
        });
    });
}

function generateChecksum(str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex');
}

/**

 */
function getFileListCheckSum(targetFolder) {
    var ofilechecksum = {};
    fs.readdirSync(targetFolder).forEach(file => {
        // console.log(file);
        var filePath = path.join(targetFolder, file);
        var stats = fs.statSync(filePath);
        if (stats.isFile()) {
            var content=fs.readFileSync(filePath);
            var checksum = generateChecksum(content);
            //console.log(checksum);
            ofilechecksum[file] = checksum;
        }
    })
    return ofilechecksum;
}

/**
 * 
 * @param {*} cb 
 */
function compareImagesFileList(localFileList, remoteFileList, cb) {
    var diffFileList = [];
    var keys = Object.keys(localFileList);
    var lastIdx = keys.length - 1;

    keys.forEach(function(key, idx) {
        if (remoteFileList.hasOwnProperty(key)) {
            // check checksum
            if (localFileList[key] != remoteFileList[key]) {
                diffFileList.push(key);
            }
        } else {
            // not exist in remote
            diffFileList.push(key);
        }
        if (idx == lastIdx) {
            // the last one
            cb(diffFileList);
        }
    });
}

/**
 * 
 * @param {*} cb 
 */
function genImagesFileListObject(folder, arrFiles, cb) {
    var ret = {};
    var lastIdx = arrFiles.length - 1;
    if (lastIdx == -1) {    // means no diff
        cb(ret);
    } else {
        arrFiles.forEach(function(item, idx) {
            var content = fs.readFileSync(path.join(folder, item));
            ret[item] = content;
            if (idx == lastIdx) {
                cb(ret);
            }
        });
    }
}

/**
 * processImagesFileList
 * 
 *  get remote dashboard images file list and checksum for verify with local dashboard images file list.
 * 
 * @param {*} cb(err, ret) : callback
 */
function processImagesFileList(url, cb) {
    // get images file list and checksum from remote
    // check authenticate needs
    // noderedAuthentication('https://'+settings.ocdCurConf.iscdUrl, function(authorization) {

    console.log("url", url);

    noderedAuthentication(url, function(authorization) {
        console.log("authorization", authorization)
        var options = {
            // uri: 'https://'+settings.ocdCurConf.iscdUrl+'/oneclickdeployer/imagesFileListCheckSum',
            uri: url + '/oneclickdeployer/imagesFileListCheckSum',
            headers: {
                'Content-Type': 'application/json'
            },                        
            method: 'GET',
            rejectUnauthorized: false
        };
    
        if (authorization != undefined) {
            options.headers.Authorization = authorization;
        }

        // get local images file list
        var olocalImagesFileListChecksum = {};
        var dashboard_images_folder = path.join(__dirname, '..', '..', 'nodes', 'dashboard', 'static', 'images');
        var loc_dashboard_images_folder = path.join(__dirname, '..', '..', 'nodes', 'dashboard', 'static', 'images_loc');

        try {
            // process target folder
            var olocalImagesFileListChecksum = getFileListCheckSum(dashboard_images_folder);
//            var olocalImagesFileListChecksum = getFileListCheckSum(loc_dashboard_images_folder);
        } catch(e) {
            //res.status(500).json({code:"server internal error", message:e});
            cb(e);
            return;
        }
        
        log.info("send to ISCD URI : " + options.uri);
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var remoteImagesFileList = {};
                try {
                    remoteImagesFileList = JSON.parse(body);
                } catch(e) {
                    cb(e);
                }
                
                // console.log(remoteImagesFileList);
                // console.log(typeof body);
                // compare images file list
                var diffImagesFileList = compareImagesFileList(olocalImagesFileListChecksum, remoteImagesFileList, function(arrDiffFileList) {
                    console.log(arrDiffFileList);
                    // load file and store to obj
                    genImagesFileListObject(dashboard_images_folder, arrDiffFileList, function(ret) {
//                    genImagesFileListObject(loc_dashboard_images_folder, arrDiffFileList, function(ret) {
                        console.log(JSON.stringify(ret));
                        cb(null, ret);
                    });
                });
                
                
                
//        //console.log(body.id) // Print the shortened url.
//        log.info("Update ISCD Flows OK !!!");
//        var newConfig = arrOthers.concat(arrIoTDatasource);
//        redNodes.setFlows(newConfig, 'full').then(function(flowId) {
//            log.info("setFlows completed!");
//            log.info("flowId : " + flowId);
//            log.info("body : " + JSON.stringify(body, null, 2));
//            res.json({flows: newConfig,
//                rev: flowId,
//                deploy: body});
//        });

            } else {
                //log.error("ERROR:" + error + " statusCode:" + response.statusCode);
                //res.json({msg: "Get Image File List Error.",
                //        error: error, 
                //        statusCode : response.statusCode});
                cb({msg: "Get Image File List Error.",
                        error: error, 
                        statusCode : response ? response.statusCode : null})
            }
        });
    });
}
                
/***
    module exports
        init
        get
            ocdgwconfigure
            depolyflows
            depolyflows2
        post
            ocd_config
            ocd_deploy
            ocd_deploy_multipart
        nodeAuthPost
 */
module.exports = {
    init: function(runtime, cb) {
        fnStop = runtime.stop;
        fnStart = runtime.start;
        settings = runtime.settings;
        redNodes = runtime.nodes;
        log = runtime.log;

        /**
        
         */
        function processPath(ocdConfFile) {
            // handle Unix and Windows "C:\"
            if ((ocdConfFile[0] == "/") || (ocdConfFile[1] == ":")) {
                // Absolute path
                ret = settings.ocdConf;
            } else if (ocdConfFile.substring(0,2) === "./") {
                // Relative to cwd
                ret = path.join(process.cwd(),settings.ocdConf);
            } else {
                try {
                    //console.log("process.cwd() : " + process.cwd());
                    fs.statSync(path.join(process.cwd(),ocdConfFile));
                    // Found in cwd
                    ret = path.join(process.cwd(),ocdConfFile);
                } catch(err) {
                    // Use userDir
                    // console.info("Try Catch :", err);
                    ret = path.join(settings.userDir,ocdConfFile);
                }
            }
            return ret;
        }
        
        /**
         check OCD Config
            - set the ocdCurConf = {status : 'disable' } in settings 
            - check ocdConf key in settings
            - if not exist then NO OCD
            - else
                - get public Ip for make sure device is connecting internet
                - if not connecting internet then OCD disable
                - else
                    - 
         
         
         Notice: the deviceId TBD.
         */
        // process userDir relative working path

        // default ocd is disable
        settings.ocdCurConf = {status : "disable"};
        
        if (settings.hasOwnProperty('ocdConf') &&
            (typeof settings.ocdConf === 'string') && 
            (settings.ocdConf.trim().length >= 2)) {
            // check on-line
            var onLineIp;
            var publicIp = require('public-ip');
            publicIp.v4({timeout: 3000}).then(ip => {
                onLineIp = ip;
                // OCD config file in settings file
                var ocdConfFile = processPath(settings.ocdConf);
                console.log("proceed ocdConfFile : " + ocdConfFile);
                var ocdConfFileBackup = ocdConfFile + '.bak';
                
                //
                // first check ocdConfFile is file and the relative path is exist
                //
                try {
                    // Query the entry
                    var stats = fs.lstatSync(ocdConfFile);
                    // Is it a directory?
                    if (stats.isDirectory()) {
                        // means the settings ocdConf value is wrong, so set ocd disable
                        if (cb) {cb(4);}
                        return;
                    }
                } catch (e) {
                    var ocdpath = path.parse(ocdConfFile).dir;
                    if (!fs.existsSync(ocdpath)) {
                        //console.dir(e);
                        if ( e.code === 'ENOENT' ) {
                            // if OCD folder is not exist then create it.
                            verifyBuildFolder(ocdpath);
                        } else {
                            console.log("ERROR : " + e);
                            if (cb) {cb(5);}
                            return;
                        }
                    }
                }
                console.log("until now the ocdConfFile is file and exist!!!");
                
                function next() {
                    ocdConf.status = "ready";
                    if ((ocdConf.connectionString === null) || 
                        (ocdConf.iscdUrl === null) || 
                        (ocdConf.connectionString.trim().length === 0) ||
                        (ocdConf.iscdUrl.trim().length === 0)) {
                        ocdConf.status = "not ready";
                    }
                    // console.info('[DEBUG] ocdConf : ', ocdConf);
                    settings.ocdCurConf = ocdConf;
                    
                    // create GW folder in local
                    //console.log(settings);
                    if (settings.userDir == undefined) { 
                        if (cb) {cb(3);}
                        return;
                    }
                    var gwFolder = path.join(settings.userDir, '.dash', settings.ocdCurConf.deviceId)
                    // console.info("[DEBUG] gwFolder > ", gwFolder);
                    if (!fs.existsSync(gwFolder)) {
                        // console.log("[OCD][Dashboard] Device folder %s is not exist then to create it.", gwFolder);
                        verifyBuildFolder(gwFolder);
                    }
                    placehold(gwFolder);
                    
                    gwFolder = path.join(settings.userDir, 'flows', settings.ocdCurConf.deviceId)
                    // console.log("[DEBUG] ", gwFolder);
                    if (!fs.existsSync(gwFolder)) {
                        // console.log("[OCD][IoT Studio] Device folder %s is not exist then to create it.", gwFolder);
                        verifyBuildFolder(gwFolder);
                    }
                    placehold(gwFolder);
                    
                    if (settings.ocdCurConf) {
                        settings.ocdCurConf.publicIp = onLineIp;
                    }
                    
                    if (cb) {cb(0);}
                }
                                
                // set OCD config file
                var key;
                if (!settings.hasOwnProperty('credentialSecret')) {
                    key = settings.get('_credentialSecret');
                } else {
                    key = settings.credentialSecret;
                }
                console.log("key", key);

                if (fs.existsSync(ocdConfFile)) { // if exist then load config into
                    // ocdConf = JSON.parse(fs.readFileSync(ocdConfFile));
                    readFile(ocdConfFile, ocdConfFileBackup , {}, 'credentials').then(function(cred) {
                        console.log('cred',cred);
                        if (cred.hasOwnProperty('$')) {
                            try {
                                var encryptionKey = crypto.createHash('sha256').update(key).digest();
                                ocdConf = credentials.decryptCredentials(encryptionKey, cred);
                                next();
                            } catch(e) {
                                console.log('err', e);
                            }
                        }
                    },function(err){
                        console.log("err",err);
                    });
                } else { // if conf not exist, then create a new one
                    console.log('the conf is not exist, then create a new one.');
                    ocdConf = ocdConfInit();
                    var credential = credentials.encryptCredentials(key, ocdConf);
                    //try {
                    //    fs.renameSync(ocdConfFile,ocdConfFileBackup);
                    //} catch (e) {}
                    var credentialData;
                    credentialData = JSON.stringify(credential);
                    writeFile(ocdConfFile, credentialData).then(function() {
                        next();
                    }, function(err) {
                        console.log("err", err);
                    });
                }
                
/*
                ocdConf.status = "ready";
                if ((!ocdConf.connectionString) || 
                    (!ocdConf.iscdUrl) || 
                    (ocdConf.connectionString.trim().length === 0) ||
                    (ocdConf.iscdUrl.trim().length === 0)) {
                    ocdConf.status = "not ready";
                }
                // console.info('[DEBUG] ocdConf : ', ocdConf);
                settings.ocdCurConf = ocdConf;
                
                // create GW folder in local
                //console.log(settings);
                if (settings.userDir == undefined) { 
                    if (cb) {cb(3);}
                    return;
                }
                var gwFolder = path.join(settings.userDir, '.dash', settings.ocdCurConf.deviceId)
                // console.info("[DEBUG] gwFolder > ", gwFolder);
                if (!fs.existsSync(gwFolder)) {
                    // console.log("[OCD][Dashboard] Device folder %s is not exist then to create it.", gwFolder);
                    verifyBuildFolder(gwFolder);
                }
                placehold(gwFolder);
                
                gwFolder = path.join(settings.userDir, 'flows', settings.ocdCurConf.deviceId)
                // console.log("[DEBUG] ", gwFolder);
                if (!fs.existsSync(gwFolder)) {
                    // console.log("[OCD][IoT Studio] Device folder %s is not exist then to create it.", gwFolder);
                    verifyBuildFolder(gwFolder);
                }
                placehold(gwFolder);
                
                if (settings.ocdCurConf) {
                    settings.ocdCurConf.publicIp = onLineIp;
                    //log.info("\nOCD RunTime Conf : \n" + JSON.stringify(settings.ocdCurConf, null, 4));
                }
                
                if (cb) {cb(0);}
*/                
            }, function(reason) {
                log.info("OCD : DISABLE (No public Ip)");
                if (cb) {cb(1);}
            });            
        } else {
            log.info("OCD : DISABLE (No OCD Configure)");
            if (cb) {cb(2);}
        }
    },  // end of init
    get: function(req,res) {
      
        var func = req.params.func;
        log.info("[oneclickdeployer] GET func:" + func);
        
        switch(func) {
            case "ocdgwconfigure": {
                if ((!settings.hasOwnProperty('ocdCurConf')) || 
                    (!settings.ocdCurConf.hasOwnProperty('deviceId'))) {
                    res.status(500).json({code:"server internal error", message:"ocd configure invalid."});
                } else if (!settings.hasOwnProperty('cloudPackage')) {
                    res.status(500).json({code:"server internal error", message:"setttings without cloudPackage info."});
                } else {
                    // process target folder
                    var ocd_package_folder = path.join(__dirname, '..', '..', 'public', 'ocd');
                    var retJson = verifyBuildFolder(ocd_package_folder);
                    if (retJson.code != 0) {
                        res.status(500).json({code:"server internal error", message:"process OCD package folder [" + ocd_package_folder + "] fail. Error message:" + retJson.msg.e});
                        return;
                    }
                    
                    // process source package folder
                    //console.info("userDir:", settings.userDir);
                    var ocd_package_source = path.join(settings.userDir, 'OCD', 'One-ClickDeployerSetupPackage');
                    retJson = verifyBuildFolder(ocd_package_source);
                    //console.info("ocd_package_source:", ocd_package_source);
                    if (retJson.code != 0) {
                        res.status(500).json({code:"server internal error", message:"process OCD package source [" + ocd_package_source + "] fail. Error message:" + retJson.msg.e});
                        return;
                    }
                    
                    var conf = {};
                    // Cipher key = GW deviceId(MAC)
                    const cipher = crypto.createCipher('aes192', settings.ocdCurConf.deviceId);
                    
                    // host ip & port & now timestamp
                    var host = req.get('host').trim().split(":");
                    //conf.ip = (host[0] == 'localhost') ? '127.0.0.1' : host[0];
                    //conf.port = host[1];
                    conf.url = "";
                    if ( req.get('referer') != undefined ) { conf.url = req.get('referer').trim(); }
                    
                    var now = new Date();
                    now.setHours(now.getHours() + 2);   // now + 2 hours                
                    conf.timestamp = now.getTime() / 1000;
                    // encript ip port timestamp
                    //var context = JSON.stringify(conf);
                    var encrypted = cipher.update(JSON.stringify(conf), 'utf8', 'hex')
                    encrypted += cipher.final('hex');
                    //console.info("encrypted: ", encrypted);
    
                    // generate key file
                    conf.key = encrypted;
                    fs.writeFileSync(path.join(ocd_package_source, 'gw.conf'), JSON.stringify(conf, null, 4));
                    
                    // prepare ISCD package.json & settings.js
                    // prepare cloud package
                    prepareCloudPackage(ocd_package_source, function() {
                        
                        // zip folder to public ocd package folder
                        zipFolder(settings.userDir, path.join(ocd_package_folder, 'ocdSetupPackage.zip'), function(err) {
                            if(err) {
                                console.log('TBD', err);
                                res.status(500).json({code:"server internal error", message:"zip OCD setup package fail. Error message:" + err});
                            } else {
                                var responseContext = 
                                    'The GW is **NOT** One-Click Deployer Enabled.\n' +
                                    '\n\n' +
                                    'Please donwload [One-Click Deployer Setup Package](ocd/ocdSetupPackage.zip) to enable One-Click Deploer.';
                                res.send(responseContext);
                            }
                        });
                    });
                }
                break;
            }
            case "ocdzippackage": {
                if ((!settings.hasOwnProperty('ocdCurConf')) || 
                    (!settings.ocdCurConf.hasOwnProperty('deviceId'))) {
                    res.status(500).json({code:"server internal error", message:"ocd configure invalid."});
                } else if (!settings.hasOwnProperty('cloudPackage')) {
                    res.status(500).json({code:"server internal error", message:"setttings without cloudPackage info."});
                } else {
                    // process target folder
                    var ocd_package_folder = path.join(__dirname, '..', '..', 'public', 'ocd');
                    var retJson = verifyBuildFolder(ocd_package_folder);
                    if (retJson.code != 0) {
                        res.status(500).json({code:"server internal error", message:"process OCD package folder [" + ocd_package_folder + "] fail. Error message:" + retJson.msg.e});
                        return;
                    }
                    
                    // process source package folder
                    //console.info("userDir:", settings.userDir);
                    var ocd_package_source = path.join(settings.userDir, 'OCD', 'One-ClickDeployerSetupPackage');
                    retJson = verifyBuildFolder(ocd_package_source);
                    //console.info("ocd_package_source:", ocd_package_source);
                    if (retJson.code != 0) {
                        res.status(500).json({code:"server internal error", message:"process OCD package source [" + ocd_package_source + "] fail. Error message:" + retJson.msg.e});
                        return;
                    }
                    
                    //var conf = {};
                    // Cipher key = GW deviceId(MAC)
                    //const cipher = crypto.createCipher('aes192', settings.ocdCurConf.deviceId);
                    
                    // host ip & port & now timestamp
                    //var host = req.get('host').trim().split(":");
                    //conf.ip = (host[0] == 'localhost') ? '127.0.0.1' : host[0];
                    //conf.port = host[1];
                    //conf.url = "";
                    //if ( req.get('referer') != undefined ) { conf.url = req.get('referer').trim(); }
                    
                    //var now = new Date();
                    //now.setHours(now.getHours() + 2);   // now + 2 hours                
                    //conf.timestamp = now.getTime() / 1000;
                    // encript ip port timestamp
                    //var context = JSON.stringify(conf);
                    //var encrypted = cipher.update(JSON.stringify(conf), 'utf8', 'hex')
                    //encrypted += cipher.final('hex');
                    //console.info("encrypted: ", encrypted);
    
                    // generate key file
                    //conf.key = encrypted;
                    //fs.writeFileSync(path.join(ocd_package_source, 'gw.conf'), JSON.stringify(conf, null, 4));
                    
                    // prepare ISCD package.json & settings.js
                    // prepare cloud package
                    prepareCloudPackage(ocd_package_source, function() {
                        
                        // zip folder to public ocd package folder
                        zipFolder2(settings.userDir, path.join(ocd_package_folder, 'ocdZipPackage.zip'), function(err) {
                            if(err) {
                                console.log('TBD', err);
                                res.status(500).json({code:"server internal error", message:"zip OCD setup package fail. Error message:" + err});
                            } else {
                                var responseContext = 
                                    'The GW is **NOT** One-Click Deployer Enabled.\n' +
                                    '\n\n' +
                                    'Please donwload [One-Click Deployer Setup Package](ocd/ocdSetupPackage.zip) to enable One-Click Deploer.';
                                res.send(responseContext);
                            }
                        });
                    });
                }
                break;
            }
            case "depolyflows": {
                log.info("Do flows deloy !!!");
                
                // get all nodes
                var activeFlows = redNodes.getFlows();
                // output active Flows to file
                //console.info("Active Flows:", JSON.stringify(activeFlows, null, 4));
                
                // got all nodes : activeFlowsConf.allNodes
                var activeFlowsConf = flowUtil.parseConfig(activeFlows.flows);
                //console.info("Active Flows Conf:", activeFlowsConf);
                
                // find all iot-datasource nodes
                var allDSNodes = [];
                var arrIoTDatasource = [];
                var arrOthers = [];
                
                var arrKeys = Object.keys(activeFlowsConf.allNodes);
                for(var index=0; index < arrKeys.length; index++)
                {
                    var dsId = arrKeys[index];
                    if (activeFlowsConf.allNodes[dsId].type == 'iot-datasource') 
                    {
                        // found iot datasource node
                        // check id duplicate
                        if ( allDSNodes.indexOf(dsId) != -1 ) {
                            // Warning: duplicate id
                            log.warn("[Dashboard] iot-datasource node duplicated!!! nodeId=" + dsId);
                        } else {
                            allDSNodes.push(dsId);
                            arrIoTDatasource.push(activeFlowsConf.allNodes[dsId]);
                        }
                    }
                    else
                    {
                        arrOthers.push(activeFlowsConf.allNodes[dsId]);
                    }
                }
                log.info('All IoT-DataSource Node Array : \n<<<\n' + JSON.stringify(allDSNodes, null, 2) +  "\n>>>");
                
                //==============================================================
                
                arrDeviceInfo = [];
                //
                // create iot device for each ds nodes by id
                // note: the uncloudReady DS will in arrDeviceInfo
                //
                regDevice(arrIoTDatasource, 0, function() {
                    // get all the new created IoT Device for DS nodes in array
                    log.info("The all new created IoT Device for DS array : " + JSON.stringify(arrDeviceInfo, null, 2));
                    log.info('After registry New IoT Device, the All IoT-DataSource Node Array : \n<<<\n' + JSON.stringify(arrIoTDatasource, null, 2) + "\n>>>");
                    
                    //---------------------------------------------------------
                    // genGWISCDFlow();
                    // create ISD Flows
                    
                    log.info("Gen GW ISCD Flow.");
                    
                    var iscd_flows = [];
                    
                    // create a tab node
                    var isd_tabNode = {
                        "id": redUtil.generateId(),
                        "type": "tab",
                        "label": settings.ocdCurConf.deviceId
                    };
                    
                    iscd_flows.push(isd_tabNode);
                    
                    // create a iot event hub node
                    var isd_ioteventhubNode = {
                        "id": redUtil.generateId(),
                        "type":"azureioteventhub",
                        "z": isd_tabNode.id,
                        "name":"Azure IoT Event Hub",
                        "credentials":{"connectionstring":settings.ocdCurConf.connectionString},
                        "x":140,"y":100,"wires":[[]]
                    };
                    
                    // create a C2D for all DS
                    var azure_C2DNode = {
                        "id": redUtil.generateId(),
                        "type": "azureiothubsend",
                        "z": isd_tabNode.id,
                        "name": "Azure IoT Hub Send (C2D)",
                        "credentials":{"connectionstring":settings.ocdCurConf.connectionString},//deviceInfo.deviceCS},
                        "x": 772,
                        "y": 100,
                        "wires": [
                            []
                        ]
                    };

                    // create a switch for DS
                    var isd_switchNode = {
                        "id": redUtil.generateId(),
                        "type": "switch",
                        "z": isd_tabNode.id,
                        "name": "",
                        "property": "deviceId",
                        "propertyType": "msg",
                        "rules": [],
                        "checkall": "true",
                        "outputs": 0,
                        "x": 311,
                        "y": 100,
                        "wires": [[]]
                    };
                    isd_ioteventhubNode.wires[0].push(isd_switchNode.id);
                    iscd_flows.push(isd_ioteventhubNode);
                    iscd_flows.push(azure_C2DNode);
                    
                    // create iot-datasource
                    if (arrIoTDatasource.length > 0) {
                        isd_switchNode.wires = [];
                        for(var ii=0; ii < arrIoTDatasource.length; ii++) {
                            //var deviceInfo = arrDeviceInfo[ii];
                            var iot_datasorceNode = clone(activeFlowsConf.allNodes[arrIoTDatasource[ii].id]);
                            iot_datasorceNode.z = isd_tabNode.id;
                            iot_datasorceNode.x = 486;
                            iot_datasorceNode.y = 80 + ii * 40;
                            isd_switchNode.rules.push({
                                "t": "eq",
                                "v": iot_datasorceNode.id,
                                "vt": "str"
                            });
                            isd_switchNode.wires.push([iot_datasorceNode.id]);
                            if (iot_datasorceNode.wires[0].length > 0)
                            {
                                iot_datasorceNode.wires[0] = [azure_C2DNode.id];
                            }
                            //console.log(iot_datasorceNode);
                            iscd_flows.push(iot_datasorceNode);
                        }
                        isd_switchNode.outputs = arrIoTDatasource.length;
                    }
                    iscd_flows.push(isd_switchNode);
                    
                    // write iscd flows to GW flow folder
                    var flowData = JSON.stringify(iscd_flows, null, 2);
                    var iscdFlowFilePath = path.join(settings.userDir, 'flows', settings.ocdCurConf.deviceId, 'iscd_config.json');
                    fs.writeFileSync(iscdFlowFilePath, flowData);
                    
                    log.info("Write GW ISCD Flow to : " + iscdFlowFilePath);

                    // load GW Dashboard 
                    var dashboardSrcPath = path.join(settings.userDir,'.dash', 'config_default.json');
                    var iscdDashboardPath = path.join(settings.userDir,'.dash',settings.ocdCurConf.deviceId, 'iscd_config.json');
                    
                    var dashboardConf = [];
                    if (fs.existsSync(dashboardSrcPath)) {
                        var content = JSON.parse(fs.readFileSync(dashboardSrcPath));
                        log.info("Load GW Dashboard : " + dashboardSrcPath);
                        if (content.hasOwnProperty('dashboards'))
                        {
                            dashboardConf = content.dashboards;
                        }
                    }
                    fs.writeFileSync(iscdDashboardPath, dashboardConf);
                    log.info("Write GW ISCD Dashboard Flow to : " + iscdDashboardPath);
                    
                    /**
                     * send to ISCD & setflows
                     */
                    // check authenticate needs
                    noderedAuthentication('https://'+settings.ocdCurConf.iscdUrl, function(authorization) {
                        var options = {
                            uri: 'https://'+settings.ocdCurConf.iscdUrl+'/oneclickdeployer/ocd_deploy',
                            headers: {
                                'Node-RED-API-Version': 'v2',
                                'Node-RED-Deployment-Type': 'full'
                            },                        
                            method: 'POST',
                            json: {
                                gwId : settings.ocdCurConf.deviceId,
                                flowData : iscd_flows,
                                dashboardData : dashboardConf
                            }//,
                            //timeout: 10000 (reserve for later modify)
                        };
                            
                        if (authorization != undefined) {
                            options.headers.Authorization = authorization;
                        }
                        
                        //log.info("POST option : \n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n" + JSON.stringify(options, null, 2) + "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    
                        log.info("send to ISCD URI : " + options.uri);
                        request(options, function (error, response, body)
                        {
                            if (!error && response.statusCode == 200) 
                            {
                                //console.log(body.id) // Print the shortened url.
                                log.info("Update ISCD Flows OK !!!");
                                var newConfig = arrOthers.concat(arrIoTDatasource);
                                redNodes.setFlows(newConfig, 'full').then(function(flowId) {
                                    log.info("setFlows completed!");
                                    log.info("flowId : " + flowId);
                                    log.info("body : " + JSON.stringify(body, null, 2));
                                    res.json({flows: newConfig,
                                        rev: flowId,
                                        deploy: body});
                                });
                            }
                            else
                            {
                                log.error("ERROR:" + error + " statusCode:" + response.statusCode);
                                res.json({msg: "Send ISCD Errror",
                                        error: error, 
                                        statusCode : response.statusCode});
                            }
                        });


                    });
                });
                break;
            }
            case "depolyflows2": {
                log.info("Do flows deloy 2 !!!");
                
                // get actived flows
                //  - check getFlows
                if (typeof redNodes.getFlows != 'function') {
                    res.status(500).json({code:"server internal error", message:"node getFlows is not function."});
                } else {
                    var activeFlows = redNodes.getFlows();

                    /*
                        got all nodes : activeFlowsConf.allNodes
                    */
                    // get active flows configure
                    
                    //  - check flows
                    if (!activeFlows.hasOwnProperty('flows')) {
                        res.status(500).json({code:"server internal error", message:"without flows object."});
                    } else if (!Array.isArray(activeFlows.flows)) { // - check flows type need be array
                        res.status(500).json({code:"server internal error", message:"flows is not array."});
                    } else if ((settings.userDir == undefined) || (settings.ocdCurConf.deviceId == undefined)) {
                        res.status(500).json({code:"server internal error", message:"save upload iscd flows to GW flow folder is undefined."});
                    } else {
                        var activeFlowsConf = flowUtil.parseConfig(activeFlows.flows);
                
                        // find all iot-datasource nodes
                        var allDSNodes = [];        // Datasource node id only
                        var arrIoTDatasource = [];  // Datasource node object
                        var arrOthers = [];
        
                        // get all nodes from ative flows configure
                        // then to find the iot-datasource nodes and
                        // separate iot-datasource from others nodes
                        var arrKeys = Object.keys(activeFlowsConf.allNodes);
                        for(var index=0; index < arrKeys.length; index++) {
                            var dsId = arrKeys[index];
                            if (activeFlowsConf.allNodes[dsId].type == 'iot-datasource') {
                                // found iot datasource node
                                // check id duplicate
                                if ( allDSNodes.indexOf(dsId) != -1 ) {
                                    // Warning: duplicate id
                                    log.warn("[Dashboard] iot-datasource node duplicated!!! nodeId=" + dsId);
                                } else {
                                    allDSNodes.push(dsId);
                                    arrIoTDatasource.push(activeFlowsConf.allNodes[dsId]);
                                }
                            } else {
                                arrOthers.push(activeFlowsConf.allNodes[dsId]);
                            }
                        }
                        
                        // get images file list and checksum
                        // check authenticate needs
                        processImagesFileList('https://'+settings.ocdCurConf.iscdUrl, function(err, oRet) {
                            if(!err) {
                                console.log(oRet);
                            } else {
                                // error
                                console.log(err);
                            }
                        });


                        return;
                        
                        // stop
                        
                        
                        
                        // log.info('All IoT-DataSource Node Array : \n<<<\n' + JSON.stringify(allDSNodes, null, 2) +  "\n>>>");
                        
                        //==============================================================
                        //
                        // create iot device for each ds nodes by id
                        // note: the uncloudReady DS will in arrDeviceInfo
                        //
                        arrDeviceInfo = [];
                        regDevice(arrIoTDatasource, 0, function() {
                            // get all the new created IoT Device for DS nodes in array
                            // log.info("The all new created IoT Device for DS array : " + JSON.stringify(arrDeviceInfo, null, 2));
                            // log.info('After registry New IoT Device, the All IoT-DataSource Node Array : \n<<<\n' + JSON.stringify(arrIoTDatasource, null, 2) + "\n>>>");
                            
                            //---------------------------------------------------------
                            // genGWISCDFlow();
                            // create ISD Flows
                            
                            log.info("Gen GW ISCD Flow.");
                            
                            var iscd_flows = [];
                            
                            // create a tab node for deviceId
                            var isd_tabNode = {
                                "id": redUtil.generateId(),
                                "type": "tab",
                                "label": settings.ocdCurConf.deviceId
                            };
                            
                            iscd_flows.push(isd_tabNode);
                            
                            // create a iot event hub node
                            var isd_ioteventhubNode = {
                                "id": redUtil.generateId(),
                                "type":"azureioteventhub",
                                "z": isd_tabNode.id,
                                "name":"Azure IoT Event Hub",
                                "credentials":{"connectionstring":settings.ocdCurConf.connectionString},
                                "x":140,"y":100,"wires":[[]]
                            };
                            
                            // create a C2D for all DS
                            var azure_C2DNode = {
                                "id": redUtil.generateId(),
                                "type": "azureiothubsend",
                                "z": isd_tabNode.id,
                                "name": "Azure IoT Hub Send (C2D)",
                                "credentials":{"connectionstring":settings.ocdCurConf.connectionString},//deviceInfo.deviceCS},
                                "x": 772,
                                "y": 100,
                                "wires": [[]]
                            };
        
                            // create a switch for DS
                            var isd_switchNode = {
                                "id": redUtil.generateId(),
                                "type": "switch",
                                "z": isd_tabNode.id,
                                "name": "",
                                "property": "deviceId",
                                "propertyType": "msg",
                                "rules": [],
                                "checkall": "true",
                                "outputs": 0,
                                "x": 311,
                                "y": 100,
                                "wires": [[]]
                            };
                            isd_ioteventhubNode.wires[0].push(isd_switchNode.id);
                            iscd_flows.push(isd_ioteventhubNode);
                            iscd_flows.push(azure_C2DNode);
                            
                            // create all iot-datasources
                            if (arrIoTDatasource.length > 0) {
                                isd_switchNode.wires = [];
                                for(var ii=0; ii < arrIoTDatasource.length; ii++) {
                                    //var deviceInfo = arrDeviceInfo[ii];
                                    var iot_datasorceNode = clone(activeFlowsConf.allNodes[arrIoTDatasource[ii].id]);
                                    iot_datasorceNode.z = isd_tabNode.id;
                                    iot_datasorceNode.x = 486;
                                    iot_datasorceNode.y = 80 + ii * 40;
                                    isd_switchNode.rules.push({
                                        "t": "eq",
                                        "v": iot_datasorceNode.id,
                                        "vt": "str"
                                    });
                                    isd_switchNode.wires.push([iot_datasorceNode.id]);
                                    if (iot_datasorceNode.wires[0].length > 0) {
                                        iot_datasorceNode.wires[0] = [azure_C2DNode.id];
                                    }
                                    //console.log(iot_datasorceNode);
                                    iscd_flows.push(iot_datasorceNode);
                                }
                                isd_switchNode.outputs = arrIoTDatasource.length;
                            }
                            iscd_flows.push(isd_switchNode);

                            //==============================================================
                            // save the upload iscd flows to GW flow folder
                            //
                            var flowData = JSON.stringify(iscd_flows, null, 2);
                            var iscdFlowFilePath = path.join(settings.userDir, 'flows', settings.ocdCurConf.deviceId, 'iscd_config.json');
                            fs.writeFileSync(iscdFlowFilePath, flowData);
                            log.info("Write GW ISCD Flow to : " + iscdFlowFilePath);
        
                            //----------------------------------------------------------
                            // process dashboard
                            //
                            // load GW Dashboard 
                            var dashboardSrcPath = path.join(settings.userDir,'.dash', 'config_default.json');
                            var iscdDashboardPath = path.join(settings.userDir,'.dash',settings.ocdCurConf.deviceId, 'iscd_config.json');
                            
                            var dashboardConf = [];
                            if (fs.existsSync(dashboardSrcPath)) {
                                var content = JSON.parse(fs.readFileSync(dashboardSrcPath));
                                log.info("Load GW Dashboard : " + dashboardSrcPath);
                                if (content.hasOwnProperty('dashboards')) {
                                    dashboardConf = content.dashboards;
                                }
                            }
                            fs.writeFileSync(iscdDashboardPath, dashboardConf);
                            log.info("Write GW ISCD Dashboard Flow to : " + iscdDashboardPath);

                            // get images file list and checksum
                            // check authenticate needs
                            //processImagesFileList('https://'+settings.ocdCurConf.iscdUrl, function(err, oRet) {
                            //    
                            //});





                            //----------------------------------------------------------
                            //
                            var options = {
                                host    : 'https://'+settings.ocdCurConf.iscdUrl,
                                url     : '/oneclickdeployer/ocd_deploy_multipart',
                                data    : 
                                {
                                    gwId : settings.ocdCurConf.deviceId,
                                    flowData : iscd_flows,
                                    dashboardData : dashboardConf
                                }
                            }
                            
                            function procResponse(result) {
                                //console.log(result);
                                if (!result.error && (result.statusCode == 200)) {
                                    // work completed
                                    //console.log(result);
                                    var newConfig = arrOthers.concat(arrIoTDatasource);
                                    redNodes.setFlows(newConfig, 'full').then(function(flowId) {
                                        //log.info("setFlows completed!");
                                        //log.info("flowId : " + flowId);
                                        //log.info("body : " + JSON.stringify(body, null, 2));
                                        res.json({
                                            flows: newConfig,
                                            rev: flowId
                                        });
                                    });
                                } else {
                                    if (result.statusCode == 413) {
                                        // reduce size do again
                                        options.blockSize = options.blockSize / 2;
                                        console.log("retry options.blockSize : ", options.blockSize);
                                        nodeAuthPost(options, procResponse);
                                    } else {
                                        res.status(result.statusCode).json(result);
                                    }
                                }
                            }
                            
                            // post to azure cloud
                            options.blockSize = 1024;
                            nodeAuthPost(options, procResponse);
                            
                            //nodeAuthPost(options, function(result) {
                            //    //console.log(result);
                            //    if (!result.error && (result.statusCode == 200)) {
                            //        // work completed
                            //        //console.log(result);
                            //        var newConfig = arrOthers.concat(arrIoTDatasource);
                            //        redNodes.setFlows(newConfig, 'full').then(function(flowId) {
                            //            //log.info("setFlows completed!");
                            //            //log.info("flowId : " + flowId);
                            //            //log.info("body : " + JSON.stringify(body, null, 2));
                            //            res.json({
                            //                flows: newConfig,
                            //                rev: flowId
                            //            });
                            //        });
                            //    } else {
                            //        //console.log(">>>>>>>>", result);
                            //        //log.error("ERROR:" + result.error + " statusCode:" + response.statusCode);
                            //        //res.json({msg: "Send ISCD Errror",
                            //        //        error: result.error, 
                            //        //        statusCode : response.statusCode});
                            //        //res.json(result);
                            //        
                            //        console.log("<<<<<<<<<<<<<<<<<< ", result.statusCode);
                            //        
                            //        if (result.statusCode == 413) {
                            //            // reduce size do again
                            //            
                            //        } else {
                            //            res.status(result.statusCode).json(result);
                            //        }
                            //    }
                            //    //console.log("FINISH nodeAuthPost !!!");
                            //    //console.log("THE END");
                            //});
                        });                        
                    }
                }
                break;
            }
            case "imagesFileListCheckSum": {
                try {
                    // process target folder
                    var dashboard_images_folder = path.join(__dirname, '..', '..', 'nodes', 'dashboard', 'static', 'images');
                    var ofileChecksum = getFileListCheckSum(dashboard_images_folder);
                    res.status(200).json(ofileChecksum);
                } catch(e) {
                    res.status(500).json({code:"server internal error", message:e});
                }
                break;
            }
            default:
                res.status(400).json({code:"invalid_ocd_request", message:"Invalid One-Click Deployer requested"});
                return;
        }
    },
    post: function(req,res) {
        //var body = req.body;
        //var params = req.params;
        //console.info("body:", body);
        //console.info("params:", params);
        var func = req.params.func;
        log.info("[oneclickdeployer] POST func:" + func);
        switch(func) {
            case "ocd_config": {
                /**
                    error code:
                        001: request wo body or items miss key, iothubcs, webhostname
                        002: request key is invalid
                 */
                if (ocdConf == null) {
                    res.status(500).json({code:"server internal error", message:"ocd configure invalid."});
                } else if (   !req.hasOwnProperty('body') ||
                            !req.body.hasOwnProperty('key') ||
                            !req.body.hasOwnProperty('iothubcs') ||
                            !req.body.hasOwnProperty('webhostname')
                        ) {
                    res.status(400).json({code:"invalid_ocd_request", message:"Invalid One-Click Deployer requested(001)"});
                } else {
                    // verify key
                    const data = req.body.key;
                    
                    try {
                        // Decipher
                        const decipher = crypto.createDecipher('aes192', ocdConf.deviceId);
                        var decrypted = decipher.update(data, 'hex', 'utf8');
                        decrypted += decipher.final('utf8');
                        //console.info("decrypted: ", decrypted);
                        var obj = JSON.parse(decrypted);
                    } catch (e) {
                        res.status(400).json({code:"invalid_ocd_request", message:"Invalid One-Click Deployer requested(002)"});
                        return;
                    }
                    
                    //'use strict';
                    //var iothub = require('azure-iothub');
                    //var connectionString = req.body.iothubcs;
                    //console.log(connectionString);
                    //var webhostname = req.body.webhostname;
                    //console.log(webhostname);
                    
                    settings.ocdCurConf.connectionString = req.body.iothubcs;
                    settings.ocdCurConf.iscdUrl = req.body.webhostname;
                    settings.ocdCurConf.status = "ready";
                    //console.log(settings.ocdCurConf);
                    
                    fs.writeFileSync(settings.ocdConf,
                        JSON.stringify(settings.ocdCurConf, null, 4));
                    
                    var updateOcdConf = JSON.parse(fs.readFileSync(settings.ocdConf));
                    res.json(updateOcdConf);
                }
                }   
                break;
            case "ocd_deploy": {
                    doIscdFlowsDeploy(req, res);
                }
                break;
            case "ocd_deploy_multipart": {
                    doIscdFlowsDeployMultipart(req, res);
                }
                break;
            case "remote_deploy_multipart": {
                    doRemoteDeployMultipart(req, res);
                }
                break;
            case "remoteDepoly": {
                    log.info("Do remote deloy !!!");
                    // get actived flows
                    //  - check getFlows
                    if (typeof redNodes.getFlows != 'function') {
                        res.status(500).json({code:"server internal error", message:"node getFlows is not function."});
                    } else {
                        var activeFlows = redNodes.getFlows();
    
                        /*
                            got all nodes : activeFlowsConf.allNodes
                        */
                        // get active flows configure
                        
                        //  - check flows
                        if (!activeFlows.hasOwnProperty('flows')) {
                            res.status(500).json({code:"server internal error", message:"without flows object."});
                        } else if (!Array.isArray(activeFlows.flows)) { // - check flows type need be array
                            res.status(500).json({code:"server internal error", message:"flows is not array."});
                        } else if ((settings.userDir == undefined) || (settings.ocdCurConf.deviceId == undefined)) {
                            res.status(500).json({code:"server internal error", message:"save upload iscd flows to GW flow folder is undefined."});
                        } else {
                            var activeFlowsConf = flowUtil.parseConfig(activeFlows.flows);
                    
                            // find all iot-datasource nodes
                            var allDSNodes = [];        // Datasource node id only
                            var arrIoTDatasource = [];  // Datasource node object
                            var arrOthers = [];
            

                            function remoteDeploy(opt, cb) {

                                // get images file list and checksum
                                // check authenticate needs
                                //----------------------------------------------------------
                                //
                                var options = {
                                    //host    : 'https://'+settings.ocdCurConf.iscdUrl,
                                    host    : opt.host,
                                    url     : '/oneclickdeployer/remote_deploy_multipart',
                                    data    : opt.data
                                }
                                
                                function procResponse(result) {
                                    //console.log(result);
                                    if (!result.error && (result.statusCode == 200)) {
                                        cb();
                                    } else {
                                        if (result.statusCode == 413) {
                                            // reduce size do again
                                            options.blockSize = options.blockSize / 2;
                                            console.log("retry options.blockSize : ", options.blockSize);
                                            nodeAuthPost(options, procResponse);
                                        } else {
                                            //res.status(result.statusCode).json(result);
                                            cb({error: result});
                                        }
                                    }
                                }
                                
                                // post to azure cloud
                                options.blockSize = 1024;
                                nodeAuthPost(options, procResponse);
                            }

                            // load local GW Flows 
                            var flowsSrcPath = path.join(settings.userDir,'flows','flows-ISCD.json');
                            var flowsContent = null;
                            if (fs.existsSync(flowsSrcPath)) {
                                flowsContent = JSON.parse(fs.readFileSync(flowsSrcPath));
                            }
                            console.log(flowsSrcPath);

                            // load local GW Flows cred
                            var flowsCredSrcPath = path.join(settings.userDir, 'flows-ISCD_cred.json');
                            var flowsCredContent = null;
                            if (fs.existsSync(flowsCredSrcPath)) {
                                flowsCredContent = JSON.parse(fs.readFileSync(flowsCredSrcPath));
                            }
                            console.log(flowsCredSrcPath);

                            // load local GW Dashboard 
                            var dashboardSrcPath = path.join(settings.userDir,'.dash', 'config_default.json');
                            var dashboardContent = null;
                            if (fs.existsSync(dashboardSrcPath)) {
                                dashboardContent = JSON.parse(fs.readFileSync(dashboardSrcPath));
                            }
                            console.log(dashboardSrcPath);

                            function calldoDeploy(idx, arrHost, cb) {
                                // process host the tail / chart
                                arrHost[idx] = (arrHost[idx][arrHost[idx].length-1] == '/') ? arrHost[idx].substring(0, arrHost[idx].length - 1) : arrHost[idx];
                                console.log('index', idx, 'host', arrHost[idx]);
                                processImagesFileList(arrHost[idx], function(err, oRet) {
                                    if(!err) {
                                        var opt = {
                                            host: arrHost[idx],
                                            data: {
                                                flow: flowsContent,
                                                flowcred: flowsCredContent,
                                                dashboard: dashboardContent,
                                                images: oRet
                                            }
                                        };
                                        remoteDeploy(opt, function(err) {
                                            if (!err) {
                                                console.log('remote deploy index', idx, ' completed.');
                                            }
                                            idx++;
                                            if (idx < arrHost.length) {
                                                calldoDeploy(idx, arrHost, function(err) {
                                                    cb(err);
                                                });
                                            } else {
                                                console.log('finish!');
                                                cb();
                                            }
                                        });
                                    } else {
                                        // error
                                        cb(err);
                                    }
                                });
                            }

                            // req.body is ip array for deploy target
                            // like below : [ "http://10.13.1.35:1880" ];

                            var data = req.body;
                            console.log(data.arrURL);
                            var arrURL = data.arrURL;
                            goRemote.acc = "admin";
                            goRemote.pwd = "12345678";
                            if (Array.isArray(arrURL)) {
                                calldoDeploy(0, arrURL, function(err) {
                                    if (!err) {
                                        res.status(200).json({msg: 'done.'});
                                    } else {
                                        res.status(500).json(err);
                                    }
                                });
                            } else {
                                // input ip list is not array
                                res.status(200).json({err: 'input ip list is not array.'});
                            }
                        }
                    }
                }
                break;
            default:
                res.status(400).json({
                    code:"invalid_ocd_request",
                    message:"Invalid One-Click Deployer requested"
                });
                return;
        }
    },
    nodeAuthPost : nodeAuthPost,
    zipFolder : zipFolder2
}


// THE END