
var App = App || {};

App.Login = ( function() {

    var dfd;

    function processAccount() {
        dfd = $.Deferred();
        //$.getJSON( "api/user/configure" ).done( function( data , status , xhr ) {
        //    App.Model.Dashboard.checkSysConfDebug()&&console.log("*************************** api/user/configure");
        //    App.Model.Dashboard.checkSysConfDebug()&&console.log(data);
        //    if( data.hasOwnProperty( "sysconf" ) ) App.Model.Dashboard.setSysConf( data.sysconf );
        //    //if( data.hasOwnProperty( "dashboards" ) ) App.Model.Dashboard.unserializeAll( data.dashboards );
        //    dfd.resolve();
        //} );
        return dfd.promise();
    }
    
    function verifyAccount() {
        dfd.resolve();
        return dfd.promise();
    }

    return {
        processAccount : processAccount,
        verifyAccount : verifyAccount
    };

})();


/**
    for login page (.login-form) call    
 */
function dashboardLogin (form) {
    //event.preventDefault();
    name = form.name.value;
    password = form.pwd.value;
    // check account
    var dfd = $.Deferred();
    //console.info("login ....");
    $.post( "login", { name: name, pwd: password })
        .done(function( data , status , xhr ) {
            // App.Model.Package.setData( data );
            console.info("Server response user info : ", data);
            try {
                var obj = JSON.parse(data);
                if (obj.hasOwnProperty('name') && 
                    obj.hasOwnProperty('role') && 
                    obj.hasOwnProperty('dashboardList')) {
                     
                    $('#login-form-msg').val("            ");
                    $(".login-page").hide();
                    var cookieID = App.Configure.genRandomID(64);
                    App.Configure.createCookie('iotdashboard', data, 1);
                    window.location.href = "";
                    dfd.resolve(data);
                } else {
                    if (obj.hasOwnProperty('body')) {
                        console.log("obj.body.error", obj.body.error);
                        
                        if (obj.body.error == "server_error") {
                            // popup message
                            // console.log("obj.body.error_description", obj.body.error_description, null, null, true);
                            App.Modal.show("Warning Message", "Too many login failures. Please try again in 10 minutes.", null, null, true);
                        }
                    }
                    $('#login-form-msg').val('Login failed');
                    dfd.reject("response data incorrect.");
                }
            } catch(e) {
                $('#login-form-msg').val('Login failed');
                dfd.reject("login fail.");
            }
        })
        .fail(function(err) {
            console.info("Server response fail : ", err);
            $('#login-form-msg').val('Server response fail');
            $('#login-form-msg').show();
            dfd.reject("Server response fial");
        });
    return dfd.promise();   
}
