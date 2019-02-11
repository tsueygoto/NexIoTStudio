
var when = require("when");
var crypto = require('crypto');
var encryptionAlgorithm = "aes-256-ctr";




var credentialCache = {};
var encryptionKey = null;
var defaultKey;

/**
 *
 */
function decryptCredentials(key,credentials) {
    var creds = credentials["$"];
    var initVector = new Buffer(creds.substring(0, 32),'hex');
    creds = creds.substring(32);
    var decipher = crypto.createDecipheriv(encryptionAlgorithm, key, initVector);
    var decrypted = decipher.update(creds, 'base64', 'utf8') + decipher.final('utf8');
    return JSON.parse(decrypted);
}

function load(credentials, encryptionKey) {
    dirty = false;
    /*
      - if encryptionEnabled === null, check the current configuration
    */
    var credentialsEncrypted = credentials.hasOwnProperty("$") && Object.keys(credentials).length === 1;
    //console.log(credentialsEncrypted);
    var setupEncryptionPromise = when.resolve();
    
    //if (encryptionEnabled === null) {
    //    var defaultKey;
    //    try {
    //        defaultKey = settings.get('_credentialSecret');
    //    } catch(err) {
    //    }
    //    if (defaultKey) {
    //        defaultKey = crypto.createHash('sha256').update(defaultKey).digest();
    //    }
    //    var userKey;
    //    try {
    //        userKey = settings.get('credentialSecret');
    //    } catch(err) {
    //        userKey = false;
    //    }
    //    if (userKey === false) {
    //        log.debug("red/runtime/nodes/credentials.load : user disabled encryption");
    //        // User has disabled encryption
    //        encryptionEnabled = false;
    //        // Check if we have a generated _credSecret to decrypt with and remove
    //        if (defaultKey) {
    //            log.debug("red/runtime/nodes/credentials.load : default key present. Will migrate");
    //            if (credentialsEncrypted) {
    //                try {
    //                    credentials = decryptCredentials(defaultKey,credentials)
    //                } catch(err) {
    //                    credentials = {};
    //                    log.warn(log._("nodes.credentials.error",{message:err.toString()}))
    //                }
    //            }
    //            dirty = true;
    //            removeDefaultKey = true;
    //        }
    //    } else if (typeof userKey === 'string') {
    //        log.debug("red/runtime/nodes/credentials.load : user provided key");
    //        // User has provided own encryption key, get the 32-byte hash of it
    //        encryptionKey = crypto.createHash('sha256').update(userKey).digest();
    //        encryptionEnabled = true;
    //
    //        if (defaultKey) {
    //            log.debug("red/runtime/nodes/credentials.load : default key present. Will migrate");
    //            // User has provided their own key, but we already have a default key
    //            // Decrypt using default key
    //            if (credentialsEncrypted) {
    //                try {
    //                    credentials = decryptCredentials(defaultKey,credentials)
    //                } catch(err) {
    //                    credentials = {};
    //                    log.warn(log._("nodes.credentials.error",{message:err.toString()}))
    //                }
    //            }
    //            dirty = true;
    //            removeDefaultKey = true;
    //        }
    //    } else {
    //        log.debug("red/runtime/nodes/credentials.load : no user key present");
    //        // User has not provide their own key
    //        encryptionKey = defaultKey;
    //        encryptionEnabled = true;
    //        if (encryptionKey === undefined) {
    //            log.debug("red/runtime/nodes/credentials.load : no default key present - generating one");
    //            // No user-provided key, no generated key
    //            // Generate a new key
    //            defaultKey = crypto.randomBytes(32).toString('hex');
    //            try {
    //                setupEncryptionPromise = settings.set('_credentialSecret',defaultKey);
    //                encryptionKey = crypto.createHash('sha256').update(defaultKey).digest();
    //            } catch(err) {
    //                log.debug("red/runtime/nodes/credentials.load : settings unavailable - disabling encryption");
    //                // Settings unavailable
    //                encryptionEnabled = false;
    //                encryptionKey = null;
    //            }
    //            dirty = true;
    //        } else {
    //            log.debug("red/runtime/nodes/credentials.load : using default key");
    //        }
    //    }
    //}
    //if (encryptionEnabled && !dirty) {
    //    encryptedCredentials = credentials;
    //}
    
    //var defaultKey = "401d4d589d4c323ce9c26d1e3cfe7c34636f8dc9b01223e5579457a98a9f12b0";
    //defaultKey = crypto.createHash('sha256').update(defaultKey).digest();
    //credentials = decryptCredentials(defaultKey,credentials);
    //console.log("credentials : ", credentials);
    
    //credentials = decryptCredentials(defaultKey,credentials)
    
    return setupEncryptionPromise.then(function() {
        if (credentials.hasOwnProperty("$")) {
            // These are encrypted credentials
            try {
                credentialCache = decryptCredentials(encryptionKey,credentials);
                //console.log(credentialCache);
            } catch(err) {
                credentialCache = {};
                dirty = true;
                //log.warn(log._("nodes.credentials.error",{message:err.toString()}))
                console.log(err.toString());
            }
        } else {
            credentialCache = credentials;
        }
    });
}

/**
 *
 */
function usage()
{
    var usage = '----------------------------------------------------------------\n' + 
                '   Usage:\n' + 
                '       node getCredential\n\n' +
                '   The credential file is .node-red\\flows-ISCD_cred.json\n' + 
                '   [key] in .node-red\\.config.json file\n' +
                '----------------------------------------------------------------\n';
    console.log(usage);
}

/**
 * main
 */
if ( process.argv.length > 3) {
    usage();
    return;
}

function parseJSON(data) {
    if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1)
    }
    return JSON.parse(data);
}

var fs = require('fs');
function readFile(path,backupPath,emptyResponse,type) {
    return when.promise(function(resolve) {
        fs.readFile(path,'utf8',function(err,data) {
            if (!err) {
                if (data.length === 0) {
                    // log.warn(log._("storage.localfilesystem.empty",{type:type}));
                    console.log("storage.localfilesystem.empty",{type:type});
                    try {
                        var backupStat = fs.statSync(backupPath);
                        if (backupStat.size === 0) {
                            // Empty flows, empty backup - return empty flow
                            return resolve(emptyResponse);
                        }
                        // Empty flows, restore backup
                        // log.warn(log._("storage.localfilesystem.restore",{path:backupPath,type:type}));
                        console.log("storage.localfilesystem.restore",{path:backupPath,type:type});
                        fs.copy(backupPath,path,function(backupCopyErr) {
                            if (backupCopyErr) {
                                // Restore backup failed
                                // log.warn(log._("storage.localfilesystem.restore-fail",{message:backupCopyErr.toString(),type:type}));
                                console.log("storage.localfilesystem.restore-fail",{message:backupCopyErr.toString(),type:type});
                                resolve([]);
                            } else {
                                // Loop back in to load the restored backup
                                resolve(readFile(path,backupPath,emptyResponse,type));
                            }
                        });
                        return;
                    } catch(backupStatErr) {
                        // Empty flow file, no back-up file
                        return resolve(emptyResponse);
                    }
                }
                try {
                    //console.log(data);
                    return resolve(parseJSON(data));
                } catch(parseErr) {
                    // log.warn(log._("storage.localfilesystem.invalid",{type:type}));
                    console.log("storage.localfilesystem.invalid",{type:type});
                    return resolve(emptyResponse);
                }
            } else {
                if (type === 'flow') {
                    // log.info(log._("storage.localfilesystem.create",{type:type}));
                    console.log("storage.localfilesystem.create",{type:type});
                }
                resolve(emptyResponse);
            }
        });
    });
}

var defaultKey = process.argv[2];

// var cred = require('../.node-red/.flows-ISCD_cred.json.backup');
//var credentialsFile = '../.node-red/flows-ISCD_cred.json';
var credentialsFile = '../.node-red/OCD/config.json';
var credentialsFileBackup = '.flows-ISCD_cred.json.backup';
var cred = readFile(credentialsFile,credentialsFileBackup,{},'credentials').then(function(cred) {
    console.log(cred, cred);
    defaultKey = crypto.createHash('sha256').update(defaultKey).digest();
    load(cred, defaultKey).then(function(){
    console.log(JSON.stringify(credentialCache, null, 4));
});

});


//var defaultKey = require('../.node-red/.config.json')._credentialSecret;
//console.log("Key : " + defaultKey);
//
////defaultKey = "401d4d589d4c323ce9c26d1e3cfe7c34636f8dc9b01223e5579457a98a9f12b0";
//defaultKey = process.argv[2];
//defaultKey = crypto.createHash('sha256').update(defaultKey).digest();
//load(cred, defaultKey).then(function(){
//    console.log(JSON.stringify(credentialCache, null, 4));
//});
