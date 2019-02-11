/**
 *
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
 **/

var fs = require("fs");
var path = require("path");

var packageFileCount = 0;
var modules = {};

function outConsole(content) {
    process.stdout.write(content + '\r');
}

/**
 */
var travelDir = function(dir) {
    var list = fs.readdirSync(dir);
    // got the list numbers
    //var total = count + list.length;
    for(var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);

        if(filename == "." || filename == "..")
        {
            // pass these files
            //total = total - 1;
        } else if(stat.isDirectory()) {
            // rmdir recursively
            // console.log(filename);
            travelDir(filename);
            //total = total - 1;
        } else if (path.basename(filename) == 'package.json') {
            // rm fiilename
            //console.log("[package][" + filename);
            packageFileCount++;
            //console.info("Package File Count : ", packageFileCount);
            outConsole("Package File Count         : " + packageFileCount);
            
            var module = require(filename);
            var key = module.name+"@"+module.version;
            
            if (!modules.hasOwnProperty(key)) {
                var licenseType = "";
                if (module.hasOwnProperty('license')) {
                    licenseType = module.license;
                } else if (module.hasOwnProperty('licenses')) {
                    //licenseType = module.licenses[0].type;
                    // check object or array
                    try {
                        if (Array.isArray(module.licenses)) {
                            licenseType = module.licenses[0].type;
                        } else {
                            licenseType = module.licenses.type;
                        }
                    } catch(e) {
                        console.info("error:", e);
                        return;
                    }
                }
                
                if (licenseType != "") {
                    modules[module.name+"@"+module.version] = {
                        "licenses" : licenseType,
                        "path" : path.dirname(filename)
                    };
                }
            }
        }
    }
};

// process parameters
var argv = process.argv;
if ((argv.length != 3) && (argv.length != 4)) {
    console.log("\nUsage:\n   node %s {(in)targetPath} {(out)OutFilePath}\n", path.basename(argv[1]));
    console.log("   (out)OutFilePath : is optional.");
    console.log("                      default is output.json.");
    return;
}

// check target folder path is exist !!!
var absolutePath = path.resolve(argv[2]);
console.log("The target absolute path = %s\n", absolutePath);
if (!fs.existsSync(absolutePath)) {
    console.log("[ERROR] The target absolute path [%s] is not exist.", absolutePath);
    return;
}

var outFilePath = "./output.json";
if (argv[3]) {
    outFilePath = path.resolve(argv[3]);
}
console.log("The output file absolute path = %s\n", outFilePath);

// console position control
console.log("\n\n\n\n");
process.stdout.write("\x1b[A");
process.stdout.write("\x1b[A");
process.stdout.write("\x1b[A");
process.stdout.write("\x1b[A");
process.stdout.write("\x1b[A");

// do travel target directory
travelDir(absolutePath);
console.log("\nTotal Package File Count   : %s", packageFileCount);

fs.writeFileSync(outFilePath, JSON.stringify(modules, null, 2), 'utf-8');
console.info("The Output Module List ile : %s", outFilePath);
