/**
 *
 */
 
var path = require('path');

var settingsPath = path.join(__dirname, '../../settings.js');
var settings = require(settingsPath);
if(settings.hasOwnProperty('ocdConf'))
{
    
}

console.log(settings);

