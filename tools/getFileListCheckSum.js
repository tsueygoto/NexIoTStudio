

const path = require('path');
const targetFolder = path.join('..', 'nodes', 'dashboard', 'static', 'images');
const fs = require('fs');
const crypto = require('crypto');


function generateChecksum(str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex');
}

var ofilechecksum = {};
fs.readdirSync(targetFolder).forEach(file => {
	console.log(file);
	var filePath = path.join(targetFolder, file);
	var stats = fs.statSync(filePath);
	if (stats.isFile()) {
		var content=fs.readFileSync(filePath);
  		var checksum = generateChecksum(content);
		//console.log(checksum);
		ofilechecksum[file] = checksum;
	}
})

console.log(ofilechecksum);



