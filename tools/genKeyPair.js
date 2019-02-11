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
 *
 * genKeyPair
 *
 **/

var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');

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

// process parameters
var argv = process.argv;
if ((argv.length != 3)) {
    console.log("\nUsage:\n   node %s {[in]KeyPairLocation}\n", path.basename(argv[1]));
    console.log("   [in]KeyPairLocation        : the key pair location.");
    return;
}

// check key pair location is exist !!!
var kpAbsolutePath = path.resolve(argv[2]);
console.log("The key pair location = %s\n", kpAbsolutePath);
if (!fs.existsSync(kpAbsolutePath)) {
    verifyBuildFolder(kpAbsolutePath);
}

var key = new NodeRSA({b: 2048});
var keyPair = key.generateKeyPair(2048, 65537);
var privatekey = keyPair.exportKey('pkcs8-private-pem');

var content = privatekey.replace(/\n/g,"");
var re = /-----BEGIN PRIVATE KEY-----(.+)-----END PRIVATE KEY-----/;
var ret = content.match(re);
if (ret != null) {
    //console.log(ret[1]);
    fs.writeFileSync(path.join(kpAbsolutePath, '.privatekey'), ret[1], 'utf8');
}

var publickey = keyPair.exportKey('pkcs8-public-pem');

content = publickey.replace(/\n/g,"");
re = /-----BEGIN PUBLIC KEY-----(.+)-----END PUBLIC KEY-----/;
ret = content.match(re);
if (ret != null) {
    //console.log(ret[1]);
    fs.writeFileSync(path.join(kpAbsolutePath, '.publickey'), ret[1], 'utf8');
}

fs.writeFileSync(path.join(kpAbsolutePath, 'keyPair.txt'), privatekey + "\n" + publickey, 'utf8');
console.log("the keyPair.txt is done.")

