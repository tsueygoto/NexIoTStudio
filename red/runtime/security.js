/**
 * NEXCOM IoT Studio Security
 * 
 * purpose:
 *      protect NEXCOM create node. If no pass the security flow then disable node feature in IoT Studio.
 * 
 * Design:
 *      In the first time, IoT Studio start will seprate the public key into node_modules depends on machine info like hard disk sn or mac and some files for dictionary.
 *      When need to decrypt encrypted file, need to recombine public key then do decrypt for action.
 * 
 */

var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');
var util = require('./util');
var si = require('systeminformation');


var settings;

//var mac;
var macByteArr = [];
var parts = 9; // 
var dict;
var pos = [0,1,2,3,4,5,6,7,8];
var seed = 15; // 0 - length-1 of macByteArr
var objLocDict = null;
var objKeys;
var getSeed;
var locArr = [];


/**
 *     getHDSerialNumber
 * 
 *     check hyperX first
 *          if true then get key from hyperx
 *          else the previous get key method
 * 
 */
function getHDSerialNumber() {
    return new Promise(function(resolve, reject) {
        if (util.hyperxCheck(settings)) {
            var hyperxKey = util.hyperxGetKey(settings);
            if (hyperxKey) {
                resolve(hyperxKey.trim().replace(/:/g,""));
            } else {
                reject("hyperxKey is null");
            }
        } else {
            si.diskLayout()
                .then(data => {
                    if (data.length == 0) {
                        // adopt MAC 
                        //var macArr, macStr = getMACArr();
                        require('getmac').getMac(function(err, macAddress) {
                            if (err) {
                                //throw err;
                                resolve("010203040506070809");
                            } else {
                                resolve(macAddress.trim().replace(/:/g,""));
                            }
                        });
                    } else {
                        resolve(data[0].serialNum);
                    }                
                })
                .catch(error => {
                    reject(error);
                });
        }
    });
}

/**
 */
function getValuefromDict(seed, macByteArr, dict) {
    var dictLen = dict.length;
    var keyLen = macByteArr.length;
    var value = 0;
    for(var i=0; i<4; i++)
    {
        value += macByteArr[(seed + i) % keyLen] * Math.pow(15, i);
    }
    var ret = dict[value % dictLen];
    return [(ret & 0xF0), (ret & 0x0F)];
}


/**
    procPublicKey

 */
function procPublicKey(key, cb) {
    // key separe to parts: part0, part1, part2, ...
    // var parts = 9;
    var partLen = Math.floor(key.length/parts);
    for(var i=0; i<pos.length; i++) {
        // get key
        var startPos = pos[i] * partLen;
        var endPos = startPos + partLen - 1;
        if (pos[i] == (parts - 1)) {
            endPos = key.length - 1;
        }
        var objModulePath = locArr[i];
        var objModule = require(objModulePath);
        //if (objModule.hasOwnProperty('nexSecKey')) {
        //    // Do the first nexSecKey backup only
        //    if (!objModule.hasOwnProperty('nexSecKeyBackup')) {
        //        objModule.nexSecKeyBackup = objModule.nexSecKey;
        //    }
        //}
        objModule.nexSecKey = key.toString('utf8', startPos, (endPos + 1));
        fs.writeFileSync(objModulePath, JSON.stringify(objModule, null, 2));
    }
    cb();
}

/**
    Do Security Init
    
    * Got MAC
        if no exist then default is 01:23:45:67:89:AB

    * load dict
        dict location: { installed location }/public/red/red.min.js
        * must exist before run.
    
    * decide parts order
        init parts order = [0,1,2,3,4,5,6,7,8]
        depends on seed to reorder parts
     
    * load dict of location
        //dict location: { installed location }/node_modules/moduleList.json
        dict location: { installed location }.package-lock-wo-dev.json
        * This file should be create by npm post install depends on node_modules
        * must exist before run.

    * check public key exist or not?
        public key location: { installed location }/red/runtime/.publickey
        if key exist then process public key
        else do nothing
        
 */
function init(userSettings, cb) {
    settings = userSettings;
    getHDSerialNumber().then(function(sn) {
        macByteArr = Buffer.from(sn, 'hex');
        userSettings.security = {mac: sn};
        userSettings.mac = macByteArr;
        
        // load dict
        var dictPath = path.join(__dirname, '../..', 'public', 'red', 'red.min.js');
        userSettings.security.dict = {path: dictPath};
        if (fs.existsSync(dictPath)) {
            userSettings.security.dict.status = 'ready';
            dict = fs.readFileSync(dictPath);
        } else {
            userSettings.security.dict.status = 'not exist';
            console.info("dict [", dictPath, "] is not exist. ");
            cb();
        }
    
        /**
            decide parts order
            var pos = [0,1,2,3,4,5,6,7,8];
        */
        var posLen = pos.length;
        var value = seed;
        var maxLen = posLen;
        for(var i=0; i<posLen; i++) {
            var ret = getValuefromDict((value % macByteArr.length) , macByteArr, dict);
            value = ret[0] * 15 + ret[1];
            var index = value % maxLen;
            var predata = pos[maxLen-1];
            pos[maxLen-1] = pos[index];
            pos[index] = predata;
            maxLen = maxLen - 1;
        }
        userSettings.security.pos = pos;

        /**
            check locDict file is exist or not?
            This file should be create by npm post install depends on node_modules
            if not to return and dump error message.
        */
        // var locDict = path.join(__dirname, '../..', 'node_modules', 'moduleList.json');
        var locDict = path.join(__dirname, '../..', '.package-lock-wo-dev.json');
        userSettings.security.locdict = {path: locDict};
        if (!fs.existsSync(locDict)) {
            userSettings.security.locdict.status = 'not exist';
            console.info("Error", "location dict [", locDict, "] is not exist. ");
            cb();
        }
        userSettings.security.locdict.status = 'ready';

        // load location dict
        objLocDict = require(locDict);
        var objKeys = Object.keys(objLocDict);
        var locLen = objKeys.length;
        
        // get location array
        // set get seed
        getSeed = value;
        locArr = [];
        for(var i=0; i<pos.length; i++) {
            var ret = getValuefromDict((value % macByteArr.length) , macByteArr, dict);
            value += ret[0] * 15 + ret[1];
            var index = value % locLen;
            //console.info("ret : ", ret, "value : ", value, " index : ", index, " locLen : ", locLen);
            var target = objLocDict[objKeys[index]];
            //var objModulePath = path.join(target.path, 'package.json');
            var objModulePath = path.join(__dirname, '../..', 'node_modules',objKeys[index], 'package.json');
            if (!fs.existsSync(objModulePath)) {
                userSettings.security.module = {path: objModulePath};
                userSettings.security.module.status = 'not exist';
                console.info("Error", "Module [", objModulePath, "] is not exist. ");
                cb();
            }
            locArr.push(objModulePath);
            objKeys.splice(index, 1);
            locLen = locLen - 1;
        }
        userSettings.security.module = locArr;
        
        // check publickey exist or not?
        var keyPath = path.join(__dirname, '.publickey');
        userSettings.security.publicKey = {path: keyPath};
        if (fs.existsSync(keyPath)) {
            var key = fs.readFileSync(keyPath);
            procPublicKey(key, function() {
                // unlink .publickey
                fs.unlinkSync(keyPath);
                userSettings.security.publicKey.status = 'ready';
                cb();
            });
        } else {
            userSettings.security.publicKey.status = 'not exist';
            cb();
        }
    },function(err) {
        console.error(err);
        cb();
    });
}

/**
 */
function getMACArr()
{
    var mac = [];
    var macStr = "";
    
    // get MAC relative IP
    // setup package for download
    var os = require('os');
    var ifaces = os.networkInterfaces();
    console.log(ifaces);
    var ifnames = Object.keys(ifaces);
    for(var index=0; index < ifnames.length; index++)
    {
        var iface = ifaces[ifnames[index]];
        for(var jndex=0; jndex < iface.length; jndex++)
        {
            if ((iface[jndex].family == 'IPv4') && (iface[jndex].mac != '00:00:00:00:00:00')) {
                macStr = iface[jndex].mac.trim().replace(/:/g,"");
                mac.push(iface[jndex].mac.trim().split(":"));
                return mac, macStr;
            }
        }
    }
    return [], "";
}




/**
    getPem
    
    dependence:
        objLocDict - 
    
    
    if key is not exist then return null
    
 */
function getPem() {
    if (objLocDict == null) { // means the moduleList.json is not exist
        return null;
    }
    var objKeys = Object.keys(objLocDict);
    var locLen = objKeys.length;
    
    //console.info("[getPem] pos : ", pos);
    //var value = getSeed;
    var secKeyArr = [];
    for(var i=0; i<pos.length; i++) {
        var objModulePath = locArr[i];
        //console.info("[getPem] Module Path : ", objModulePath);
        var objModule = require(objModulePath);
        if (objModule.hasOwnProperty('nexSecKey')) {
            //console.info("index : ", i, " nexSecKey : ", objModule.nexSecKey);
            secKeyArr.push(objModule.nexSecKey);
        } else {
            // if no nexSecKey means the no key
            return null;
        }
    }
    
    var pemKey = "";
    for(var i=0; i<pos.length; i++) {
        var index = pos.indexOf(i);
        pemKey = pemKey + secKeyArr[index];
    }
    
    var pemArr = pemKey.match(/.{1,64}/g); 
    
    //console.info("pemArr : ", pemArr);
    
//    pemArr :  [ 
//  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAilq7D0KY968Irz8lV+45',
// ...
//  'bQIDAQAB' ]

    var pem = '-----BEGIN PUBLIC KEY-----\n';
    for(var i=0; i<pemArr.length; i++) {
        pem = pem + pemArr[i] + '\n';
    }
    pem = pem + '-----END PUBLIC KEY-----';
  
//    console.info("Got Key : ", pem);
//    
//    '-----BEGIN PUBLIC KEY-----\n'+
//'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAilq7D0KY968Irz8lV+45\n'+
// ...
//'bQIDAQAB\n'+
//'-----END PUBLIC KEY-----';
//    
    //console.info("pem : ", pem);
    return pem;
}


/**
    params: file - the file full pathname
    return: filename - the decode file name for load
    
 */
function decode(file) {
    try {
        var encryedContent = fs.readFileSync(file);
        // console.info(encryedContent);
        var pem = getPem();
        // console.log("pem : ", pem);
        if ( pem == null ) {
            // means no key
            return null;
        }
        //console.info("pem : ", pem);
        
        var publicKey = new NodeRSA(pem);
    
        var decryedContent = publicKey.decryptPublic(encryedContent);
        //console.info(decryedContent);
        var content = decryedContent.toString('utf8');
        //console.info(after);
    
        var outfilename = util.generateId();
        var fpname = path.join(path.dirname(file), outfilename);
        //console.info(fpname);
        fs.writeFileSync(fpname, content, 'utf8');
        return fpname;
    } catch (e) {
        // console.info(e);
        return null;
    }
}

module.exports = {
    init: init,
    decode: decode
};
