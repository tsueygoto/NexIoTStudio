/**
 *
 */
 
var path = require('path');


var fs = require('fs');
var deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};


var targetFolders = [
    path.join(__dirname, '../../public', 'ocd'),    // ocd in public
    path.join(__dirname, '../../.node-red', 'OCD')  // OCD in userDir
];

for (var i=0; i<targetFolders.length; i++)
{
    console.log(targetFolders[i]);
    deleteFolderRecursive(targetFolders[i]);
}

