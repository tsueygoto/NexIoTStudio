/**
 *
 */
 
var when = require("when");
var iothub = require('azure-iothub');
var connectionString = "HostName=MyTestIoTHub002.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=Vk7gO6fsVdkyt7m2Om60rRa6HRMIrjnTjyBKKL7Kj18=";
var hostname = iothub.ConnectionString.parse(connectionString).HostName;

var registry = iothub.Registry.fromConnectionString(connectionString);

var arrDeviceId = [
    "ocd_00002",
    "ocd_00003",
    "ocd_00004",
    "ocd_00005",
    "ocd_00006",
    "ocd_00007",
    "ocd_00008"
];

var device = {
    deviceId: "ocd_00001"
};

/**
 *
 */
function genConnectionString(device) {
  return 'HostName=' + hostname + ';' +
    'DeviceId=' + device.deviceId + ';' +
    'SharedAccessKey=' + device.authentication.SymmetricKey.primaryKey;
}           
           
function regDevice(arrDevices, cb) {
    var device = {
        deviceId : arrDevices.pop()
    };
    
    if (device.deviceId == undefined) 
    {
        //console.log("no device !!!");
        cb();
        return;
    }
    else
    {
        registry.create(device, function(err, deviceInfo, resp) 
        {
            if (err)
            {
                registry.get(device.deviceId, function(err, deviceInfo, resp)
                {
                    console.info("ERR : ", genConnectionString(deviceInfo));
                    regDevice(arrDevices, cb);
                    //ocdConf.connectionString = connectionString(deviceInfo);
                    //fs.writeFileSync(ocdConfFile, JSON.stringify(ocdConf, null, 4));
                    //printDeviceInfo(err, deviceInfo, resp);
                    //res.json("iot device already registried!!!");
                });
            }
            else if (deviceInfo) {
                console.info("OK : ", genConnectionString(deviceInfo));
                //ocdConf.connectionString = genConnectionString(deviceInfo);
                //fs.writeFileSync(ocdConfFile, JSON.stringify(ocdConf, null, 4));
                //printDeviceInfo(err, deviceInfo, resp);
                //res.json("iot device registry OK!");
                regDevice(arrDevices, cb);
            }
        });

    }
}
           
           
           
//setupEncryptionPromise = registry.create(device, function(err, deviceInfo, resp) 
//{
//    if (err)
//    {
//        registry.get(device.deviceId, function(err, deviceInfo, resp)
//        {
//            console.info("ERR : ", genConnectionString(deviceInfo));
//            //ocdConf.connectionString = connectionString(deviceInfo);
//            //fs.writeFileSync(ocdConfFile, JSON.stringify(ocdConf, null, 4));
//            //printDeviceInfo(err, deviceInfo, resp);
//            //res.json("iot device already registried!!!");
//        });
//    }
//    if (deviceInfo) {
//        console.info("OK : ", genConnectionString(deviceInfo));
//        //ocdConf.connectionString = genConnectionString(deviceInfo);
//        //fs.writeFileSync(ocdConfFile, JSON.stringify(ocdConf, null, 4));
//        //printDeviceInfo(err, deviceInfo, resp);
//        //res.json("iot device registry OK!");
//    }
//});


//var setupEncryptionPromise = when.resolve();
//
//setupEncryptionPromise.then(function(){
//    console.log("Completed!!!");
//});

function callback() {
    console.log("Call Callback!!!");
}

regDevice(arrDeviceId, callback);