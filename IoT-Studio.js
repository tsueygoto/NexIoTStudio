//var cp = require('child_process');
//var nodejs_path = '/opt/IoT-Studio/node ';
//var commandLine = 'node --expose-gc "' + __dirname + '/red.js"  -s "' + __dirname+'/settings.js"'
//console.log(commandLine);
//exec
//cp.exec(commandLine/*command*/,{}/*options, [optiona]l*/, function(err, stdout, err) {
//    console.log(err);
//    console.log(stdout);
//    console.log(err);
//})

var spawn = require('child_process').spawn;
var isd = spawn('node', ['--expose-gc', 'red.js', '-s', 'settings.js'] );
console.log("spawn : " + isd.spawnargs);

isd.stdout.on('data', function (data) {
  console.log(data.toString().replace(/\n$/, ''));
});

isd.stderr.on('data', function (data) {
  console.log('stderr: ' + data.toString());
});

isd.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
});