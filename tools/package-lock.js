
var path = require('path');
var fs = require('fs');

// check package-lock.json
var file_package_lock = path.join(__dirname, '..', 'package-lock.json');
var file_package_lock_org = path.join(__dirname, '..', '.package-lock-org.json');
if (fs.existsSync(file_package_lock) && !fs.existsSync(file_package_lock_org)) {   // file is exist then rename to store
    //fs.renameSync(file_package_lock, file_package_lock_org);
    var fsExtra = require('fs-extra');
    fsExtra.copySync(file_package_lock, file_package_lock_org);
    
    var objLocDict = require(file_package_lock_org).dependencies;
    var objKeys = Object.keys(objLocDict);
    for(var i=0; i < objKeys.length; i++) {
        if (objLocDict[objKeys[i]].hasOwnProperty('dev')) {
            delete objLocDict[objKeys[i]];
        }
    }
    var file_package_lock_wo_dev = path.join(__dirname, '..', '.package-lock-wo-dev.json');
    fs.writeFileSync(file_package_lock_wo_dev, JSON.stringify(objLocDict, null, 2));
}



