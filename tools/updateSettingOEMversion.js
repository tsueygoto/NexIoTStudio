var fs = require('fs');
var path = require('path');

/**
    main
 */    

// process parameters
var argv = process.argv;
if ((argv.length != 3)) {
    console.log("\nUsage:\n   node %s {[in]oemversion}\n", path.basename(argv[1]));
    console.log("   [in]oemversion        : OEM release version.");
    return;
}

/**
    process OEM version for
    settings.js in folder
        iot-studio/settings.js
        iot-studio/HyperX/hyperx_settings.js    
 */

 var updateFileList = [
	path.join(__dirname, '..', 'settings.js'),
    path.join(__dirname, '..', 'HyperX', 'hyperx_settings.js'),
    path.join(__dirname, '..', 'ISCD', 'settings.js')
];
 
for(var i=0; i<updateFileList.length; i++) {
    //console.log(updateFileList[i]);
    var filePath = path.resolve(updateFileList[i]);
    var content = fs.readFileSync(filePath, 'utf-8');
    //console.log(content);
    var newString = content.replace(/oemversion:\s+'(.*)',/, "oemversion: '" + argv[2] + "',");
    fs.writeFileSync(filePath, newString, 'utf-8');    
}



