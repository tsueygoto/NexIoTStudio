/**
 *
 */
var fs = require("fs");
var path = require("path");

var removeCtlM = function(dir) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);

        if(filename == "." || filename == "..") {
            // pass these files
        } else if(stat.isDirectory()) {
            // rmdir recursively
            console.log(filename);
            removeCtlM(filename);
        } else {
            // filter *.js fiilename
            var fileProperty = path.parse(filename);
            if (fileProperty.ext == '.js')
            {
                // found then remove Ctrl+M (0x0D)
                console.info("[removeCtlM]", filename);
                var content = fs.readFileSync(filename, 'utf8');
                fs.writeFileSync(filename, content.replace(/[\x0D]/g, ''), 'utf8');
            }
            //console.log("[]" + filename);
            //fs.unlinkSync(filename);
        }
    }
    //console.log("[removeCtlM]" + dir);
    //fs.rmdirSync(dir);
};

//console.log(__dirname);
//console.log(__dirname + "\\..\\node_modules");
removeCtlM(path.join(__dirname, "..", "node_modules"));


