
//var fs = require('fs');


//module.exports.constants = {
//    COPYFILE_EXCL
//};

//fs.copyFileSync || copyFileSync;

module.exports = function copyFileSync(src, dest, flag)
{
    'use strict';
    var fs = require('fs');

    var COPYFILE_EXCL = 1;
    var SIZE = 65536;
    
    check(src, dest, flag);
    
    var writeFlag = (flag === COPYFILE_EXCL) ? 'wx' : 'w';
    
    var stats = fs.statSync(src);
    
    var fdSrc = fs.openSync(src, 'r');
    var fdDest = fs.openSync(dest, writeFlag, stats.mode);
    
    var length = stats.size < SIZE ? stats.size : SIZE;
    
    var position = 0;
    var peaceSize = stats.size < SIZE ? 0 : stats.size % SIZE;
    var offset = 0;
    
    var buffer = Buffer.allocUnsafe(length);
    for (var i = 0; length + position + peaceSize <= stats.size; i++, position = length * i) {
        fs.readSync(fdSrc, buffer, offset, length, position);
        fs.writeSync(fdDest, buffer, offset, length, position);
    }
    
    if (peaceSize) {
        var length = peaceSize;
        buffer = Buffer.allocUnsafe(length);
        
        fs.readSync(fdSrc, buffer, offset, length, position);
        fs.writeSync(fdDest, buffer, offset, length, position);
    }
    
    fs.closeSync(fdSrc);
    fs.closeSync(fdDest);
}

function check(src, dest, flags) {
    if (typeof dest !== 'string')
    {
        throw TypeError('dest must be a string');
    }
    
    if (typeof src !== 'string')
    {
        throw TypeError('src must be a string');
    }
    
    if (typeof flags === 'number' && flags && flags !== 1)
    {
        throw Error(`EINVAL: invalid argument, copyfile -> '${dest}'`);
    }
}
