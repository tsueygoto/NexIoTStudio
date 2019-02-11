/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var copydir = require('copy-dir');
var NodeRSA = require('node-rsa');

/**

 */
function checkObjFolder(obj) {
    if (obj.hasOwnProperty('toFolder')) {
        var toFolderPath = path.resolve(obj.toFolder);
        if (!fs.existsSync(toFolderPath)) { // check to folder is exist or not?
            // create folder and copy dir from to
            console.log("mkdir : %s", toFolderPath);
            verifyBuildFolder(toFolderPath);
            copydir.sync(path.resolve(obj.fromFolder), toFolderPath);
        }
    }
}

/**
 *
 */
function verifyBuildFolder(folder)
{
    try {
        var arrPath = folder.split(path.sep);
        //console.log(arrPath);
        var targetPath = (arrPath[0] == '') ? path.sep : arrPath[0];
        for(var i=1; i<arrPath.length; i++)
        {
            targetPath = path.join(targetPath, arrPath[i]);
            if (!fs.existsSync(targetPath))
            {
                //console.info("mkdir ", targetPath);
                fs.mkdirSync(targetPath);
            }
        }
        return {code:0, msg:null}
    } catch (e) {
        return {code:1, msg:JSON.stringify(e)}
    }
}

/**
 */
function doEncryptModule( privateKey, obj ) {
    checkObjFolder(obj);
    var content = fs.readFileSync(path.resolve(obj.from));
    var encryedContent = privateKey.encryptPrivate(content);
    fs.writeFileSync(obj.to, encryedContent, 'binary');
    // TBD for later gen md5 verify encrypted file is modifyed or not
    //if(obj.hasOwnProperty('toFolder')) {
    //    var md5checksum = crypto.createHash('md5').update(encryedContent).digest("hex");
    //    fs.openSync(path.join(obj.toFolder, md5checksum), 'w');
    //}
}

/** main **/

// process parameters
var argv = process.argv;
if ((argv.length != 4)) {
    console.log("\nUsage:\n   node %s {[in]privateKeyFilePath} {[in]encryptModulesMapFilePath}\n", path.basename(argv[1]));
    console.log("   [in]privateKeyFilePath        : the public key file path.");
    console.log("   [in]encryptModulesMapFilePath : the encrypt modules map file path.");
    return;
}

// check file path is exist !!!
var pkAbsolutePath = path.resolve(argv[2]);
console.log("The private key absolute file path = %s\n", pkAbsolutePath);
if (!fs.existsSync(pkAbsolutePath)) {
    console.log("[ERROR] The private key absolute file path [%s] is not exist.", pkAbsolutePath);
    return;
}

var emmAbsolutePath = path.resolve(argv[3]);
console.log("The encrypt modules map absolute file path = %s\n", emmAbsolutePath);
if (!fs.existsSync(emmAbsolutePath)) {
    console.log("[ERROR] The encrypt modules map absolute file path [%s] is not exist.", emmAbsolutePath);
    return;
}

try {
    
    var pk = fs.readFileSync(pkAbsolutePath, 'utf8');
    var pemArr = pk.match(/.{1,64}/g); 
    var pem = '-----BEGIN PRIVATE KEY-----\n';
    for(var i=0; i<pemArr.length; i++) {
        pem = pem + pemArr[i] + '\n';
    }
    pem = pem + '-----END PRIVATE KEY-----';
    
    var privateKey = new NodeRSA(pem);
    
    // load encryptModulesMap
    var encryptModulesMapContent = require(emmAbsolutePath);
    var moduleKeyArr = Object.keys(encryptModulesMapContent);
    for(var i=0; i<moduleKeyArr.length; i++) {
        var obj = encryptModulesMapContent[moduleKeyArr[i]];
        if (Array.isArray(obj)) {
            for(var j=0; j<obj.length; j++) {
                //checkObjFolder(obj[j]);
                //var content = fs.readFileSync(path.resolve(obj[j].from));
                //var encryedContent = privateKey.encryptPrivate(content);
                //fs.writeFileSync(obj[j].to, encryedContent, 'binary');
                doEncryptModule(privateKey, obj[j]);
            }
        } else {
            //checkObjFolder(obj);
            //var content = fs.readFileSync(path.resolve(obj.from));
            //var encryedContent = privateKey.encryptPrivate(content);
            //fs.writeFileSync(obj.to, encryedContent, 'binary');
            doEncryptModule(privateKey, obj);
        }
    }
} catch (e) {
    console.info(e);
}
