//
var fs = require('fs');
var path = require('path');

var settingsPath = path.resolve(path.join(__dirname, "..", "settings.js"));
var settings = require(settingsPath);
var dashboardAccPath = path.resolve(path.join(__dirname, "..", ".node-red", ".dash", "user_conf.json"));
var dashboardAcc = require(dashboardAccPath);
var dashboardAccs = Object.keys(dashboardAcc);

/**
 */ 
function updateAccConfig() {
    var output = "module.exports = " + JSON.stringify(settings, null, 4);

    // process port
    function replacer(match, p1, p2, p3, offset, string) {
      // p1 is nondigits, p2 digits, and p3 non-alphanumerics
      return p1 + " process.env.PORT || " + p3;
    }
    var newString = output.replace(/("uiPort":)(\s+)(\d+)/, replacer);
    
    fs.writeFileSync(settingsPath, newString);
    fs.writeFileSync(dashboardAccPath, JSON.stringify(dashboardAcc, null, 4));
}

/**
*/
function outConvert(role) {
    return (role == 0 ) ? "*" : "read";
}

/**
 */
function doList() {
    var acc = settings.adminAuth.users;
    for (var index=0; index < acc.length; index++) {
        var dbRole = null;
        if (dashboardAccs.indexOf(acc[index].username) != -1) {
            dbRole = dashboardAcc[acc[index].username].role;
        }
        console.log("%s,%s,%s", acc[index].username, acc[index].permissions, outConvert(dbRole));
    }
}

/**
 */
function doAdd(argv) {
    // argv needs acc,pwd,iotRole,dashboarRole
    if (argv.length != 7) {
        showUsage();
        return;
    }
    var acc = argv[3];
    var pwd = argv[4];
    var iotR = argv[5];
    var dashboardR = argv[6];
    // acc exist or not
    pos = settings.adminAuth.users.map(function(e) { return e.username; }).indexOf(acc);
    if (pos != -1) {
        console.log("%s is exist.", acc);
        return;
    }
    // check right must be 
    //  iot         :   * / right
    //  dashboard   :   0 / 1
    if ((iotR != "*") && (iotR != "read")) {
        console.log("%s is invlaid. [*/read]", iotR);
        return;
    }
    if ((dashboardR != "*") && (dashboardR != "read")) {
        console.log("%s is invlaid. [*/read]", dashboardR);
        return;
    }
    dashboardR = (dashboardR == "*") ? 0 : 1;

    // add new account
    var bcryptjs = require('bcryptjs');
    var encryptPwd = bcryptjs.hashSync(pwd,8);
    var iotAcc = {
        "username": acc,
        "password": encryptPwd,
        "permissions": iotR
    };
    settings.adminAuth.users.push(iotAcc);
    //console.log(settings.adminAuth.users);
    var dbAcc = {
        "password": encryptPwd,
        "dashboardList":[],
        "role" : dashboardR
    };
    dashboardAcc[acc] = dbAcc;
    //console.log(dashboardAcc);

    updateAccConfig();
}

/**
 */
function doDel(argv) {
    // argv needs acc
    if (argv.length != 4) {
        showUsage();
        return;
    }
    
    var acc = argv[3];

    // acc exist or not
    pos = settings.adminAuth.users.map(function(e) { return e.username; }).indexOf(acc);
    if (pos == -1) {
        console.log("%s is NOT exist.", acc);
        return;
    }
    if (acc == "admin") {
        console.log("%s can't be deleted.", acc);
        return;
    }

    // del account
    settings.adminAuth.users.splice(pos, 1);
    //console.log(settings.adminAuth.users);
    
    if (dashboardAcc.hasOwnProperty(acc)) {
        delete dashboardAcc[acc];
    }
    //console.log(dashboardAcc);

    updateAccConfig();
}


/**
 */
function doMod(argv) {
    // argv needs acc,pwd,iotRole,dashboarRole
    if (argv.length != 7) {
        showUsage();
        return;
    }
    var acc = argv[3];
    var pwd = argv[4];
    var iotR = argv[5];
    var dashboardR = argv[6];
    var preData = {};
    
    // acc exist or not
    var pos = settings.adminAuth.users.map(function(e) { return e.username; }).indexOf(acc);
    if (pos == -1) {
        console.log("%s is NOT exist.", acc);
        return;
    } else {
        // acc is exist to extract previous data
        preData.acc = acc;
        preData.pwd = settings.adminAuth.users[pos].password;
        preData.iotR = settings.adminAuth.users[pos].permissions;
        if (dashboardAcc.hasOwnProperty(acc)) {
            preData.dashboardR = dashboardAcc[acc].role;
        } else {
            preData.dashboardR = 1;
        }
        //console.log(preData);
    }

    // if iotR == null means to skip
    if (iotR != "null") {
        // check right must be 
        //  iot         :   * / right
        if ((iotR != "*") && (iotR != "read")) {
            console.log("%s is invlaid. [*/read]", iotR);
            return;
        }
    } else {
        iotR = preData.iotR;
    }
    
    // if dashboardR == null means to skip
    if (dashboardR != "null") {
        // check right must be 
        //  dashboard   :   0 / 1
        if ((dashboardR != "*") && (dashboardR != "read")) {
            console.log("%s is invlaid. [*/read]", dashboardR);
            return;
        }
        dashboardR = (dashboardR == "*") ? 0 : 1;
    } else {
        dashboardR = preData.dashboardR;
    }

    // if password == null means to skip
    if (pwd != "null") {
        var bcryptjs = require('bcryptjs');
        var encryptPwd = bcryptjs.hashSync(pwd,8);
    } else {
        encryptPwd = preData.pwd;
    }
    //console.log("%s,%s,%s,%s", acc, encryptPwd, iotR, dashboardR);
    
    var iotAcc = {
        "username": acc,
        "password": encryptPwd,
        "permissions": iotR
    };

    // modify new account
    settings.adminAuth.users[pos] = iotAcc;
    //console.log(settings.adminAuth.users);
    
    var dbAcc = {
        "password": encryptPwd,
        "dashboardList":[],
        "role" : dashboardR
    };
    dashboardAcc[acc] = dbAcc;
    //console.log(dashboardAcc);

    updateAccConfig();
}

/**
 */
function showUsage() {
    console.log("\nUsage:\n   node %s {[in]func} [{[in]paramters}]\n", path.basename(argv[1]));
    console.log("   [in]func      : list/add/del/mod");
    console.log("   [in]paramters : ");
    console.log("       if func = list then ignore parameters.");
    console.log("       if func = add then parameters = accunt password iot_role dashboard_role");
    console.log("       if func = del then parameters = accunt");
    console.log("       if func = mod then parameters = accunt password iot_role dashboard_role [if want to ignore one parameter please set null]");
}


/** main **/

// process parameters
var argv = process.argv;
if (argv.length < 3) {
    showUsage();
    return;
}

switch(argv[2].toLowerCase()) {
    case "list":
        doList();
        break;
    case "add":
        doAdd(argv);
        break;
    case "del":
        doDel(argv);
        break;
    case "mod":
        doMod(argv);
        break;
    default:
        // unknown
        showUsage();
}