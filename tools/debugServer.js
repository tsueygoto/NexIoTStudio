var net = require('net');
var fs = require('fs');

var server = net.createServer(function(socket)
{
    var writeStream = fs.createWriteStream('./log.txt');
	//socket.write('Echo server\r\n');
	//socket.pipe(socket);

    socket.on('data', function(data)
    {
        var convert = data.toString('utf8');
        writeStream.write(convert);
        console.log(convert);
    });
    
    socket.on('error', function(err)
    {
        writeStream.end('');
        console.log(err);
    });

});


server.listen(1337, '127.0.0.1');