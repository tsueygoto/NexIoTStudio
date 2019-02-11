

/*
0    3400-7000-00000001     
1    4300-7000-00000001     
2    5200-7000-00000001
3    6100-7000-00000001
*/

//const NEX_LIC_TRIAL        0x01;
const NEX_LIC_EDUCATION    = 0x02;
const NEX_LIC_STANDARD     = 0x03;
const NEX_LIC_PROFESSIONAL = 0x04;
//const NEX_LIC_OEM          0x80;        // Bit definition


function checkValid( oSN )
{
    var ret = {
        ecode : 0
    };
    // XXXS check
    var xxxsum = oSN['0'][0] + oSN['0'][1] + oSN['0'][2];
    if ((xxxsum % 7) != oSN['0'][3])
    {
        ret.ecode = 1;
        ret.emsg = "XXXS checksum error!"
        return ret;
    }
    // YYYS check
    var yyysum = oSN['1'][0] + oSN['1'][1] + oSN['1'][2]
    if ((yyysum % 7) != oSN['1'][3])
    {
        ret.ecode = 2;
        ret.emsg = "YYYS checksum error!"
        return ret;
    }
    // ZZZZZZZS check
    var zzzzzzzsum = xxxsum + yyysum + oSN['2'][0] + oSN['2'][1] + oSN['2'][2] + oSN['2'][3] + oSN['2'][4] + oSN['2'][5] + oSN['2'][6];
    if ((zzzzzzzsum % 13) != oSN['2'][7])
    {
        ret.ecode = 3;
        ret.emsg = "ZZZZZZZS checksum error!"
        return ret;
    }
    
    return ret;
}

function parseSN( oSN )
{
    var licenseType = "NEX_LIC_EDUCATION";
    // check valid sn
    var ret = checkValid( oSN );
    
    if ( ret.ecode == 0 )
    {
        //console.info(oSN, " SN is valid.");
        var snLicenseType = oSN['0'][0];
        
        //if ((snLicenseType == 1) || (snLicenseType == 2))
        //{
        //    licenseType = NEX_LIC_EDUCATION;
        //}
        if ((snLicenseType == 3) || (snLicenseType == 4))
        {
            licenseType = "NEX_LIC_STANDARD";
        }
        else if ((snLicenseType == 5) || (snLicenseType == 6))
        {
            licenseType = "NEX_LIC_PROFESSIONAL";
        }
        else if (snLicenseType == 7)    // Reserved
        {
            licenseType = "NEX_LIC_EDUCATION";
        }
        //else if ((snLicenseType >= 8) && (snLicenseType <= 15))
        //{
        //    licenseType = NEX_LIC_OEM;
        //    oemKey = oSN['1'][0].toString(16) + oSN['1'][1].toString(16);
        //    console.info("OEM Key : ",oemKey);
        //}
    }
    else
    {
        console.info(oSN, " SN is invalid.", ret);
    }
    
    
    return licenseType;
}

//var sn = "1F91-9353-C52376AA";
//var oSN = {};
//
//var sed = sn.split('-');
//sed.map(function(value, index, arr){
//    //console.info(value);
//    oSN[index] = value.split('').map(x => parseInt(x,16));
//    if (index == (arr.length-1))
//    {
//        console.info(oSN);
//        parseSN(oSN);
//    }
//});

function checkSN(sn, cb)
{
    var oSN = {};
    try {
        var sed = sn.split('-');
        //console.info("sed : ", sed);
        sed.map(function(value, index, arr)
        {
            oSN[index] = value.split('').map(x => parseInt(x,16));
            if (index == (arr.length-1))
            {
                //console.info("oSN:", oSN);
                cb(parseSN(oSN));
            }
        });
    } catch(e) {
        console.info("err : ", e);
        cb("NEX_LIC_EDUCATION");
    }
}

function checkSN2(sn)
{
    try {
        var sed = sn.split('-');
        sed.map(function(value, index, arr)
        {
            oSN[index] = value.split('').map(x => parseInt(x,16));
            if (index == (arr.length-1))
            {
                console.info(oSN);
                //cb(parseSN(oSN));
                return new Promise(resolve => {
                    resolve(oSN);
                })
            }
        });
    } catch(e)
    {
        //cb(NEX_LIC_EDUCATION);
        return new Promise(resolve => {
            resolve(NEX_LIC_EDUCATION);
        })
    }
}

/**
    Get the license Type wording.
    
    TBD: l10n
    
 */
function getLicenseTerm(licenseType) {
    var wording = "Education";
    switch(licenseType) {
        case "NEX_LIC_STANDARD" :
            wording = "Standard";
            break;
        case "NEX_LIC_PROFESSIONAL" :
            wording = "Professional";
            break;
    }  
    return wording;
}

module.exports = {
    checkSN: checkSN,
    checkSN2: checkSN2,
    getLicenseTerm: getLicenseTerm
};


