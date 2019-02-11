/**
 *
 */
var fs = require("fs");
var path = require("path");
//var query = require('cli-interact');
var packageFileCount = 0;
var modules = {};

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
            console.info("Package File Count : ", packageFileCount);
            
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
                    //console.info(modules[module.name+"@"+module.version]);
                }
            }
            
            //var out = filename;
            //if (out.length > 50) {
            //    out = "..." + out.slice(-47);
            //}
            //var index = "";
            //if (total < 100000000) 
            //{
            //    var padZero = "00000000";
            //    //console.info(total.toString(), total.toString().length);
            //    index = padZero.slice(0, 8-(total.toString().length)) + total.toString();
            //}
            //console.info("[rm] ", index, out);
            //fs.unlinkSync(filename);
            //total = total - 1;
            
            
            
        }
    }
    //console.log("[rm]" + dir);
    //fs.rmdirSync(dir);
    //total = total - 1;
};

var argv = process.argv;
if (argv.length != 3)
{
    console.log("\nThe Usage error.\n\nUsage: node remove_modules targetPath\n");
    return;
}

var absolutePath = path.resolve(argv[2]);
console.log("The target path = " + absolutePath);
if (!fs.existsSync(absolutePath))
{
    console.log("[ERROR] The target path [" + absolutePath + "] is not exist.");
    return;
}

//var	query = require('cli-interact').getYesNo;
//var answer = query.getYesNo('Really want to remove ' + absolutePath + ' folder?');
//if (answer) {
travelDir(absolutePath);
//}
//console.info("Total package.json files : ", fileCount);
console.info("\nTotal Package File Count : ", packageFileCount);
var content = JSON.stringify(modules, null, 2);
fs.writeFileSync("./output.json", content, 'utf-8');
console.info("The final modules : ", content);
