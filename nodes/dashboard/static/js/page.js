
var App = App || {};

App.Page = ( function()
{

    var pageChangeCallbacks = [];
    
    var currentPage = null, currentPageNav = null;
    var isNavigating = false;
    var baseUrl = "/dash/";

    /**
     *
     */
    function procPathname( pathname )
    {
        // to remove /dash/
        console.info("baseUrl :", baseUrl);
        console.info("pathname :", pathname);
        
        var matchPos = pathname.search(baseUrl);
        if ( matchPos == -1 ) // no match
        {
            navigateTo( "" , false );
        }
        else
        {
            var target = pathname.substring(matchPos, pathname.length);
            console.info(location, pathname, pathname.replace( baseUrl , "" ), "[", target, "]");
            navigateTo( target.replace( baseUrl , "" ) , false );
        }
        
    }
    
    /**
     *
     */
    function init()
    {
        baseUrl = $( "base" ).attr( "href" ) || "/dash/";
        
        console.info("location.pathname : ", location.pathname);
        
        procPathname(location.pathname);
        // to remove /dash/
        //var matchPos = location.pathname.search(baseUrl);
        //if ( matchPos == -1 ) // no match
        //{
        //    navigateTo( "" , false );
        //}
        //else
        //{
        //    var target = location.pathname.substring(matchPos, location.pathname.length);
        //    console.info(location, location.pathname, location.pathname.replace( baseUrl , "" ), "[", target, "]");
        //    navigateTo( target.replace( baseUrl , "" ) , false );
        //}
    
        window.onpopstate = onPopState;
    }

    /**
     *
     */
    function onPopState( event )
    {
        procPathname(location.pathname);
        //var target = location.pathname.substring(location.pathname.search(baseUrl), location.pathname.length);
        ////navigateTo( location.pathname.replace( baseUrl , "" ) , false );
        //navigateTo( target.replace( baseUrl , "" ) , false );
    }

    function onPageChange( func )
    {
        pageChangeCallbacks.push( func );
    }

    /**
    
     */
    function finishNavigateTo( newPage , data )
    {
        currentPage = $( newPage );
        currentPageNav = $( newPage + "Nav" );

        console.info("newPage : ",  newPage);
        console.info("data : ",  data);
        console.info("currentPage : ",  currentPage);
        console.info("currentPageNav : ", currentPageNav);
        
        currentPage.fadeIn( 200 , function() {
            isNavigating = false;
            currentPageNav.show();
        } );

        // set onPageChange event to two pages: dashboardPage & dashboardListPage
        for( var i = 0; i < pageChangeCallbacks.length; i++ ) {
            pageChangeCallbacks[i].call( null , newPage , data );
        }
    }

    /**
     */
    function changePage( newPage , data )
    {
        if( isNavigating === true ) { return; }
        
        isNavigating = true;
    
        if( currentPageNav !== null )
        {
            currentPageNav.hide();
        }
    
        if( currentPage === null )
        {
            finishNavigateTo( newPage , data );
        }
        else
        {
            currentPage.fadeOut( 200 , function() {
                finishNavigateTo( newPage , data );
            } );
        }
    }

    /**
    
     */
    function navigateTo( path , pushState )
    {
        console.info("Path>>>",path);
        if( pushState || pushState === undefined ) { 
            history.pushState( null , "" , path ); 
        }
        console.info("navigateTo : [", path, "]");
        var pathData = path.split( "/" );

        console.info("path :", path);
        if( pathData[0] == "board" ) {
            changePage( "#dashboardPage" , pathData[1] );
        } else {
            changePage( "#dashboardListPage" );   
        }
  }

  return {
    init : init,
    onPageChange : onPageChange,
    navigateTo : navigateTo
  };

} )();
