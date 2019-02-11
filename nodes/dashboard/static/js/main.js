
var App = App || {};

App.Main = ( function()
{
    function init()
    {
        var dfd = $.Deferred();
        
        console.info("App.Controller : ", App.Controller);
        for( var key in App.Controller ) {
            if (App.Controller.hasOwnProperty(key)) {
                App.Controller[key].init();
            }
        }

        //console.log("ch" + location);
        //console.dir(location);

        // check url for specific board id
        //var id = location.pathname.match(/\/dash\/board\/([0-9]*)/g) || []
        var pageId = /\/dash\/board\/(\d+)/.exec(location.pathname);
        var targetId = -1;
        if (pageId != null)
        {
            targetId = pageId[1];
        }
        
        var role = $('#userDashboard').attr("role");
        if ( role == 0 ) // admin
        {
            
        }
        else // none-admin
        {
            
        }
        
        /**
            according url to decide main page or board page
            if main page then load all board list but didn't load plugins & datasources
            else
                means to laod specify board
                if login user is admin need to load all plugins & datasources
                else
                    means non-admin then load used plugins
         */
        var targetSettings;
        App.Settings.loadSettings(targetId)
            .done( function(data) 
            {
                var usedPlugins = null;
                var usedDss = null;
                
                targetSettings = data;
                console.info("ID:", targetId, " Data:", data);
                if ( targetId != -1) // need to find all need plugin
                {
                    console.info(data.dashboards[0]);
					localStorage.setItem("dashboardName",data.dashboards[0].name); /*kewei added*/
                    var board = data.dashboards[0];
                    usedPlugins = [];
                    usedDss = [];
                    for(var i=0; (board.charts != null) && (i<board.charts.length); i++)
                    {
                        // process plugin
                        if ((board.charts[i].plugin) && (usedPlugins.indexOf(board.charts[i].plugin) == -1))
                        {
                            usedPlugins.push(board.charts[i].plugin);
                        }
                        // process datasources
                        for (var j=0; j<board.charts[i].datasources.length; j++)
                        {
                            if (usedDss.indexOf(board.charts[i].datasources[j].id) == -1)
                            {
                                usedDss.push(board.charts[i].datasources[j].id);
                            }
                        }
                        
                    }
                    console.info("Used Plugins : ", usedPlugins);
                    console.info("Used Datasources : ", usedDss);
                }
         
                if (targetId != -1) // specified board
                {
                    // when login admin then load all plugins and datasources
                    if (role == 0)
                    {
                        usedPlugins = null;
                        usedDss = null;
                    }

                    App.Plugins.loadPlugins(usedPlugins)
                        .done( function() {
                            App.Model.Datasource.getDatasources(usedDss)
                                .done( function() {
                                    App.Configure.loadPackageInfo()
                                        .done( function() {
                                            // adjust Dropdown Menu
                                            App.View.Dashboard.adjustDropdownMenuHeight();
                                            // set Dashboard Lock/Unlock mode
                                            App.View.Dashboard.initLockDashboardMode();
                            
                                            // set status version
                                            var ver = App.Model.Package.getNexcomVersion();
                                            App.View.Status.setVersion( ver );
                                            App.View.Status.clear();
                            
                                            //
                                            App.Model.Dashboard.unserializeAll( targetSettings.dashboards );
                                            console.log( targetSettings.dashboards );
                            
                                            dfd.resolve();
                                        })
                                        .fail(function(){ dtd.reject(); });
                                })
                                .fail(function(){ dtd.reject(); });
                        })
                        .fail(function(){ dtd.reject(); });
                }
                else    // board list page
                {
                    App.Configure.loadPackageInfo()
                        .done(function() {
                            // adjust Dropdown Menu
                            App.View.Dashboard.adjustDropdownMenuHeight();
                            // set Dashboard Lock/Unlock mode
                            App.View.Dashboard.initLockDashboardMode();
                    
                            // set status version
                            var ver = App.Model.Package.getNexcomVersion();
                            App.View.Status.setVersion( ver );
                            App.View.Status.clear();
                    
                            //
                            App.Model.Dashboard.unserializeAll( targetSettings.dashboards );
                            console.log( targetSettings.dashboards );
                    
                            dfd.resolve();
                        })
                        .fail(function(){ dtd.reject(); });
                }
            })
            .fail(function(){ dtd.reject(); });
        
        
        
                
        /*
        App.View.Status.set( "Fetching configure..." );
        App.Configure.loadConfigure().done( function() {
            App.View.Status.set( "Loading plugins..." );
            App.Plugins.loadPlugins().done( function() {
                App.View.Status.set( "Fetching datasources..." );
                App.Model.Datasource.getDatasources().done( function() {
                    App.View.Status.set( "Fetching settings..." );
                    App.Settings.loadSettings().done( function() {
                    //App.View.Status.set( "Fetching configure..." );
                    //App.Configure.loadConfigure().done( function() {
                        App.View.Status.set( "Fetching packageInfo..." );
                        App.Configure.loadPackageInfo().done( function() {
                    
                            // adjust Dropdown Menu
                            App.View.Dashboard.adjustDropdownMenuHeight();
                            // set Dashboard Lock/Unlock mode
                            App.View.Dashboard.initLockDashboardMode();
                            
                            // set status version
                            var ver = App.Model.Package.getNexcomVersion();
                            App.View.Status.setVersion( ver );
                            App.View.Status.clear();
                            
                            dfd.resolve();
                        });
                    });
                });
            }).fail( function()
            {
                $( "#welcomePage" ).append( '<div class="alert alert-danger">Error loading plugins.</div>' );
                dfd.reject();
            });
        });
        */

        return dfd.promise();
    }
    return {
        init : init
    };
})();

$( window ).on( "resize" , function( event )
{
    if( event.target === window ) {
        $("#gridList").gridList( "resize" );
        $(".chartBoard").trigger( "resize" );
    }
} );

/*
    Document Ready
    
    check "iotdashboard" cookie
    if exit means user logined
        show user name
        check user role
            0 : // admin role
            1 : // non-admin role
        process navbar        
    else
        open login page
        wait user login
 */
/*var idleTimer = null;
var idleState = false;
var idleWait = 600000;  // 10 min idle*/

$( document ).on( "ready" , function() {
    console.info("[main.js]", "===============================\n document ready\n ============================="); 

    // check iotdashboard cookie
    var cookie = App.Configure.readCookie( "iotdashboard" );
	//Enable Tooltip (Kewei add)
	$('[data-toggle="tooltip"]').tooltip(); 
    console.info("========================= cookie : ", cookie, typeof(cookie),"=========================" );
    if ( cookie != null ) {
        $('#operMode').bootstrapToggle('destroy');
        $('#operMode').hide();
    
        $('.loading').show();
        
        cookie = JSON.parse( cookie );
        console.info(cookie);
        App.Configure.setUserConfigure(cookie);
        
        $('#logoutDashboard').show();
        //$('.login-page').hide();
        $('.statusBarConnect').show();
        
        if (cookie.role == 0) {   // admin
            $('#createNewDashboard').show();
        } else {                    // non-admin
            $('#createNewDashboard').hide();
            $('#operMode').bootstrapToggle('destroy');
            $('#operMode').hide();
        }
        
        // show login user name
        $('#userDashboard').html('<span class="glyphicon glyphicon-user"></span> ' + cookie.name);
        $('#userDashboard').attr("role", cookie.role);
        $('#userDashboard').show();
        
        App.Main.init()
            .done(function() { App.Page.init(); })
            .fail(function() {
                console.info("call reload.");
                location.reload(); 
            });
		/*
		* Kewei add
		* Idle Timeout func
		*/
        
		/*$('*').bind('mousemove mousedown keypress scroll', function () {
		
            console.info("timeout catcher event.");
			//Clear the previous timer
			clearTimeout(idleTimer);
			//Reset idleState
			idleState = false;
			//Set localStorage
			localStorage.setItem("idleState", idleState);

			idleTimer = setTimeout(function () {
				// Idle Event
				//alert("Logout !");
				App.Configure.eraseCookie('iotdashboard');
				window.location.href = "";

				idleState = true;
				localStorage.setItem("idleState", idleState);
			
			}, idleWait );
		});
		//Trigger Idle Timeout func
		$("body").trigger("mousemove");*/
        
        /**
        TBD: to check memory state to avoid browser crash
        setInterval(function() {
            var mem = performance.memory;
            console.log(mem);
        }, 1000);
        
         */
    } else {
        $('#userDashboard').hide();
        $('.login-page').show();
		$('#userName').focus(); /*kewei added*/
        $('.statusBarConnect').hide();
    }
    
    /**
     */
    var preobj = {}; 
    function report() {
        try {
                /*
                heapTotal and heapUsed refer to V8's memory usage.
                external refers to the memory usage of C++ objects bound to JavaScript objects managed by V8.
                rss, Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, which includes the heap, code segment and stack.
                */
                function strFormat(data, len) {
                    // parameter process
                    if (len == undefined) { len = 3 };
                    if (typeof data != 'string') { data = data.toString(); }
                    
                    var out = data;
                    var dataLen = data.length;
                    if (len > dataLen) {
                        out = data + ' '.repeat(len-dataLen);
                    } else if (len < dataLen) {
                        out = data.slice(0, len-1) + '*';
                    }
                    return out;
                }
                /**
                 */
                function storeObj(used) {
                    if (used === undefined) { return preobj; }
                    preobj.jsHeapSizeLimit = used.jsHeapSizeLimit;
                    preobj.totalJSHeapSize = used.totalJSHeapSize;
                    preobj.usedJSHeapSize = used.usedJSHeapSize;
                    return preobj;
                }
                
                if (window.performance.memory) {
                    const used = window.performance.memory;
                    //console.log(window.performance.memory.jsHeapSizeLimit);
                    //console.log(window.performance.memory.totalJSHeapSize);
                    //console.log(window.performance.memory.usedJSHeapSize);
                    
                    var obj = storeObj();
                    if (obj == {}) {
                        console.log(
                            '[Dashboard] Front End : ' + ' Total JS Heap Size: ' + strFormat((window.performance.memory.totalJSHeapSize / 1024 / 1024), 20) + ' Used JS Heap Size: ' + strFormat((window.performance.memory.usedJSHeapSize / 1024 / 1024 ), 20) + ' JS Heap Size Limit: ' + strFormat((window.performance.memory.jsHeapSizeLimit / 1024 / 1024 ), 20)
                        );
                    } else {
                        var totalJSHeapSizeStatus = '=';
                        if (window.performance.memory.totalJSHeapSize > obj.totalJSHeapSize) {
                            totalJSHeapSizeStatus = '+';
                        } else if (window.performance.memory.totalJSHeapSize < obj.totalJSHeapSize) {
                            totalJSHeapSizeStatus = '-';
                        }
                        var usedJSHeapSizeStatus = '=';
                        if (window.performance.memory.usedJSHeapSize > obj.usedJSHeapSize) {
                            usedJSHeapSizeStatus = '+';
                        } else if (window.performance.memory.usedJSHeapSize < obj.usedJSHeapSize) {
                            usedJSHeapSizeStatus = '-';
                        }
                        var jsHeapSizeLimitStatus = '=';
                        if (window.performance.memory.jsHeapSizeLimit > obj.jsHeapSizeLimit) {
                            jsHeapSizeLimitStatus = '+';
                        } else if (window.performance.memory.jsHeapSizeLimit < obj.jsHeapSizeLimit) {
                            jsHeapSizeLimitStatus = '-';
                        }
                        console.log(
                            '[Dashboard] Front End : ' + ' Total JS Heap Size: ' + strFormat((window.performance.memory.totalJSHeapSize / 1024 / 1024), 20) + totalJSHeapSizeStatus + ' Used JS Heap Size: ' + strFormat((window.performance.memory.usedJSHeapSize / 1024 / 1024 ), 20) + usedJSHeapSizeStatus + ' JS Heap Size Limit: ' + strFormat((window.performance.memory.jsHeapSizeLimit / 1024 / 1024 ), 20) + jsHeapSizeLimitStatus
                        );
                    }
                    storeObj(used);
                } else {
                    console.log('No window.performance.memory!');
                }
                
                /*
                if ( used ) {
                    var obj = storeObj();
                    //const rss = process.memoryUsage().rss / 1024 / 1024;
                    //var now = new Date();
                    // check clients
                    if (obj == {}) {
                        console.log('[Dashboard] clients: ' + strFormat(wsServer.clients.length) + ' rss: ' + strFormat((used.rss / 1024 / 1024), 20) + ' heapUsed:' + strFormat((used.heapUsed / 1024 / 1024 ), 20));
                    } else {
                        var clientStatus = '=';
                        if (wsServer.clients.length > obj.clients) {
                            clientStatus = '+';
                        } else if (wsServer.clients.length < obj.clients) {
                            clientStatus = '-';
                        }
                        var rssStatus = '=';
                        if (used.rss > obj.rss) {
                            rssStatus = '+';
                        } else if (used.rss < obj.rss) {
                            rssStatus = '-';
                        }
                        var heapTotalStatus = '=';
                        if (used.heapTotal > obj.heapTotal) {
                            heapTotalStatus = '+';
                        } else if (used.heapTotal < obj.heapTotal) {
                            heapTotalStatus = '-';
                        }                    
                        var heapUsedStatus = '=';
                        if (used.heapUsed > obj.heapUsed) {
                            heapUsedStatus = '+';
                        } else if (used.heapUsed < obj.heapUsed) {
                            heapUsedStatus = '-';
                        }                    
                        console.log(
                            '[Dashboard] clients: ' + strFormat(wsServer.clients.length) + clientStatus + ' rss: ' + strFormat((used.rss / 1024 / 1024), 8)  + rssStatus + ' heapTotal: ' + strFormat((used.heapTotal / 1024 / 1024 ), 8)  + heapTotalStatus + ' heapUsed: ' + strFormat((used.heapUsed / 1024 / 1024 ), 8)  + heapUsedStatus + ' ' + strFormat(((used.heapUsed * 100 ) / used.heapTotal), 4) + '%'
                        );
                        
                    }
                    // store data to preobj
                    storeObj(used, wsServer);
                }
            } else {
                console.log('No GC hook! Start your program as `node --expose-gc file.js`.');
            }
                */
        } catch ( e ) {
            console.log('error: ' + e.message);
        }
    }
    setInterval(report, 60000);     
    
});

$(document).contextmenu(function() {
    return false;
});

/**
    TBD
 */
/*$( document ).on( "keydown", function( event ) {
    switch( event.keyCode ) {
        case $.ui.keyCode.LEFT:
        console.log( "left" );
        break;
        case $.ui.keyCode.RIGHT:
        console.log( "right" );
        break;
        case $.ui.keyCode.UP:
        console.log( "up" );
        break;
        case $.ui.keyCode.DOWN:
        console.log( "down" );
        break;
    }
});*/

