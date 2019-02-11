
var App = App || {};
App.Model = App.Model || {};

App.Model.Dashboard = ( function() {

    var Dashboard = function( name ) {
        this.name = name;
        this.datasources = {};
        this.charts = {};
        this.active = false;
        this.id = "nex.dashboard." + (1+Math.random()*4294967295).toString(16);
    };

    Dashboard.prototype.serialize = function() {
        var data = {
            name : this.name,
            charts : []
        };
    
        for( var i in this.charts )
        {
            if (this.charts.hasOwnProperty(i)) {
                data.charts.push( this.charts[i].serialize() );  
            }
        }
        
        if (this.hasOwnProperty("id"))
        {
            data.id = this.id;
        }
    
        return data;
    };

    Dashboard.prototype.unserialize = function( data ) {
        this.name = data.name;
        for( var i in data.charts )
        {
            if (data.charts.hasOwnProperty(i)) {
                var chart = new App.Model.Chart( data.charts[i] );
                this.addChart( chart );
            }
        }
        if (data.hasOwnProperty("id"))
        {
            this.id = data.id;
        }
    };

    Dashboard.prototype.load = function() {
        this.active = true;
        this.subscribeToAllDatasources();
    };

    Dashboard.prototype.unload = function() {
        this.active = false;
        for( var id in this.charts ) {
            if (this.charts.hasOwnProperty(id)) {
                this.charts[id].unload();
            }
        }
    };

    Dashboard.prototype.getChart = function( id ) {
        return this.charts.hasOwnProperty( id ) ? this.charts[id] : null;
    };

    /*
     * Dashboard
     *      addChart
     */
    Dashboard.prototype.addChart = function( chart ) {
        
        this.charts[ chart.id ] = chart;

        var sub = [];
        for( var i = 0; i < chart.datasources.length; i++ ) {
            var datasource = chart.datasources[i].datasource;
            if( !this.datasources.hasOwnProperty( datasource.id ) )
            {
                this.datasources[ datasource.id ] = datasource;
                sub.push( datasource.id );
            }
            datasource.addChart( chart , i );
        }
        if( this.active && sub.length ) {
            App.Net.subscribeToDatasources( sub );
        }
    };

    Dashboard.prototype.removeChart = function( id ) {
        if( this.active )
        {
            var unsub = [];
            for( var dsid in this.datasources )
            {
                if (this.datasources.hasOwnProperty(dsid)) {
                    this.datasources[ dsid ].removeChart( id );
                    if( this.datasources[ dsid ].isEmpty() )
                    {
                        unsub.push( dsid );
                        delete this.datasources[ dsid ];
                    }
                }
            }
        
            if( unsub.length ) {
                App.Net.unsubscribeFromDatasources( unsub );
            }
        }
    
        // chart.unload()
        delete this.charts[ id ];
    };

    Dashboard.prototype.subscribeToAllDatasources = function() {
        var sub = [];
        for( var id in this.datasources ) { 
            if (this.datasources.hasOwnProperty(id)) {
                sub.push( id ); 
            }
        }
        App.View.Status.set( "App.Net.subscribeToDatasources start" );
        App.Net.subscribeToDatasources( sub );
        App.View.Status.set( "App.Net.subscribeToDatasources end" );
        $('.loading').hide();
    };

    Dashboard.prototype.pushData = function( data ) {
        if( !this.datasources.hasOwnProperty( data.id ) ) { return; }
    
        var datasource = this.datasources[ data.id ];
        if( data.type == "live" ) { datasource.pushData( data.data ); }
        else if( data.type == "history" ) { datasource.pushHistoryData( data.cid , data.data ); }
        else if( data.type == "config" ) { datasource.updateConfig( data.config ); }
    };
  
    /**
        checkChartHit
        params: mouse cursor posX, posY
        return: ture or false
     */
    Dashboard.prototype.checkChartHit = function(posX, posY) {
        for( var id in this.charts )
        {
            if (this.charts.hasOwnProperty(id))
            {
                console.info(this.charts[id], posX, posY, this.charts[id].pos);
                var pos = this.charts[id].pos;
                if ((posX >= pos.left) &&
                    (posX <= (pos.left + pos.width)) &&
                    (posY >= pos.top) &&
                    (posY <= (pos.top + pos.height)))
                {
                    return true;
                }
            }
        }
        return false; 
    }
    
    /**
     */
    Dashboard.prototype.setChartsSelected = function(left, top, right, bottom) {
        var chartIds = [];
        for( var id in this.charts )
        {
            if (this.charts.hasOwnProperty(id))
            {
                var pos = this.charts[id].pos;
                console.info(left, top, right, bottom, pos);
                if ((pos.left > left) &&
                    (pos.top > top) &&
                    ((pos.left + pos.width) < right) &&
                    ((pos.top + pos.height) < bottom))
                    {
                        if (chartIds.indexOf({"id": this.charts[id].id}) == -1)
                        {
                            chartIds.push({"id": this.charts[id].id, "pos": pos});
                        }
                    }
            }
        }
        return chartIds; 
    }
	
	/*kewei added : upload image*/
	Dashboard.uploadImg = function( files ){
		var customImgs = files[0];
		var $imgDrpodownList = $( "#imgDrpodownList" );
		var imgFormData = new FormData();
        imgFormData.append("file", customImgs);
		$.ajax({
            url: 'imgUpload', /*URL doesn't need slash*/
            type: 'post',
            data: imgFormData,
            cache: false,
			contentType: false,
			processData: false,
			beforeSend: function(){
				$('.loading').show();
			},
            complete: function (msg) {
				$('.loading').hide();
            }
        });	
		$imgDrpodownList.prepend( '<option value="'+ customImgs.name +'">'+ customImgs.name +'</option>' );
	};
	
	/*kewei added : Get images list*/
	Dashboard.getImageList = function(){		
		var $imgDrpodownList = $( "#imgDrpodownList" );
		$.getJSON( "imagesources" ).done( function( imagesources ) {
				imagesources.sort();
				$imgDrpodownList.empty();
				$imgDrpodownList.append('<option value="Hint" disabled selected hidden>Select image...</option>');
				for( i=0; i<imagesources.length; i++ ){
					$imgDrpodownList.append( '<option value="'+ imagesources[i] +'">'+ imagesources[i] +'</option>' );
				}
		} );
			
	};
	
	/*kewei added : Get background setting*/
	Dashboard.getBKSetting = function(){		
		var dashbaordName = localStorage.getItem("dashboardName");
		var screenHeight = window.screen.height - 84;
		var screenWidth = window.screen.width;
		$.ajax({
            type : "POST",
            url : "api/user/getBKSettings",
            data : { dashbaordName:dashbaordName },
			cache: false,
            success: function (msg) {
				var BKsetting = JSON.parse(msg);				
				var BKImage = BKsetting.BKImage || ""; 
				var scale = BKsetting.scale || "";
				var center = BKsetting.center || new Array(2);
				var BKImageCheck = BKImage.split("/");
				var $dashboardPage = $("#dashboardPage");
				scale === "100% 100%" ? $('#imgScale').prop("checked", true):null;
				center[0] ? $('#imgCenter').prop("checked", true):null;
				$dashboardPage.removeAttr("style");
				$dashboardPage.css({
						'display' : 'block',
						'height' : screenHeight,
						'width' : screenWidth
				});
				if (BKImageCheck[1]){	
					$dashboardPage.css({
						'background-image' : 'url("' + BKImage + '")',
						'background-repeat': 'no-repeat',
						'background-size': scale,
						'background-attachment': center[0],
						'background-position': center[1],
					});	
				}
            },
			error: function (error) {
				console.log("Error : "+ error);
			}
        });	
	};
  
    Dashboard.dashboards = [];

    Dashboard.getDashboard = function( id ) {
        return Dashboard.dashboards.hasOwnProperty( id ) ? Dashboard.dashboards[ id ] : null;
    };

    Dashboard.addDashboard = function( dashboard ) {
        Dashboard.dashboards.push( dashboard );
    };

    Dashboard.removeDashboard = function( id ) {
        Dashboard.dashboards.splice( id , 1 );
    };

    Dashboard.serializeAll = function() {
        var data = [];
        for( var i in Dashboard.dashboards ) {
            if (Dashboard.dashboards.hasOwnProperty(i)) {
                data.push( Dashboard.dashboards[i].serialize() );
            }
        }
        return data;
    };

    Dashboard.unserializeAll = function( data )
    {
        for( var i in data )
        {
            if (data[i])
            {
                var dashboard = new Dashboard();
                dashboard.unserialize( data[i] );
                Dashboard.addDashboard( dashboard );
            }
        }
    };
  
    Dashboard.config = {};
	
    Dashboard.setSysConf = function( data ) {
        Dashboard.config = data;
    }

    Dashboard.getSysConf = function() {
        return ( Dashboard.config === {} ? { "lock": 0, "debug": 0 } : Dashboard.config );
    }
    
    /// <summary>check setting lock status.</summary>  
    /// <param/>
    /// <returns type="Boolean">lock mode.</returns>
    Dashboard.checkSysConfLock = function() {
        if ( Dashboard.config.lock == undefined ) { return false; }
        if ( Dashboard.config.lock == 1 ) { return true; }
        else { return false; }
    }
    
    /// <summary>set setting lock status.</summary>  
    /// <param name="mode" type="Boolean">The lock mode value.</param>
    /// <returns type="Boolean">lock mode.</returns>
    Dashboard.setSysConfLock = function( mode ) {
        // need save change to setting file.
        if ( mode ) { Dashboard.config.lock = 1; }
        else { Dashboard.config.lock = 0; }
        App.Configure.saveConfigure();
    }
    
    /// <summary>check setting debug status.</summary>  
    /// <param/>
    /// <returns type="Boolean">debug mode.</returns>
    Dashboard.checkSysConfDebug = function() {
        if ( Dashboard.config.debug == undefined ) { return false; }
        if ( Dashboard.config.debug == 1 ) { return true; }
        else { return false; }
    }
    
    return Dashboard;
    
} )();

App.Model.Package = ( function() {
    var Package = {};
    
    /// <summary>check setting debug status.</summary>  
    /// <param/>
    /// <returns type="Boolean">debug mode.</returns>
    Package.setData = function( data ) {
        Package = data;
    }

    ///
    ///
    ///
    Package.getNexcomVersion = function() {
        var ver = "0.0.0";
        try {
            ver = ( Package.nexcom.version == undefined ? ver : Package.nexcom.version );
        } catch( e ) {}
        return ver;
    }
    
    return Package;
})();
