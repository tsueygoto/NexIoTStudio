
var App = App || {};
App.Controller = App.Controller || {};

App.Controller.DashboardList = ( function() {

    function init() {
        $( "#createNewDashboard" ).on( "click" , createNewDashboardClick );
        $( "#dashboardDone" ).on( "click", dashboardDoneClick );
        $( "#logoutDashboard" ).on( "click", logoutDashboardClick );
    
//      $( "#dashboardListPage" ).on( "click", "button" , dashboardButtonClick );
//      $( "#dashboardList" ).on( "click" , "button" , dashboardButtonClick2 );
        $( "#userDashboard" ).on( "click", userDashboardClick );
        $( "#operMode" ).on( "change" , operModeClick );
    
        App.Page.onPageChange( onPageChange );
    }

    /**
    
     */
    function onPageChange( page , data ) {
        console.info("[dashboardlist] data : ", data);
        
        var oUserConfigure = App.Configure.getUserConfigure();
        //App.Model.Dashboard.checkSysConfDebug()&&console.log("[onPageChange] page: " + page );
        //var id = /\/dash\/board\/(\d+)/.exec(location.pathname);
        
        if (data != null) {
            // set data-remove addr
            //$("#deleteDashboard").attr("data-remove", id[1]);
            var dashboard = App.Model.Dashboard.getDashboard( data );
            console.info("get [", data, "] dashboard : ", dashboard);
            $("#deleteDashboard").attr("data-remove", data);
            $("#deleteDashboard").show();
        } else {
            $("#deleteDashboard").hide();
        }
        
        if ( page == "#dashboardListPage" ) {
            $( "#dashboardBrand" ).show();
            $( "#titleDashboard" ).text( "" );
            App.View.DashboardList.render( App.Model.Dashboard.dashboards );
            //App.Model.Dashboard.checkSysConfDebug()&&console.log(App.Model.Dashboard.dashboards);
            $("#dashboardListPage").hide();
            $("#welcomePage").show();
            $("#dashboardListButton").show();
            $("#dashboardList").parent().removeClass('open');
            
            //var $dashboardList = $( "#dashboardList" );
            //$dashboardList.empty();
            //var dashboardList = App.Model.Dashboard.dashboards;
            //for( var index=0; index < dashboardList.length; index++ )
            //{
            //    App.Model.Dashboard.checkSysConfDebug()&&console.log(dashboardList[index]);
            //    $dashboardList.append( '<li><a data-open="' + index + '" href="board/'+index+'">' + dashboardList[index].name + '</a></li>' );
            //}
        } else {
            $("#welcomePage").hide();
            $("#dashboardListPage").hide();
            App.View.DashboardList.Modal.close();
            $("#dashboardListButton").show();

            //var $dashboardList = $( "#dashboardList" );
            //$dashboardList.empty();
            //var dashboardList = App.Model.Dashboard.dashboards;
            //for( var index=0; index < dashboardList.length; index++ )
            //{
            //    App.Model.Dashboard.checkSysConfDebug()&&console.log(dashboardList[index]);
            //    $dashboardList.append( '<li><a data-open="' + index + '" href="board/'+index+'">' + dashboardList[index].name + '</a></li>' );
            //}
        }

        var $dashboardList = $( "#dashboardList" );
        $dashboardList.empty();
        var dashboardList = App.Model.Dashboard.dashboards;

        // TODO: will occurred dashboards is empty issue
        var index = 0;
        if ( oUserConfigure.role == 1 ) {
            //
            App.Model.Dashboard.setSysConfLock( true );
            $('#createNewDashboard').hide();
            $('#dashboardPageNav').hide();
            $('#switchLockDashboard').hide();
            $('#deleteDashboard').hide();
            //
            
            console.info("oUserConfigure.dashboardList : ",oUserConfigure.dashboardList);
            console.info("oUserConfigure.dashboardList.length : ",oUserConfigure.dashboardList.length);
            if (oUserConfigure.dashboardList.length == 0) {   // means all items
                for( index=0; index < dashboardList.length; index++ ) {
                    $dashboardList.append( '<li><a data-open="' + index + '" href="board/'+index+'">' + dashboardList[index].name + '</a></li>' );
                }
            } else { // means specified items
                for( index=0; index < oUserConfigure.dashboardList.length; index++ ) {
                    var value = oUserConfigure.dashboardList[index];
                    if (dashboardList[value] != undefined) {
                        $dashboardList.append( '<li><a data-open="' + value + '" href="board/'+value+'">' + dashboardList[value].name + '</a></li>' );
                    }
                }
            }
        } else {
            //
            $('#createNewDashboard').show();
            //$('#dashboardPageNav').show();
            //$('#switchLockDashboard').show();
            //$('#deleteDashboard').show();
            //
            for( index=0; index < dashboardList.length; index++ ) {
                //App.Model.Dashboard.checkSysConfDebug()&&console.log(dashboardList[index]);
                $dashboardList.append( '<li><a data-open="' + index + '" href="board/'+index+'">' + dashboardList[index].name + '</a></li>' );
            }
        }
        
        if ( page == "#dashboardListPage" ) {
            $('.loading').hide();
        }
    }

    /**
     */
    function createNewDashboardClick( event ) {
        event.preventDefault();
        App.View.DashboardList.Modal.open();
    }

    /**
     */
    function dashboardDoneClick( event ) {
        var errors = [];
        var dashboardName = $( "#dashboardName" ).val().trim();
        if( dashboardName.length < 1 ) { 
            errors.push( "Please enter a name." ); 
        }
    
        if( errors.length > 0 ) {
            App.View.DashboardList.Modal.showErrors( errors );
            return;
        }
    
        //App.Model.Dashboard.checkSysConfDebug()&&console.log(dashboardName);
        //App.Model.Dashboard.checkSysConfDebug()&&console.log("cccc");        
        var dashboard = new App.Model.Dashboard( dashboardName );
        App.Model.Dashboard.addDashboard( dashboard );
    
        // TBD for plugin info lost issue
        //App.Settings.saveSettings();
        App.Settings.saveNewSettings();
        
        App.View.DashboardList.Modal.close();
    
        // HACK: Dashboards don't really have an ID yet, so we can use the dashboards array's length
        // to get an "ID"
        openDashboard( App.Model.Dashboard.dashboards.length - 1 );
    }

    /**
     */
//    function dashboardButtonClick() {
//        var id = $( this ).attr( "data-open" );
//        if( id !== undefined ) {
//            openDashboard( id );
//        } else {
//            id = $( this ).attr( "data-remove" );
//            var name = $( this ).siblings( "button" ).text();
//            App.Modal.show( "Remove " + name + "?" , "" , function() {
//                App.Model.Dashboard.removeDashboard( id );
//                App.Settings.saveSettings();
//                App.View.DashboardList.render( App.Model.Dashboard.dashboards );
//            } );
//        }
//    }
  
    /**
    
     */
//    function dashboardButtonClick2() {
//        var id = $( this ).attr( "data-open" );
//        //App.Model.Dashboard.checkSysConfDebug()&&console.log("CCCCCC" + id);
//        if( id !== undefined ) {
//            openDashboard( id );
//        }
//        //else
//        //{
//        //  id = $( this ).attr( "data-remove" );
//        //  var name = $( this ).siblings( "button" ).text();
//        //  App.Modal.show( "Remove " + name + "?" , "" , function() {
//        //    App.Model.Dashboard.removeDashboard( id );
//        //    App.Settings.saveSettings();
//        //    App.View.DashboardList.render( App.Model.Dashboard.dashboards );
//        //  } );
//        //}
//    }

    /**
    
     */
    function openDashboard( id ) {
        //App.Page.navigateTo( "board/" + id );
        location.href = "board/" + id;
    }
  
    /**
    
     */
    function logoutDashboardClick( event ) {
        event.preventDefault();
        App.Configure.eraseCookie('iotdashboard');
        //window.location.ref = "/dash/";
        window.location.href = "";
    }

    /**
    
     */
    function userDashboardClick( event ) {
        event.preventDefault();
        //App.Configure.eraseCookie('iotdashboard');
        //window.location.ref = "/dash/";
        //window.location.href = "";
    }

    /**
    
     */
    function operModeClick( event ) {
        event.preventDefault();
        if ($("#operMode").prop('checked')) // true -> Edit Model
        {
            
        }
        else // false -> View Mode
        {
            
        }
    }

    return {
        init : init
    };
    
} )();
