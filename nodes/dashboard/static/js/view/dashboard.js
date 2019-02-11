/**
 *
 */
var App = App || {};
App.View = App.View || {};

App.View.Dashboard = ( function() {

    var chartSelected = false,
        activedChartList = []
        ;
    
 
    
    var DEFAULT_CHART_WIDTH = 120; //2;
    var DEFAULT_CHART_HEIGHT = 120; //1;
    var $gridList = null;
    
    var Modal = ( function() {

        var datasourceNextID = 0;
    
        function open( chart ) {
            datasourceNextID = 0;
        
            var key, i;
        
            var $modal = $( "#chartModal" );
            var $modalTitle = $modal.find( ".modal-title" );
            var $modalBody = $modal.find( ".modal-body" );
    
            $( "#chartError" ).hide();
        
            // Build plugins dropdown
            setSelectedPlugin();
            var $pluginDropdown = $( "#chartPlugins" );
            $pluginDropdown.empty();
        
            // Add Chart plugins list
            var chartPlugins = App.Plugins.getAllPlugins();
            for( var key in chartPlugins ) {
                if (chartPlugins.hasOwnProperty(key)) {
                    $pluginDropdown.append( '<li><a data-pluginid="' + key + '" href="#">' + chartPlugins[ key ].display_name + '</a></li>' );
                }
            }
    
            // Build datasources dropdown
            var $datasourceDropdown = $( "#chartDatasources" );
            $datasourceDropdown.empty();
            
            var datasources = App.Model.Datasource.datasources;
        
            var nameArr = [];
            for( var id in datasources ) {
                if (datasources.hasOwnProperty(id)) {
                    nameArr.push({name:datasources[id].name, id:id });
                }
            }
            nameArr = nameArr.sort(function (a, b) {
                return a.name > b.name ? 1 : -1;
            });
            //console.info("sort name array: ", nameArr);
            for(var index=0; index<nameArr.length; index++) {
                var id = nameArr[index].id;
                $datasourceDropdown.append( '<li><a data-dsid="' + id + '" href="#"><span class="glyphicon glyphicon-plus"></span> ' + nameArr[index].name + '</a></li>' );
            }
        
            $( "#chartDatasourceList" ).empty();
            $( "#chartPluginConfig" ).empty();
    
            if( !chart ) {
                $modalTitle.text( "Create New Chart" );
                $( "#chartName" ).val( "" );
            } else {
                var ver = "";
                if (chart.plugin.hasOwnProperty('version')) {
                    ver = "v"+ chart.plugin.version;
                }
                $modalTitle.text( "Edit " + chart.name + " Chart " + ver );
                
                $( "#chartName" ).val( chart.name );
        
                for( i = 0; i < chart.datasources.length; i++ ) {
                    addDatasource( chart.datasources[i].datasource , chart.plugin , chart.datasources[i].config );
                    // TODO: Oh God fix this!
                    $datasourceDropdown.find( 'a[data-dsid="' + chart.datasources[i].datasource.id + '"]' ).parent().remove();
                }
        
                if( chart.plugin ) {
                    loadPluginConfig( chart.plugin , chart );
                }
                
                // configure 'chartShowName'
                $( "#chartShowName" ).prop('checked', false);
                if (chart.hasOwnProperty('config') && chart.config.hasOwnProperty('chartShowName')) {
                    $( "#chartShowName" ).prop('checked', chart.config['chartShowName']);
                }
            }
    
            $modal.one( "shown.bs.modal" , function() {
                $( "#chartName" ).focus();
            } );
            $modal.modal( "show" );
        }
    
        function close() {
            //App.Model.Dashboard.checkSysConfDebug()&&console.log("*** View Dashboard Model Close.");
            $( "#chartModal" ).modal( "hide" );
        }
    
        function showErrors( errors ) {
            $alertBox = $( "#chartError" );
            $alertBox.html( errors.join( "<br>" ) );
            $alertBox.show();
        }
    
        function setSelectedPlugin( plugin ) {
            var text = plugin ? plugin.display_name : "Select plugin";
            $( "#chartPluginsButton" ).html( text + ' <span class="caret"></span>' );
        }
    
        function addDatasource( datasource , plugin , config ) {
            dsData = {
                id : datasource.id,
                name : datasource.name,
                uid : datasourceNextID++
            };
    
            var template = $.templates( "#tmpl_ChartDatasource" );
            var $datasource = $( template.render( dsData ) );
            $( "#chartDatasourceList" ).append( $datasource );
    
            if( config ) {
                $datasource.find( "#nds" + dsData.uid + "-label" ).val( config.label );
            }
    
            if( datasource.dataComponents && !plugin.disableComponentDiscovery ) {
                $datasource.find( "#nds" + dsData.uid + "-label" ).hide();
        
                var dcTemplate = $.templates( "#tmpl_ChartDatasourceComponent" );
                var $componentContainer = $( '<div class="datasourceDataComponents"></div>' );
                $datasource.find( ".panel-body" ).prepend( $componentContainer );
                for( var i = 0; i < datasource.dataComponents.length; i++ ) {
                    var dcData = { name : datasource.dataComponents[i] };
                    $componentContainer.append( dcTemplate.render( dcData ) );
                }
        
                if( config && config.components ) {
                    for( var key in config.components ) {
                        if (config.components.hasOwnProperty()) {
                            var $component = $componentContainer.find( 'div[data-component="' + key + '"]' );
                            if( $component.length ) {
                                if( !config.components[key].enabled ) {
                                    $component.find( "button" ).toggleClass( "btn-default btn-success" ); 
                                }
                                $component.find( "input" ).val( config.components[key].label );
                            }
                        }
                    }
                }
            }
    
            if( plugin ) {
                $datasourceConfig = $datasource.find( ".datasourcePluginConfig" );
                loadPluginDatasourceConfig( $datasourceConfig , plugin , config );
            }
    
            var $panelHeading = $datasource.find( ".panel-heading" );
            var $removeButton = $panelHeading.find( "button" );
            $panelHeading.on( "click" , App.Controller.Dashboard.chartDatasourceHeaderClick );
            $removeButton.on( "click" , App.Controller.Dashboard.chartDatasourceRemoveClick );
        }

        function removeDatasource( $panel ) {
            var id = $panel.attr( "data-dsid" );
            var name = $panel.attr( "data-dsname" );
        
            var $datasourceDropdown = $( "#chartDatasources" );
            $datasourceDropdown.append( '<li><a data-dsid="' + id + '" href="#"><span class="glyphicon glyphicon-plus"></span> ' + name + '</a></li>' );
        
            $panel.remove();
        }

        /**
        * load plugin config
        * 
        * Container id : chartPluginConfig
        *
        */
        function loadPluginConfig( plugin , chart ) {
            setSelectedPlugin( plugin );
        
            var $container = $( "#chartPluginConfig" );
            $container.empty();
        
            $( "#chartDatasourceList > div" ).each( function() {
                var dsConfig = null;
                if( chart ) { dsConfig = chart.datasourceMap[ $( this ).attr( "data-dsid" ) ].config; }
                loadPluginDatasourceConfig( $( this ).find( ".datasourcePluginConfig" ) , plugin , dsConfig );
            } );
        
            var $template = $( 'script[data-chart-config="' + plugin.id + '"]' );
            if( !$template.length ) { return; }
        
            $container.html( $template.text() );
        
            for( var key in plugin.chartConfig ) {
                if (plugin.chartConfig.hasOwnProperty(key)) {
                    var $input = $container.find( '[data-prop="' + key + '"]' );
                    if( chart && chart.plugin === plugin && chart.config.hasOwnProperty( key ) ) {
                        setInputValue( $input , chart.config[ key ] );
                    } else {
                        setInputValue( $input , plugin.chartConfig[ key ].default );
                    }
                }
            }
        }

        function loadPluginDatasourceConfig( $container , plugin , config )
        {
            $container.empty();
        
            $template = $( 'script[data-datasource-config="' + plugin.id + '"]' );
            if( !$template.length ) { return; }
        
            $container.html( $template.text() );
    
            for( var key in plugin.datasourceConfig )
            {
                if (plugin.datasourceConfig.hasOwnProperty(key)) {
                    var $input = $container.find( '[data-prop="' + key + '"]' );
                    if( config && config.hasOwnProperty( key ) )
                    {
                        setInputValue( $input , config[ key ] );
                    }
                    else
                    {
                        setInputValue( $input , plugin.datasourceConfig[ key ].default );
                    }
                }
            }
        }

        return {
            open : open,
            close : close,
            showErrors : showErrors,
            addDatasource : addDatasource,
            removeDatasource : removeDatasource,
            loadPluginConfig : loadPluginConfig
        };

    } )(); // End of Modal

  function setPageTitle( title ) {
    $( "#titleDashboard" ).text( title );
    $( "#dashboardBrand" ).hide();
    //$("#dashboardListButton").html(" " + title+ " <span class='caret'></span>");
  }

  function createNewGridList()
  {
    $gridList = null;
    $( "#gridList" ).remove();
    $( "#dashboardPage" ).append( '<ul id="gridList"><li class="position-highlight"></li></ul>' );
  }

    function initGridList() {
        $gridList = $( "#gridList" );
        $gridList.gridList( {
            rows : 4,
            vertical : true,
            widthHeightRatio : 0.62,
            onChange : App.Controller.Dashboard.gridListOnChange
        } , {
            handle : ".gridItemHeader",
            zIndex : 1000
        } );
    }

    /**
     * checkActivedStatus
     * @param chart the target chart for checing
     * @return chart is actived status or not
     */
    function checkActivedStatus( chart ) {
        if ( activedChartList.length == 0 ) {
            return false;
        }
        return ( activedChartList.includes( chart ) );
    }
    
    /**
     * remove all actived charts .actived class
     */
    function deActivedChartList() {
        var total = activedChartList.length;
        for (var index=0; index<total; index++) {
            var chart = activedChartList.pop();
            chart.removeClass('actived');
        }
    }
    
    /**
     * chart add .actived class
     */
    function activedChart( chart ) {
        chart.addClass("actived");
        activedChartList.push(chart);
        chartSelected = true;
    }
    
    /**
        createChartContainer
        @param chart
      
        depends:
            chart.plugin
            chart.pos
     
    */
    function createChartContainer( chart ) {
        if (chart.plugin == null) { return; }
      
        var template = $.templates( "#tmpl_GridContainer" );
        var $container = $( template.render( chart ) );

        if( chart.pos )
        {   // exist chart
            $container.attr( {
                'data-x' : chart.pos.x,
                'data-y' : chart.pos.y,
                'data-w' : chart.pos.w,
                'data-h' : chart.pos.h,
                'data-left'     : (chart.pos.left) ? chart.pos.left: 0,
                'data-top'      : (chart.pos.top) ? chart.pos.top: 0,
                'data-width'    : (chart.pos.width) ? chart.pos.width: 160,
                'data-height'   : (chart.pos.height) ? chart.pos.height: 160,
            } );

            if( !$gridList ) {
                $( "#gridList" ).append( $container );
            }
        }
        else if( $gridList )
        { // new chart depends on $gridList
            var newPos = $gridList.gridList( "add" , 
                $container,
                ((chart.extend.w === undefined) ? DEFAULT_CHART_WIDTH : chart.extend.w),
                ((chart.extend.h === undefined) ? DEFAULT_CHART_HEIGHT : chart.extend.h),
                chart.extend.x,
                chart.extend.y );

            chart.pos = {
                x : newPos.x,
                y : newPos.y,
                w : ((chart.extend.w === undefined) ? DEFAULT_CHART_WIDTH : chart.extend.w),
                h : ((chart.extend.h === undefined) ? DEFAULT_CHART_HEIGHT : chart.extend.h),
                left : newPos.x,
                top : newPos.y,
                width : ((chart.extend.w === undefined) ? DEFAULT_CHART_WIDTH : chart.extend.w),
                height : ((chart.extend.h === undefined) ? DEFAULT_CHART_HEIGHT : chart.extend.h)
            };
        }

        
        var header = $container.find( ".gridItemHeader" );
        header.attr('data-pluginid', chart.plugin.id);
        header["0"].style.zIndex="89";
        header["0"].style.display="block";
    
        var name = $container.find(".gridItemHeader span");
        if (!chart.config['chartShowName']) {
            name["0"].style.display = "none";
        }
    
        var buttons = $container.find(".gridItemHeader div");
        buttons["0"].style.display = "none";

        //var span = $container.find( ".gridItemHeader span" );
        name["0"].style.color = "black";
        
        var size = $container.find( ".gridItemSize" );
        size["0"].style.zIndex="89";
        size["0"].style.display="none";
        
        /**
         * chart hover
         */
        $container.hover(function() {
            if ( !App.Model.Dashboard.checkSysConfLock() ) {
                //App.Model.Dashboard.checkSysConfDebug()&&console.dir($(this));
                //App.Model.Dashboard.checkSysConfDebug()&&console.log($(this)["0"].attributes);

                
                /*$(this)["0"].onkeypress = function(event){
                   console.log("KKKKKKKKKKKKKKKKK"); 
                };*/
                
                var name = $(this).find(".gridItemHeader span");
                name.show();
    
                var buttons = $(this).find(".gridItemHeader div");
                //buttons["0"].style.display="block";
                buttons.show();
                resize = $(this).find(".ui-resizable-handle");
                resize["0"].style.backgroundColor = "#333333";
                size = $(this).find(".gridItemSize");
                var content = $(this).find(".gridItemContent");
                
                content["0"].style.border = "1px solid #ddd";
                size["0"].innerHTML = (content["0"].clientHeight+2)  + "," + (content["0"].clientWidth+2);
                size["0"].style.display="block";
            } else {
                // dashboard is lock mode in init
                $(this).find(".gridItemHeader").hide();
                $(this).find(".ui-resizable-handle").hide();
            }
        },function() { 
            var name = $(this).find(".gridItemHeader span");
            if (!chart.config['chartShowName']) {
                name["0"].style.display = "none";
            }
            
            var buttons = $(this).find(".gridItemHeader div");
            buttons["0"].style.display = "none";
            resize = $(this).find(".ui-resizable-handle");
            resize["0"].style.backgroundColor = "";
            size = $(this).find(".gridItemSize");
            size["0"].style.display="none";
            var content = $(this).find(".gridItemContent");
            content["0"].style.border = "";
        });
        
        return $container.find( ".gridItemContent" );
    }

    function updateChartContainer( chart ) {
        var $listItem = $( '#gridList li[data-id="' + chart.id + '"]' );
        $listItem.find( ".gridItemHeader > span" ).text( chart.name );
    
        var $content = $listItem.find( ".gridItemContent" );
        $content.empty();
        return $content;
    }

    function showRemoveOverlay( $container ) {
        $content = $container.find( ".gridItemContent" );
        if( $content.find( ".gridItemOverlay" ).length > 0 ) { return; }
    
        $overlay = $(
        '<div class="gridItemOverlay" style="display:none"><div class="gridItemOverlayContent">' +
        '<p>Are you sure you want to delete this chart?</p>' +
        '<p><button type="button" class="btn btn-success">Yes</button> <button type="button" class="btn btn-danger">Cancel</button></p>' +
        '</div></div>'
        );
    }

    function hideRemoveOverlay( $container ) {
        var $overlay = $container.find( ".gridItemOverlay" );
        $overlay.fadeOut( 200 , ( function() {
        this.remove();
        } ).bind( $overlay ) );
    }

    function showMissingPlugin( $container , plugin_id ) {
        if ( $container == undefined ) {
            App.View.Status.set( "[ERROR][showMissingPlugin] $container is undefined!" );
            return;
        }
        $container.append( '<div class="alert alert-danger">Missing plugin: ' + plugin_id + '</div>' );
    }

    function showPendingDatasources( $container , datasources )
    {
        var $alert = $container.find( ".alert" );
        if( !$alert.length )
        {
        $alert = $( '<div class="alert alert-info"></div>' );
        $container.append( $alert );
        }
    
        var namesHtml = datasources.map( function( d ) {
        return d.name;
        } ).join( ', ' );
    
        $alert.html( '<strong>Waiting on datasources:</strong> ' + namesHtml );
    }

    /**
    
     */
    function getInputValue( $input ) {
        if( $input.attr( "type" ) === "checkbox" ) {
            return $input.prop( "checked" );
        }
        return (($input.val() == null) ? $input.val() : $input.val().trim());
    }

    /**
     *
     */
    function setInputValue( $input , value ) {
        if( $input.attr( "type" ) === "dropdown-menu" ) {
            $input.empty();
            for(var index=0; index < value.length; index++) {
                $input.append( '<li><a data-isid="' + index + '" href="#"><span class="glyphicon  glyphicon-plus"></span> ' + value[index] + '</a></li>' );
            }
        } else if( $input.attr( "type" ) === "checkbox" ) {
            $input.prop( "checked" , value );
        } else if( $input.attr( "type" ) === "textArr" ) {
            if (value.trim().length > 0) {
                var arrData = value.split(",");
                for(var index=0; index < arrData.length; index++) {
                    if (arrData[index].trim().length > 0) {
                        $input.parent().parent().parent().append($input.attr("data-clone").replace(/{value}/,arrData[index]));
                    }
                }
                $input.val( value );
            }
        } else {
            $input.val( value );
        }
    }

    /**
     *
     */
    function setChartBoard() {
        categoryTypes = {};
      
        var chartPlugins = App.Plugins.getAllPlugins();
        for( var key in chartPlugins ) {
            if (chartPlugins.hasOwnProperty(key)) {

                if (chartPlugins[ key ].category != undefined) {
                    if( !categoryTypes.hasOwnProperty( chartPlugins[ key ].category ) ) {
                        categoryTypes[chartPlugins[ key ].category] = [];
                    }
                    categoryTypes[chartPlugins[ key ].category].push(chartPlugins[ key ]);
                }
            }
        }
   
        var content = "";
		var categoryList = [ "Basic", "Factory", "Icon", "Media", "Meter", "NVD3", "Others"]; /*kewei add*/
        for( var category in categoryTypes ) {
            if (categoryTypes.hasOwnProperty(category)) {
                content = content + '<div id="palette-container-' + category + '" class="palette-category palette-open" style="display: block; color:black;"><div id="palette-header-' + category + '" class="palette-header"><span>' + category + '</span></div>' + 
                '<div class="palette-content" id="palette-base-category-' + category + '" style="">' +
                '<div id="palette-' + category + '">';
				
				/*kewei modify*/
                for(var index = 0; index < categoryTypes[category].length; index++) {
                    var item = categoryTypes[category][index];
					if (!item.category){
						item.category = "Others";
					}
					for( i=0; i<categoryList.length; i++){
						if (item.category === categoryList[i]){
							break;
						}
						else if (i === categoryList.length-1 ){
							item.category = "Others";
						}
					}
                    content = content + '<div data-pluginid="'+ item.id +'" id="palette_node_' + item.display_name +
					'" class="palette_node ui-draggable palette_node_' + item.category + '" style="height: 28px;">' + //background-color: ' + item.color + '; 
                            '<div class="palette_id" style="display:none">' + item.id + '</div>' +
                            '<div class="palette_label">' + item.display_name + '</div>' + '</div>';
                }
                
                content = content + '</div></div></div>';
            }
        }
        $( ".chartBoard" ).empty();
        $( ".chartBoard" ).append( content );
  }
  
    /// <summary>init Dashboard View Lock mode from setting.</summary>  
    /// <param/>
    /// <returns/>
    function initLockDashboardMode() {
        // check lock status from model
        if ( App.Model.Dashboard.checkSysConfLock() ) {
            // mean set Lock mode
            $('#switchLockDashboard > span').removeClass( "fa-unlock" ).addClass( "fa-lock" );
            $("#createNewChart2").hide();
        } else {
            // mean set Unlock mode
            $('#switchLockDashboard > span').removeClass( "fa-lock" ).addClass( "fa-unlock" );
            $("#createNewChart2").show();
        }
    }
    
    /**
     * switch Lock mode.
     * @param 
     * @returns
     */
    function switchLockDashboardMode() {       
        // clear activedChartList
        deActivedChartList();
        
        if ( App.Model.Dashboard.checkSysConfLock() ) {
            $('#switchLockDashboard > span').removeClass( "fa-lock" ).addClass( "fa-unlock" );
            App.Model.Dashboard.setSysConfLock( false );
            $("#createNewChart2").show();
            $("#dashboardPage > ul > li > .gridItemHeader").show();
            $("#dashboardPage > ul > li > .ui-resizable-handle").show();
        }
        else {
            $('#switchLockDashboard > span').removeClass( "fa-unlock" ).addClass( "fa-lock" );
            App.Model.Dashboard.setSysConfLock( true );
            $("#createNewChart2").hide();
            if($( ".chartBoard" ).css('display') == 'block') {
                $("#createNewChart2 > span").removeClass( "glyphicon-check" ).addClass( "glyphicon-unchecked" );
                $( ".chartBoard" ).toggle();
                $("#dashboardPage").css({ left: '0px'});
                $( ".chartInfoPage" ).toggle();
            }
            $("#dashboardPage > ul > li > .gridItemHeader").hide();
            $("#dashboardPage > ul > li > .ui-resizable-handle").hide();            
        }
    }
    
    /**
     * Depends on $(window) height to adjust the Dropdown Menu height to fit window
     * @param
     * @return
     */
    function adjustDropdownMenuHeight() {
        //var data = $(window).height() - 58 - 24 - 10;
        $('.dropdown-menu').css('max-height', '40vh'); /*kewei modified*/
    }
    
    function setChartSelected( mode ) {
        chartSelected = mode;
    }
	
	/*kewei added*/
	function setBackgroundImg( imgName ) {
		var $dashboardPage = $("#dashboardPage"), 
			$imgScale = $('#imgScale'), 
			$imgCenter = $('#imgCenter');
		var screenHeight = window.screen.height - 84;
		var screenWidth = window.screen.width;
		var scale = "contain";
		var center = $imgCenter.prop('checked') ? ["fixed","center"]:["",""];
		imgName = "images/"+imgName;
		$dashboardPage.removeAttr("style");
		$dashboardPage.css({
			'display' : 'block',
			'width' : screenWidth,
			'height' : screenHeight,
            'background-image' : 'url("' + imgName + '")',
            'background-repeat': 'no-repeat',
			'background-attachment': center[0],
			'background-position': center[1],
			'background-size': scale
        });
		saveBackgroundSettings ( imgName, scale, center);
	}
	
	function saveBackgroundSettings ( imgName, scale, center){
		var imgName = imgName, 
			dashbaordName = localStorage.getItem("dashboardName"), 
			scale = scale, center = center;
		$.ajax({
            type : "POST",
            url : "api/user/saveBKSettings",
            data : { imgName:imgName, dashbaordName:dashbaordName, scale:scale, center:center },
			cache: false,
            success: function (msg) {
				console.log(msg);				
            },
			error: function (error) {
				console.log(error);
			}
        });
	}
	
    return {
        Modal : Modal,
        setPageTitle : setPageTitle,
        createNewGridList : createNewGridList,
        initGridList : initGridList,
        createChartContainer : createChartContainer,
        updateChartContainer : updateChartContainer,
        showRemoveOverlay : showRemoveOverlay,
        hideRemoveOverlay : hideRemoveOverlay,
        showMissingPlugin : showMissingPlugin,
        showPendingDatasources : showPendingDatasources,
        getInputValue : getInputValue,
        setChartBoard : setChartBoard,
        switchLockDashboardMode : switchLockDashboardMode,
        adjustDropdownMenuHeight : adjustDropdownMenuHeight,
        initLockDashboardMode : initLockDashboardMode,
        setChartSelected : setChartSelected,
        deActivedChartList : deActivedChartList,
        activedChart : activedChart,
		setBackgroundImg : setBackgroundImg ,
		saveBackgroundSettings : saveBackgroundSettings
    };
})();

$(function () {
	/*DropdownList*/
	var DROPDOWN = 'dropdown'
	var ON = 'on'
	var SLIDETOGGLE_SPEED = 'fast'
	var ARROW = '<b class="arrow"></b>'
	var $nav = $('ul.nav')
	
	$("#dropdownMenu a").click(function (event) {
		event.preventDefault();
	});
	$nav.find('li>ul').prev().addClass(DROPDOWN).append(ARROW);
	$nav.find('li>a>b').click(function (event) {
		$(this).toggleClass(ON);
		$(this).parent().next().slideToggle(SLIDETOGGLE_SPEED);
	});
	$nav.find('li>a>i').click(function (event) {
		$(this).toggleClass(ON);
		$(this).parent().next().slideToggle(SLIDETOGGLE_SPEED);
	});
	$(window).resize(function () {
		if($(window).width()>768){
			$nav.find('li a b').removeClass(ON);
			$nav.find('.sub-menu').css('display', '');
		}
	});
	/*Grid Check*/
	var $showGrid = $('#showGrid');
	var $snapToGrid = $('#snapToGrid');
	function checkShowGrid(){
		if($showGrid.prop('checked')){
			localStorage.setItem("showGrid","true");
			App.gridLine.toggleShowGrid(true);
		}else{
			localStorage.setItem("showGrid","false");
			App.gridLine.toggleShowGrid(false);
		}
	}
	
	function checkSnapToGrid(){
		if($snapToGrid.prop('checked')){
			localStorage.setItem("snapToGrid","true");
		}else{
			localStorage.setItem("snapToGrid","false");
		}
	}
	
	$showGrid.on("change", checkShowGrid);
	$snapToGrid.on("change", checkSnapToGrid);
	
	/*background Check*/
	var $BKSwitch = $('#BK-on-off');
	var $BKSet = $('#BK-set');
	var $imgScale = $('#imgScale');
	var $imgCenter = $('#imgCenter');
	var $dashboardPage = $("#dashboardPage");
	
	function checkBKSwitch(){
		event.preventDefault();
		$dashboardPage.removeAttr('style');
		$dashboardPage.css({
			'display' : 'block',
		});	
		App.View.Dashboard.setBackgroundImg("images/Clear");
	}
	
	function checkImgName(){
		event.preventDefault();
		var imgName = $('#imgDrpodownList :selected').text();
		imgName === "Select image..." ? imgName = "":null;
		App.View.Dashboard.setBackgroundImg(imgName);
	}

	function checkBackgroundStatus(){
		var imgName = "", 
			center = new Array(2);
		var scale = $imgScale.prop('checked') ? "100% 100%" : "contain";
		var center = $imgCenter.prop('checked') ? ["fixed","center"]:["",""];
		
		$dashboardPage.css({
			'background-size': scale,
			'background-attachment': center[0],
			'background-position': center[1]
		});			
		//Save to config_default.json
		App.View.Dashboard.saveBackgroundSettings ( imgName, scale, center);
	}	
	
	$BKSet.on("click", checkImgName);
	$BKSwitch.on("click", checkBKSwitch);
	$imgScale.on("change", checkBackgroundStatus);
	$imgCenter.on("change", checkBackgroundStatus);
});