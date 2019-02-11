
var App = App || {};
App.View = App.View || {};

App.View.Status = ( function() {

  function set( msg )
  {
    var time = ( new Date() ).toLocaleTimeString();
    $( "#statusBarMessage" ).text( "[" + time + "] " + msg );
  }

  function clear()
  {
    $( "#statusBarMessage" ).html( "&nbsp;" );
  }

  function setConnected( connected )
  {
      //App.Model.Dashboard.checkSysConfDebug()&&console.log("SetConnected");
    var $target = $( ".statusBarConnect" );
    if( connected ) {
        $target.addClass( "connected" );
    }
    else {
        $target.removeClass( "connected" );
    }
  }
  
    /// <summary>Set version info in status bar.</summary>  
    /// <param name="ver" type="String">The version of the IoT Dashboard.</param>  
    /// <returns>None</returns> 
    function setVersion( ver ) {
        //App.Model.Dashboard.checkSysConfDebug()&&console.log("setVersion");
        $( ".statusVerion" ).text(ver);
    }

  return {
    set : set,
    clear : clear,
    setConnected : setConnected,
    setVersion : setVersion
  };

} )();
