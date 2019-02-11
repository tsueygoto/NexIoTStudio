
var App = App || {};

App.Plugins = ( function() {

    var chartTypes = {};
    var chartDependencies = [];

    /**
        loadPlugins
            null            --->    get all
            length == 0     --->    return none
            length > 0      --->    return used
     */
    function loadPlugins(loadPlugins)
    {
        var dfd = $.Deferred();
        console.info(">>>>>>>>>> loadPlugins : ", loadPlugins);

        if ((loadPlugins != null) && (loadPlugins.length == 0))
        {
            dfd.resolve();
        }
        else
        {
            var param = null;
            if (loadPlugins != null)
            {
                param = {"loadPlugins[]" : loadPlugins};
            }
    
            $.get( "api/plugins", param ).then( function( data ) {
                App.View.Status.set( "body append data ..." );
                //console.info("api/plugins >>> ", data);
                $( "body" ).append( data );
                
                loadDependencies().then(function(ret){
                    dfd.resolve(ret);
                }, function(err){
                    dfd.reject(err);
                });
            });
        }
        
        return dfd.promise();
        
        //return $.get( "api/plugins" ).then( function( data ) {
        //    App.View.Status.set( "body append data ..." );
        //    $( "body" ).append( data );
        //    return loadDependencies();
        //});
    }

    function loadDependencies()
    {
        var dfd = $.Deferred();
        
        var dependencyDeferreds = [];
        console.info("chartDependencies : ", chartDependencies);
        
        for( var i = 0; i < chartDependencies.length; i++ )
        {
            var ext = chartDependencies[i].substring( chartDependencies[i].lastIndexOf( "." ) + 1 );
            if( ext == "js" )
            {
                App.View.Status.set( "get script : " +  chartDependencies[i] + " ...");
                dependencyDeferreds.push( $.getScript( chartDependencies[i] ) );
            }
            else if( ext == "css" )
            {
                $( "head" ).append( '<link type="text/css" rel="stylesheet" href="' + chartDependencies[i] + '">' );
            }
            else
            {
                console.info( "The chart depends [", chartDependencies[i], "] Unknown dependency type: ", ext );
            }
        }

        console.info("dependencyDeferreds : ", dependencyDeferreds);
        $.when.apply( $ , dependencyDeferreds ).then(function(ret) {
            App.View.Status.set( "apply dependencyDeferreds : " +  ret + " ...");
            dfd.resolve(ret);
        }, function(err){
            dfd.reject(err);
        });
        
        return dfd.promise();
    }

    function registerChartType( id , chart , options )
    {
        if( chartTypes.hasOwnProperty( id ) )
        {
            console.error( "Chart type " + id + " already registered." );
            return;
        }

        options = options || {};
    
        if( options.hasOwnProperty( "dependencies" ) &&
            $.isArray( options.dependencies ) &&
            options.dependencies.length > 0 ) {
            
            // TODO: Watch out for duplicate entries
            //console.info("option: ", options.dependencies, " index: ", chartDependencies.indexOf(options.dependencies));
            for(var index=0; index < options.dependencies.length; index++) {
                if ( (chartDependencies.length == 0 ) || 
                    (chartDependencies.indexOf(options.dependencies[index]) == -1) ) {
                    chartDependencies.push( options.dependencies[index] );
                }                
            }
            //chartDependencies = chartDependencies.concat( options.dependencies );
            //console.info("chartDependencies : ", chartDependencies);
        }

        var plugin = {
            id                        : id,
            category                  : options.category || "Others",
            display_name              : options.display_name || id,
            plugin                    : chart,
            chartConfig               : options.chartConfig || {},
            datasourceConfig          : options.datasourceConfig || {},
            disableComponentDiscovery : options.disableComponentDiscovery,
            color                     : options.color || "#FFFFFF",
            version                   : options.version || "1.0.0"
        };

        chartTypes[ id ] = plugin;
    }

  function getPlugin( id )
  {
    return chartTypes.hasOwnProperty( id ) ? chartTypes[ id ] : null;
  }

  function getAllPlugins()
  {
    return chartTypes;
  }

  return {
    loadPlugins : loadPlugins,
    registerChartType : registerChartType,
    getPlugin : getPlugin,
    getAllPlugins : getAllPlugins
  };

} )();
