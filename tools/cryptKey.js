

var crypto = require('crypto');

var argv = process.argv;
if (argv.length != 3)
{
    console.log("\nThe Usage error.\n\nUsage: node cryptKey key\n");
    return;
}

var key = argv[2];
const cipher = crypto.createCipher('aes192', key);
var encrypted = cipher.update(JSON.stringify({ip:'127.0.0.1', port:1880}), 'utf8', 'hex')
encrypted += cipher.final('hex');
console.info("encrypted: ", encrypted);

var data = encrypted;
const decipher = crypto.createDecipher('aes192', key);
var decrypted = decipher.update(data, 'hex', 'utf8');
decrypted += decipher.final('utf8');

console.info("decrypted: ", decrypted);