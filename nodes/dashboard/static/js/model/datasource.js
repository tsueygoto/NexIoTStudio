
var App = App || {};
App.Model = App.Model || {};

App.Model.Datasource = ( function() {

    var Datasource = function( id , config ) {
        if( config ) { this.unserialize( config ); }
    
        this.id = id;
        this.chartCount = 0;
        this.charts = {};
        this.end = null;
    
        this.historyRequests = {};
        this.buttonRequests = {};
        this.clickRequests = {};
        this.dataBrokers = {};
    };

    Datasource.prototype.unserialize = function( data ) {
        this.name = data.name;
        this.tstampField = data.tstampField;
        this.dataField = data.dataField;
        this.dataComponents = data.dataComponents;
    
        if( this.tstampField !== "tstamp" ) { this.tstampField = this.tstampField.split("."); }
        if( this.dataField !== "data" ) { this.dataField = this.dataField.split("."); }
    };

  Datasource.prototype.getNestedValue = function( obj , keyArr ) {
    try
    {
      return keyArr.reduce( function( reduceObj , i ) {
        return reduceObj[i];
      } , obj );
    }
    catch( e )
    {
      return undefined;
    }
  };

  Datasource.prototype.addChart = function( chart ) {
    if( this.charts.hasOwnProperty( chart.id ) )
    {
      console.error( "Datasource already has chart: " + chart.id );
      return;
    }

    this.charts[ chart.id ] = chart;
    this.chartCount++;
  };

  Datasource.prototype.removeChart = function( id ) {
    if( this.charts.hasOwnProperty( id ) )
    {
      delete this.charts[ id ];
      delete this.historyRequests[ id ];
      this.chartCount--;
    }
  };

    Datasource.prototype.updateConfig = function( config )
    {
        this.unserialize( config );
        for( var id in this.charts )
        {
            if (this.charts.hasOwnProperty(id)) {
                this.charts[ id ].datasourceConfigChanged( this );
            }
        }
    };

  Datasource.prototype.isEmpty = function() {
    return this.chartCount === 0;
  };

  Datasource.prototype.isReady = function() {
    return this.dataComponents !== undefined;
  };

    Datasource.prototype.convertData = function( data ) {
        if( $.isArray( data ) )
        {
            for( var i = 0; i < data.length; i++ )
            { data[i] = this.convertDataPoint( data[i] ); }
        
            return data;
        }
        else { return this.convertDataPoint( data ); }
    };

  Datasource.prototype.convertDataPoint = function( data ) {
    var converted = {
      tstamp : this.tstampField == "tstamp" ? data.tstamp : this.getNestedValue( data , this.tstampField ),
      data : this.dataField == "data" ? data.data : this.getNestedValue( data , this.dataField )
    };

    return converted;
  };

    Datasource.prototype.pushData = function( data ) {
        data = this.convertData( data );
    
        for( var id in this.charts )
        {
            if (this.charts.hasOwnProperty(id)) {
                this.charts[id].pushData( this , data );
            }
        }
    };

  Datasource.prototype.pushHistoryData = function( chartID , data ) {
    if( !this.charts.hasOwnProperty( chartID ) || !this.historyRequests.hasOwnProperty( chartID ) ) { return; }

    if( this.tstampField !== "tstamp" || this.dataField !== "data" )
    {
      data = this.convertData( data );
    }

    this.charts[ chartID ].pushData( this , data , this.historyRequests[ chartID ] );
    delete this.historyRequests[ chartID ];
  };

  Datasource.prototype.requestHistoryData = function( chart , start , end , callback ) {
      console.log("request data 1");
      console.log(this.charts.hasOwnProperty( chart.id ));
      console.log(this.historyRequests.hasOwnProperty( chart.id ));
    if( !this.charts.hasOwnProperty( chart.id ) || this.historyRequests.hasOwnProperty( chart.id ) ) { return; }
    
    if( typeof callback != "function" ) { return; }

      console.log("request data 2");
    this.historyRequests[ chart.id ] = callback;
    App.Net.requestHistoryData( this.id , chart.id , start , end );
  };

  Datasource.prototype.buttonRequest = function( chart , start , end , callback ) {
      console.log("button request data 1");
      console.log(this.charts.hasOwnProperty( chart.id ));
      console.log(this.buttonRequests.hasOwnProperty( chart.id ));
    if( !this.charts.hasOwnProperty( chart.id ) ) { return; }
    
    if( typeof callback != "function" ) { return; }

    console.log("button request data 2");
    //this.historyRequests[ chart.id ] = callback;
    this.buttonRequests[ chart.id ] = callback;
    //App.Net.requestHistoryData( this.id , chart.id , start , end );
    App.Net.buttonRequest( this.id , chart.id , start , end );
  };
  
    ///
    ///
    ///
    Datasource.prototype.clickRequest = function( chart , data , callback ) {
        console.log("click request data 1");
        console.log(this.charts.hasOwnProperty( chart.id ));
        console.log(this.clickRequests.hasOwnProperty( chart.id ));
        if( !this.charts.hasOwnProperty( chart.id ) ) { return; }
    
        if( typeof callback != "function" ) { return; }

        console.log("click request data 2");
        this.clickRequests[ chart.id ] = callback;
        App.Net.clickRequest( this.id , chart.id , data );
    };


    /**
     *
     */
    Datasource.prototype.dataBroker = function( chart , data )
    {
        console.log("data Broker data");
        console.log(this.charts.hasOwnProperty( chart.id ));
        console.log(this.dataBrokers.hasOwnProperty( chart.id ));
        if( !this.charts.hasOwnProperty( chart.id ) ) { return; }
    
        //if( typeof callback != "function" ) return;

        //console.log("click request data 2");
        //this.clickRequests[ chart.id ] = callback;
        App.Net.dataBroker( this.id , chart.id , data );
    };
    
    Datasource.getDatasources = function(usedDss)
    {
        var dfd = $.Deferred();
        
        console.info(">>> usedDss : ", usedDss);
        
        if ((usedDss != null) && (usedDss.length == 0))
        {
            if( !Datasource.datasources ) { Datasource.datasources = {}; }
            dfd.resolve();
        }
        else
        {
            var param = null;
            if (usedDss != null)
            {
                param = {"usedDss[]" : usedDss} ;
            }
            console.info(">>>>> param : ", param);
            $.getJSON( "api/datasources", param ).done( function( datasources ) {
                //console.info("--------- location : ", location.pathname.replace( $( "base" ).attr( "href" ) , "" ));
                //var item = location.pathname.replace( $( "base" ).attr( "href" ) , "" ).split("/");
                //alert(item);
                //if(item.length > 0) {
                //    console.log(item[1]);
                //    var dashboard = App.Model.Dashboard.getDashboard( item[1] );
                //    console.info("dashboard : ", dashboard)
                //}
                
                //console.log( "getDatasources start .............................." );
                if( !Datasource.datasources ) { Datasource.datasources = {}; }
                
                //console.info("%%%%%%%%%%%%%%%%%% datasources : ", datasources);
                // sort by name
                //var nameArr = [];
                //for( var id in datasources ) {
                //    nameArr.push({name:datasources[id].name, id:id });
                //}
                //nameArr = nameArr.sort(function (a, b) {
                //    return a.name > b.name ? 1 : -1;
                //});
                //console.info("sort name array: ", nameArr);
                //for(var index=0; index<nameArr.length; index++) {
                //    var id = nameArr[index].id;
                //    if( Datasource.datasources.hasOwnProperty( id ) )
                //        Datasource.datasources[ id ].updateConfig( datasources[id] );
                //    else
                //        Datasource.datasources[ id ] = new Datasource( id , datasources[id] );
                //}
                for( var id in datasources ) {
                    if (datasources.hasOwnProperty(id)) {
                        //console.info("datasources id : ", id, " name : ", datasources[id].name);
                        if( Datasource.datasources.hasOwnProperty( id ) ) {
                            Datasource.datasources[ id ].updateConfig( datasources[id] );
                        }
                        else {
                            Datasource.datasources[ id ] = new Datasource( id , datasources[id] );
                        }
                    }
                }
                
                console.info( "getDatasources end ................................." );
                console.info("Datasource.datasources : ",Datasource.datasources);
                dfd.resolve();
            } ).fail(function(){ dtd.reject(); });
        }
        
        return dfd.promise();
    };

    Datasource.getDatasource = function( id )
    {
        if (Datasource.datasources == null) { return null; }
        return Datasource.datasources.hasOwnProperty( id ) ? Datasource.datasources[id] : null;
    };

    Datasource.datasources = null;

  return Datasource;

} )();
