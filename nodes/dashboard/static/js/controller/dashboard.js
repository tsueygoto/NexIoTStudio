
var App = App || {};
App.Controller = App.Controller || {};

App.Controller.Dashboard = ( function()
{

    var selectedPlugin = null;
    var currentDashboard = null;
    var editingChart = null;
    var showGrid = false;
    var snapToGrid = false;

    function init()
    {
        $( "#createNewChart" ).on( "click" , createNewChartClick );
        $( "#chartPlugins" ).on( "click" , "a" , chartPluginClick );
        $( "#chartDatasources" ).on( "click" , "a" , chartDatasourceClick );
        $( "#chartDone" ).on( "click" , chartDoneClick );
        $( "#switchLockDashboard" ).on( "click" , switchLockDashboard );
        $( "#deleteDashboard" ).on( "click" , deleteDashboardClick );
        

        $( "#chartPluginConfig" ).on( "click" , "a" , chartPluginConfigImagesourceClick );
        $( "#chartPluginConfig" ).on( "change" , "input[type=file]" , chartPluginConfigImageUploadClick );

        $( document ).on( "click" , ".palette_node" , paletteNodeClick );

        $( "#createNewChart2" ).on( "click" , createNewChartClick2 );

        $( document ).on( "click" ,     ".gridItemHeader" ,                 gridItemHeaderClick );
        $( document ).on( "dblclick" ,  ".gridItemHeader" ,                 createNewChartClick2 );
        $( document ).on( "click" ,     ".gridItemHeader button" ,          gridHeaderButtonClick );
        $( document ).on( "click" ,     ".gridItemOverlay button" ,         removeOverlayButtonClick );
        $( document ).on( "click" ,     ".datasourceComponentBtn button" ,  componentEnableClick );
        
        // .chartBoard means charts list board
        $( ".chartBoard" ).on( "resize", function() {
            $(".chartBoard").css("height",$("#dashboardPage").height());
        } );
        
        // marked temperature for provide active node
        $( document ).on( "mousedown",  "#dashboardPage" , dashboardMouseDown );
        $( document ).on( "mousemove",  "#dashboardPage" , dashboardMouseMove );
        $( document ).on( "mouseup",    "#dashboardPage" , dashboardMouseUp );
        
        // groupController event function
        $( document ).on( "click", "#alignLeft",                "lef", alignController );
        $( document ).on( "click", "#alignVertical",            "ver", alignController );
        $( document ).on( "click", "#alignRight",               "rig", alignController );
        $( document ).on( "click", "#alignTop",                 "top", alignController );
        $( document ).on( "click", "#alignHorizontal",          "hor", alignController );
        $( document ).on( "click", "#alignBottom",              "bot", alignController );
        $( document ).on( "click", "#alignHorizontalAverage",   "hav", alignController );
        $( document ).on( "click", "#alignVerticalAverage",     "vav", alignController );
        $( document ).on( "click", "#resizeFull",               "ref", alignController );
        $( document ).on( "click", "#resizeSmall",              "res", alignController );
        
        //Grid check init
        var showGridInit = localStorage.getItem("showGrid");
        var snapToGridInit = localStorage.getItem("snapToGrid");
        if(showGridInit === "true"){
            $("#showGrid").attr("checked","");
        }
        if(snapToGridInit === "true"){
            $("#snapToGrid").attr("checked","");
        }

        App.Model.Dashboard.getImageList();
        App.Page.onPageChange( onPageChange );
    }
    
    function deleteDashboardClick() {
        event.preventDefault();           
        id = $( this ).attr( "data-remove" );
        if (id == undefined) { return; }

        var name = $("#titleDashboard").text();
        App.Modal.show( "Remove " + name + "?" , "" , function() {
            
            var dashboards = App.Model.Dashboard.serializeAll();
            console.info("dashboards : ",dashboards);
           
            if (dashboards.length == 1)
            {
                App.Settings.delSettings(dashboards[0])
                .done(function(){
                    window.location.href = "#";
                })
                .fail(function(){
                    window.location.href = "#";
                });
            }
            else
            {
                // error
                window.location.href = "#";
            }
        });
    }
  
    /**
        The Dashboard Main Page
     */
    function onPageChange( page , data ) 
    {
        if( page == "#dashboardPage" )
        {
            $("#welcomePage").hide();
            $("#dashboardListPage").hide();
            
            //App.View.DashboardList.Modal.close();
            
            $("#dashboardListButton").hide();
            $("#titleDashboard").show();
            var $dashboardList = $( "#dashboardList" );
            $dashboardList.empty();
            var dashboardList = App.Model.Dashboard.dashboards;            
            var index = 0;
            var oUserConfigure = App.Configure.getUserConfigure();
            if ( oUserConfigure.role == 1 ) {
                //
                App.Model.Dashboard.setSysConfLock( true );
                $('#createNewDashboard').hide();
                $('#dashboardPageNav').hide();
                $('#switchLockDashboard').hide();
                $('#deleteDashboard').hide();
                $('#createNewChart2').hide();
                //
                for( index=0; index < oUserConfigure.dashboardList.length; index++ )
                {
                    if (index < oUserConfigure.dashboardList.length) 
                    {
                        var value = oUserConfigure.dashboardList[index];
                        if (dashboardList[value] != undefined) {
                            $dashboardList.append( '<li><a data-open="' + value + '" href="board/'+value+'">' + dashboardList[value].name + '</a></li>' );
                        }
                    }
                }
            } else {
                
                $('#createNewDashboard').show();
                
                for( index=0; index < dashboardList.length; index++ ) {
                    $dashboardList.append( '<li><a data-open="' + index + '" href="board/'+index+'">' + dashboardList[index].name + '</a></li>' );
                }
            }

            var dashboard = App.Model.Dashboard.getDashboard( data );
            var fistDashboard = App.Model.Dashboard.getDashboard( 0 );
            if (dashboard == null)
            {
                if (fistDashboard == null)
                {
                    // Quick-fix: Wait to make sure page fade completes before changing pages
                    // TODO: Add navigation queue
                    setTimeout( function() {
                        window.location.href = "#";
                    } , 500 );
                    return;
                }
                else
                {
                    dashboard = fistDashboard;
                }
            }

                App.Net.createConnection().done( function() {
                    App.View.Status.set( "App.Model.Datasource.getDatasources done." );
                    loadDashboard( dashboard );
                });
                
                /*kewei added : When user change page, get background setting*/
                App.Model.Dashboard.getBKSetting();
        }
    }

  function createNewChartClick( event )
  {
    event.preventDefault();
    selectedPlugin = null;
    editingChart = null;
    App.View.Dashboard.Modal.open();
  }

    /**
        chartInfo - get chart info by chart id
     */
    function chartInfo(chartId)
    {
        var helpText = $("script[data-help-name|='"+chartId+"']").html()||"";
        var help = '<div class="node-help">'+helpText+"</div>";

        $( ".chartInfoPage" ).empty();
        $( ".chartInfoPage" ).append( help );

    }
    /**
     */
    function paletteNodeClick( event )
    {
        event.preventDefault();
        var id = $( this ).attr( "data-pluginid" );
        chartInfo(id);
    }
  
    /**
     */
    function gridItemHeaderClick( event )
    {
        event.preventDefault();
        // process groupController
        // disable groupController
        $("#groupController").hide();
        for(var i=0; i<selectedCharts.length; i++)
        {
            $("#gridList > li[data-id='"+ selectedCharts[i].id +"']").removeClass("selected");
        }
        selectedCharts = [];
        var activeChart = currentDashboard.getChart( $( this ).parents( "li" ).attr( "data-id" ) );
        chartInfo(activeChart.plugin_id);
    }
  
    /**
     *
     * param ui : object for new chart position and size. format: { x: px, y: py, w: width, h: height }
     * 
     */
    function newchartPlugin( chartName, targetPlugin, ui ) 
    {
        //------------
        // new chart
        //------------
        selectedPlugin = targetPlugin;
        chart = new App.Model.Chart();
        chart.id = genRandomID();
        chart.name = chartName;
        chart.plugin = selectedPlugin;
        chart.config = {};
        
        // add mouse px, py into chart extened object
        chart.extend = ui;
        
        for( var key in selectedPlugin.chartConfig ) {
            if (selectedPlugin.chartConfig.hasOwnProperty(key)) {
                chart.config[ key ] = selectedPlugin.chartConfig[ key ].default;
            }
        }
        $container = App.View.Dashboard.createChartContainer( chart );
        editingChart = null;
        currentDashboard.addChart( chart );
        chart.load( $container );
        App.View.Dashboard.activedChart( $container );
        App.Settings.saveSettings();
    }
  
    /**
     *
     */
    function duplicatePlugin( clonechart, ui ) {
        editingChart = clonechart;
        newchartPlugin( clonechart.name, clonechart.plugin,
            { x: ui.left + 50, y: ui.top + 50, w: ui.width, h: ui.height });
    }
    
    /**
     *
     */
    function createNewChartClick2( event )
    {
        event.preventDefault();
    
        var fixTop                  = $(".chartBoard").position().top;
        var fixLeft                 = $(".chartBoard").position().left;
        var fixWidth                = parseInt($(".chartBoard").css("width"), 10);
        var fixInfoLeft             = $(".chartInfoPage").position().left;
        var fixInfoWidth            = parseInt($(".chartInfoPage").css("width"), 10);
        var fixDashboardPageWidth   = $("#dashboardPage").width();
        
        var elm_chartBoard = $( ".chartBoard" );
        var id = $( this ).attr( "data-pluginid" );
        elm_chartBoard.toggle();
        if($( ".chartBoard" ).css('display') == 'block')
        {
            $("#createNewChart2 > span").removeClass( "glyphicon-unchecked" ).addClass( "glyphicon-check" );
            fixTop = elm_chartBoard.position().top;
            fixWidth = parseInt(elm_chartBoard.css("width"), 10);
            elm_chartBoard.css('left', 0);
            $(".chartInfoPage").removeClass( "posLeft" ).addClass( "posRight" );
        }
        else
        {
            $("#createNewChart2 > span").removeClass( "glyphicon-check" ).addClass( "glyphicon-unchecked" );
        }
        
        $(".chartBoard").draggable({
            drag: function(e, ui)
            {
                var fixDashboardPageLeft = $("#dashboardPage").position().left;
                ui.position.top = fixTop;
                if ( ui.position.left < fixLeft )
                {
                    ui.position.left = fixLeft;
                }
                else if ( ui.position.left < fixInfoWidth )
                {
                    $(".chartInfoPage").removeClass( "posLeft" ).addClass( "posRight" );
                }
                else if ( (ui.position.left+180) > fixDashboardPageWidth )
                {
                    ui.position.left = fixDashboardPageWidth - 180;
                }
                else if ( (ui.position.left+180) > fixInfoLeft )
                {
                    $(".chartInfoPage").removeClass( "posRight" ).addClass( "posLeft" );
                }
            }
        });
        
        $(".palette_node").draggable({
            helper: 'clone',
            appendTo: 'body',
            revert: 'invalid',
            revertDuration: 50,
            drag: function(e,ui) {
                App.View.Dashboard.deActivedChartList();
                App.View.Dashboard.setChartSelected( true );
                console.log("palette_node draggable ........");
            }
        });
        
        /***
         * dashboard page when drap a plugin node then drop in will call.
         */
        $("#dashboardPage").droppable({
            accept:".palette_node",
            drop: function (event, ui) {
                var chart,
                i, key,
                $input,
                $container;
                
                var chartName = ui.draggable[0].getElementsByClassName("palette_label")[0].textContent.trim();
                var plugin_id = ui.draggable[0].getElementsByClassName("palette_id")[0].textContent.trim();
                selectedPlugin = App.Plugins.getPlugin( plugin_id );
                newchartPlugin(
                    chartName,
                    selectedPlugin, 
                    {
                        x: ui.position.left,
                        y: (ui.position.top - parseInt($("#dashboardPage").css('top'), 10))
                    }
                );
            }
        });
    
        // process chartInfoPage
        $( ".chartInfoPage" ).empty();
        var helpText = "No Chart Info";
        if (id != undefined) {
            helpText = $("script[data-help-name|='"+id+"']").html()||"";
        }
        $( ".chartInfoPage" ).append( '<div class="node-help">' + helpText + '</div>' );
        $( ".chartInfoPage" ).toggle();

        // got the final Left value
        fixInfoLeft = $(".chartInfoPage").position().left;
        fixInfoWidth = parseInt($(".chartInfoPage").css("width"), 10);
        
        if ( App.Model.Dashboard.checkSysConfLock() ) {
            App.View.Dashboard.switchLockDashboardMode();
        }
  }
  
  function chartPluginClick( event )
  {
    event.preventDefault();

    var id = $( this ).attr( "data-pluginid" );
    if( selectedPlugin !== null && id == selectedPlugin.id ) { return; }
    selectedPlugin = App.Plugins.getPlugin( id );

    App.View.Dashboard.Modal.loadPluginConfig( selectedPlugin , editingChart );
  }

    var lasso = null;
    /***
     * function dashboardMouseDown( event )
     *
     */
    function dashboardMouseDown( event ) {
        // check this is not chart
        console.info("event : ", event);
        console.info("pos : ", $(this).position());
        var curpagePos = $(this).position();
        
        if (currentDashboard.checkChartHit((event.clientX - curpagePos.left),(event.clientY - curpagePos.top)))
        {
            return;
        }
        
        if (lasso) {
            lasso = null;
        }
        
        lasso = $('#selectRect')
            .attr("ox",event.clientX)
            .attr("oy",event.clientY)
            .attr("x",event.clientX)
            .attr("y",event.clientY)
            .attr("class","lasso")
            .css('top', event.clientY)
            .css('left', event.clientX)
            .width(0)
            .height(0)
            .show()
            ;            
    }
  
    /***
     * function dashboardMouseMove( event )
     *
     */
    function dashboardMouseMove( event ) {
      if (lasso) {
            var ox = parseInt(lasso.attr("ox"));
            var oy = parseInt(lasso.attr("oy"));
            var x = parseInt(lasso.attr("x"));
            var y = parseInt(lasso.attr("y"));
            var w;
            var h;
            if (event.clientX < ox) {
                x = event.clientX;
                w = ox-x;
            } else {
                w = event.clientX-x;
            }
            if (event.clientY < oy) {
                y = event.clientY;
                h = oy-y;
            } else {
                h = event.clientY-y;
            }
            lasso.attr("x",x);
            lasso.attr("y",y);
            lasso.css('left', x);
            lasso.css('top', y);
            lasso.width(w);
            lasso.height(h);
            
            event.preventDefault();
        }
    }
  
    /***
     * function dashboardMouseUp( event )
     *
     */
    var selectedCharts = [];
    function dashboardMouseUp( event )
    {
        var curpagePos = $(this).position();
        if (lasso) {
            var x = parseInt(lasso.attr("x"));
            var y = parseInt(lasso.attr("y"));
            var x2 = x+lasso.width();
            var y2 = y+lasso.height();
            
            var charts = currentDashboard.setChartsSelected(x - curpagePos.left, y - curpagePos.top, x2 - curpagePos.left, y2 - curpagePos.top);
            
            if (charts.length > 0)
            {
                // unselected pre-selected charts
                for(var i=0; i<selectedCharts.length; i++)
                {
                    $("#gridList > li[data-id='"+ selectedCharts[i].id +"']").removeClass("selected");
                }
                selectedCharts = charts;
                for(var i=0; i<selectedCharts.length; i++)
                {
                    $("#gridList > li[data-id='"+ selectedCharts[i].id +"']").addClass("selected");
                }
                
                // enable groupController
                $("#groupController").show();
            }
            else
            {
                // enable groupController
                $("#groupController").hide();
                for(var i=0; i<selectedCharts.length; i++)
                {
                    $("#gridList > li[data-id='"+ selectedCharts[i].id +"']").removeClass("selected");
                }
                selectedCharts = [];
            }
            
            lasso.hide();

            lasso = null;
            event.preventDefault();
        }
    }

    function chartDatasourceClick( event )
    {
        event.stopPropagation();
        event.preventDefault();
        
        var id = $( this ).attr( "data-dsid" );
        $( this ).remove();
        
        App.View.Dashboard.Modal.addDatasource( App.Model.Datasource.getDatasource( id ) , selectedPlugin );
    }

  function chartDatasourceHeaderClick( event )
  {
    $( this ).siblings( ".panel-body" ).toggle();
  }

  function chartDatasourceRemoveClick( event )
  {
        event.stopPropagation();
        App.View.Dashboard.Modal.removeDatasource( $( this ).parents( ".panel" ) );
  }

    function chartDoneClick() {
      
        var chart,
            i, key,
            $input;

        // Validate
        var errors = [];

        var chartName = $( "#chartName" ).val().trim();
        var $datasources = $( "#chartDatasourceList > div" );

        if( chartName.length < 1 ) { errors.push( "Please enter a name." ); }
        if( selectedPlugin === null ) { errors.push( "Please select a plugin." ); }

        if( errors.length > 0 ) {
            App.View.Dashboard.Modal.showErrors( errors );
            return;
        }

        if( !editingChart ) {
            chart = new App.Model.Chart();
            chart.id = genRandomID();
        } else {
            chart = editingChart;
            chart.resetDatasources();
        }

        chart.name = chartName;
        chart.plugin = selectedPlugin;
        chart.config = {};

        for( i = 0; i < $datasources.length; i++ ) {
            var $datasource = $( $datasources[i] );
    
            var datasource = {
                datasource : App.Model.Datasource.getDatasource( $datasource.attr( "data-dsid" ) ),
                config : {}
            };
    
            var uid = $datasource.attr( "data-uid" );
    
            var $dsConfig = $datasource.find( ".datasourcePluginConfig" );
            for( var key in selectedPlugin.datasourceConfig ) {
                if(selectedPlugin.datasourceConfig.hasOwnProperty(key)) {
                    $input = $dsConfig.find( '[data-prop="' + key + '"]' );
                    if( $input.length > 0 ) {
                        datasource.config[ key ] = App.View.Dashboard.getInputValue( $input );
                    } else {
                        datasource.config[ key ] = selectedPlugin.datasourceConfig[ key ].default;
                    }    
                }
            }
    
            datasource.config.label = $( "#nds" + uid + "-label" ).val().trim();
            if( !datasource.config.label ) {
                datasource.config.label = $datasource.attr( "data-dsname" );
            }
    
            var componentConfig = {};
            var $components = $datasource.find( ".datasourceComponent" );
            for( var k = 0; k < $components.length; k++ ) {
                var $component = $( $components[k] );
                var componentName = $component.attr( "data-component" );
                componentConfig[ componentName ] = {
                enabled : $component.find( "button" ).hasClass( "btn-success" ),
                label : $component.find( "input" ).val().trim()
                };
            }
    
            datasource.config.components = componentConfig;
    
            chart.addDatasource( datasource.datasource , datasource.config );
        }

        var $chartConfig = $( "#chartPluginConfig" );
        for( var key in selectedPlugin.chartConfig ) {
            if (selectedPlugin.chartConfig.hasOwnProperty(key)) {
                $input = $chartConfig.find( '[data-prop="' + key + '"]' );
                if( $input.length > 0 ) {
                    chart.config[ key ] = App.View.Dashboard.getInputValue( $input );
                } else {
                    chart.config[ key ] = selectedPlugin.chartConfig[ key ].default;
                }
            }
        }
    
        // process showName
        var chartShowName = $( "#chartShowName:checked" ).val();
        if (chartShowName == "on") {
            console.log("show Name");
            chart.config['chartShowName'] = true;
        } else {
            console.log("Hide Name");
            chart.config['chartShowName'] = false;
        }

        var $container;
        if( !editingChart ) {
            $container = App.View.Dashboard.createChartContainer( chart );
        } else {
            // For now, re-create the chart to change settings...
            // TODO: Allow chart plugins to handle settings changes
            currentDashboard.removeChart( chart.id );
            $container = App.View.Dashboard.updateChartContainer( chart );
        }

        editingChart = null;
        currentDashboard.addChart( chart );
        console.log("[", chart, "]");
        chart.load( $container );
        App.Settings.saveSettings();
    
        App.View.Dashboard.Modal.close();
    }

    /**
     * 
     */
    function gridHeaderButtonClick() {    
        var action = $( this ).attr( "data-act" );
        var $parent = $( this ).parents( "li" );
        if( action == "remove" ) {
            App.View.Dashboard.showRemoveOverlay( $parent );
            $overlay.on( "click" , "button" , function() {
                var $parent = null;
            });
            $content.append( $overlay );
            $overlay.fadeIn( 200 );
        } else if( action == "edit" ) {
            var chart = currentDashboard.getChart( $parent.attr( "data-id" ) );
            editingChart = chart;
            selectedPlugin = chart.plugin;
            App.View.Dashboard.Modal.open( chart );
        } else if ( action == "duplicate" ) {
            var parent = $(this).parent().parent().parent();
            
            var chart = currentDashboard.getChart( $parent.attr( "data-id" ) );
            duplicatePlugin(chart, {top: parent.position().top, left: parent.position().left, width: parent.width(), height:parent.height()});
        }
    }
  
  function removeOverlayButtonClick()
  {
    var $parent = $( this ).parents( "li" );
    if( $( this ).hasClass( "btn-danger" ) )
    {
      App.View.Dashboard.hideRemoveOverlay( $parent );
    }
    else
    {
      var id = $parent.attr( "data-id" );
      currentDashboard.removeChart( id );
      $( "#gridList" ).gridList( "remove" , $parent );
      App.Settings.saveSettings();
    }
  }

  function componentEnableClick()
  {
    $( this ).toggleClass( "btn-success btn-default" );
  }

    /***
     */
    function gridListOnChange( items ) {
        if (items == undefined) { return; }
        if( items.length > 0 ) {
        $( "#gridList" ).gridList( "_updateElementData" );
        
        $( "#gridList > li[data-id]" ).each( function() {
            var chart = currentDashboard.getChart( $( this ).attr( "data-id" ) );
            chart.pos = {
            x : Number( $( this ).attr( "data-x" ) ),
            y : Number( $( this ).attr( "data-y" ) ),
            w : Number( $( this ).attr( "data-w" ) ),
            h : Number( $( this ).attr( "data-h" ) ),
            left : Number( $( this ).attr( "data-left" ) ),
            top : Number( $( this ).attr( "data-top" ) ),
            width : Number( $( this ).attr( "data-width" ) ),
            height : Number( $( this ).attr( "data-height" ))
            };
        } );
        App.Settings.saveSettings();
        }
    }

  function onNetworkMessage( data )
  {
    if( !currentDashboard ) { return; }
    currentDashboard.pushData( data );
  }

  function onNetworkDisconnect()
  {
    if( !currentDashboard ) { return; }

    App.Net.createConnection().done( function() {
      currentDashboard.subscribeToAllDatasources();
      App.Model.Datasource.getDatasources();
    } );
  }

    function loadDashboard( dashboard )
    {
        currentDashboard = dashboard;
        selectedPlugin = null;
        editingChart = null;
        App.View.Dashboard.setPageTitle( dashboard.name );
        App.View.Dashboard.createNewGridList();
        App.View.Dashboard.setChartBoard();
    
        App.View.Status.set( "Dashboard Load charts start." );
        for( var i in dashboard.charts )
        {
            if (dashboard.charts.hasOwnProperty(i)) {
               
                var chart = dashboard.charts[i];

                var $container = App.View.Dashboard.createChartContainer( chart );
                chart.load( $container );
            }
        }
        App.View.Status.set( "Dashboard Load charts end." );

        App.View.Dashboard.initGridList();
        dashboard.load();
  }

  function genRandomID( len )
  {
    len = len || 16;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var id = "";
    for( var i = 0; i < len; i++ ) { 
        id += chars[ Math.floor( Math.random() * 62 ) ]; 
    }
    return id;
  }
  
    function switchLockDashboard() {
        event.preventDefault();

        App.View.Dashboard.switchLockDashboardMode();
    }
    
    /**
     *
     */
    function chartPluginConfigImagesourceClick( event ) {
        event.stopPropagation();
        event.preventDefault();
        var id = $( this ).attr( "data-isid" );;
        /*kewei modified*/
        $("#cp_file").val($( this ).text());
        //$( this ).remove();  Don't need to remove
    }
  
    /**
     *
     */
    function chartPluginConfigImageUploadClick( event ) {
        event.stopPropagation();
        event.preventDefault();
    }

    /**
        alignController
     */
    function alignController(event)
    {
        event.preventDefault();
        if (selectedCharts.length > 0)
        {
            var minTop, maxBottom, middle, maxRight, minLeft, averageWidth, averageHeight;
            var pos = {t:-1, l:-1, w:-1, h:-1};
            
            switch(event.data)
            {
                case "ref": // resize full
                {
                    pos.w = selectedCharts[0].pos.width;
                    pos.h = selectedCharts[0].pos.height;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        if (selectedCharts[i].pos.width > pos.w)
                        {
                            pos.w = selectedCharts[i].pos.width;
                        }
                        if (selectedCharts[i].pos.height > pos.h)
                        {
                            pos.h = selectedCharts[i].pos.height;
                        }
                    }
                }
                    break;
                case "res": // resize small
                {
                    pos.w = selectedCharts[0].pos.width;
                    pos.h = selectedCharts[0].pos.height;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        if (selectedCharts[i].pos.width < pos.w)
                        {
                            pos.w = selectedCharts[i].pos.width;
                        }
                        if (selectedCharts[i].pos.height < pos.h)
                        {
                            pos.h = selectedCharts[i].pos.height;
                        }
                    }
                    console.info(pos.w, pos.h);
                }
                    break;
                case "top":
                {
                    // find the most top
                    pos.t = selectedCharts[0].pos.top;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        if (selectedCharts[i].pos.top < pos.t)
                        {
                            pos.t = selectedCharts[i].pos.top;
                        }
                    }
                }
                    break;
                case "hor":
                {
                    // find the most top
                    minTop = selectedCharts[0].pos.top;
                    maxBottom = selectedCharts[0].pos.top + selectedCharts[0].pos.height;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        if (selectedCharts[i].pos.top < minTop)
                        {
                            minTop = selectedCharts[i].pos.top;
                        }
                        var newBottom = selectedCharts[i].pos.top + selectedCharts[i].pos.height;
                        if (newBottom > maxBottom)
                        {
                            maxBottom = newBottom;
                        }
                    }
                    middle = minTop + Math.floor((maxBottom - minTop) / 2);
                }
                    break;
                case "bot":
                {
                    // find the max bottom
                    maxBottom = selectedCharts[0].pos.top + selectedCharts[0].pos.height;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        var newBottom = selectedCharts[i].pos.top + selectedCharts[i].pos.height;
                        if (newBottom > maxBottom)
                        {
                            maxBottom = newBottom;
                        }
                    }
                }
                    break;
                case "lef":
                {
                    // find the min left
                    pos.l = selectedCharts[0].pos.left;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        if (selectedCharts[i].pos.left < pos.l)
                        {
                            pos.l = selectedCharts[i].pos.left;
                        }
                    }
                }                
                    break;
                case "ver":
                {
                    // find the middleleft
                    minLeft = selectedCharts[0].pos.left;
                    maxRight = selectedCharts[0].pos.left + selectedCharts[0].pos.width;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        if (selectedCharts[i].pos.left < minLeft)
                        {
                            minLeft = selectedCharts[i].pos.left;
                        }
                        var newRight = selectedCharts[i].pos.left + selectedCharts[i].pos.width;
                        if (newRight > maxRight)
                        {
                            maxRight = newRight;
                        }
                    }
                    middle = minLeft + Math.floor((maxRight - minLeft) / 2);
                }
                    break;
                case "rig":
                {
                    // find the max right
                    maxRight = selectedCharts[0].pos.left + selectedCharts[0].pos.width;
                    for (var i=1; i<selectedCharts.length; i++)
                    {
                        var newRight = selectedCharts[i].pos.left + selectedCharts[i].pos.width;
                        if (newRight > maxRight)
                        {
                            maxRight = newRight;
                        }
                    }
                }
                    break;
                case "vav":
                {
                    // first the count need > 2
                    if (selectedCharts.length < 3)
                    {
                        return;
                    }
                    // sorting top
                    selectedCharts.sort(function(a,b) {
                       return a.pos.top - b.pos.top;
                    });
                    
                    var insideTotalHeight = 0;
                    for(var i=0; i<selectedCharts.length-2; i++)
                    {
                        insideTotalHeight += selectedCharts[i+1].pos.height;
                    }
                    
                    averageHeight = Math.floor((selectedCharts[selectedCharts.length-1].pos.top - (selectedCharts[0].pos.top + selectedCharts[0].pos.height) - insideTotalHeight) / (selectedCharts.length-1));
                }
                    break;
                case "hav":
                {
                    // first the count need > 2
                    if (selectedCharts.length < 3)
                    {
                        return;
                    }
                    // sorting left
                    selectedCharts.sort(function(a,b) {
                       return a.pos.left - b.pos.left; 
                    });
                    
                    var insideTotalWidth = 0;
                    for(var i=0; i<selectedCharts.length-2; i++)
                    {
                        insideTotalWidth += selectedCharts[i+1].pos.width;
                    }
                    
                    averageWidth = Math.floor((selectedCharts[selectedCharts.length-1].pos.left - (selectedCharts[0].pos.left + selectedCharts[0].pos.width) - insideTotalWidth) / (selectedCharts.length-1));
                }
                    break;                    
                default:
                    return;
            }
            
            // reset all selectedCharts.top
            var preLeft, preTop;
            for(var i=0;  i<selectedCharts.length; i++)
            {
                $("#gridList > li[data-id='"+ selectedCharts[i].id +"']").trigger("alignchangestart");
                
                switch(event.data)
                {
                    case "res":
                    case "ref":
                    {
                        var middleH = Math.floor(pos.h / 2);
                        var middleW = Math.floor(pos.w / 2);
                        pos.t = selectedCharts[i].pos.top + Math.floor(selectedCharts[i].pos.height / 2) - middleH;
                        pos.l = selectedCharts[i].pos.left + Math.floor(selectedCharts[i].pos.width / 2) - middleW;
                        console.info("res >>>", pos.t, pos.l, pos.h, pos.w);
                    }
                        break;
                    case "top":
                    case "left":
                        break;
                    case "hor":
                        pos.t = middle - Math.floor(selectedCharts[i].pos.height / 2);
                        break;
                    case "bot":
                        pos.t = maxBottom - selectedCharts[i].pos.height;
                        break;
                    case "rig":
                        pos.l = maxRight - selectedCharts[i].pos.width;
                        break;
                    case "ver":
                        pos.l = middle - Math.floor(selectedCharts[i].pos.width / 2);
                        break;
                    case "hav":
                    {
                        pos.l = -1;
                        if (i == 0)
                        {
                            preLeft = selectedCharts[0].pos.left + selectedCharts[0].pos.width;
                        }
                        if ((i > 0) && (i < (selectedCharts.length-1)))
                        {
                            pos.l = preLeft + averageWidth;
                            preLeft = pos.l + selectedCharts[i].pos.width;
                        }
                    }
                        break;
                    case "vav":
                    {
                        pos.t = -1;
                        if (i == 0)
                        {
                            preTop = selectedCharts[0].pos.top + selectedCharts[0].pos.height;
                        }
                        if ((i > 0) && (i < (selectedCharts.length-1)))
                        {
                            pos.t = preTop + averageHeight;
                            preTop = pos.t + selectedCharts[i].pos.height;
                        }
                    }
                        break;
                }
                
                $("#gridList > li[data-id='"+ selectedCharts[i].id +"']").trigger("alignchangestop", [$("#gridList > li[data-id='"+ selectedCharts[i].id +"']"), pos]);
            }
            
        }
    }

    return {
        init : init,
        chartDatasourceHeaderClick : chartDatasourceHeaderClick,
        chartDatasourceRemoveClick : chartDatasourceRemoveClick,
        gridListOnChange : gridListOnChange,
        onNetworkMessage : onNetworkMessage,
        onNetworkDisconnect : onNetworkDisconnect,
        loadDashboard : loadDashboard
    };

})();


App.Controller.Debug = ( function() {

    function init() {
        console.log("[App.Controller.Debug.init start ...]");
        var dfd = $.Deferred();
        console.log("[App.ControllerDebug Start ...]");
        dfd.resolve();
        return dfd.promise();
    }

    /// <summary>Log input info</summary>
    function log() {
        try {
            if ( App.Model.Dashboard.checkSysConfDebug() ) {
                var i;
                for (i = 0; i < arguments.length; i++) {
                    var item = arguments[i];
                    if ( typeof item === 'object' ) {
                        console.dir(item);
                    } else {
                        console.log(item);
                    }
                }
            }
        } catch( e ) {
            
        }
    }
  
    return {
        init : init,
        log : log
    };

})();
