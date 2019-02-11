//------------------------------------------------------------------------------
//
//
var dbTools = dbTools || {};


//---
//
//
dbTools.generateId = function( container , options )
{
    return (1+Math.random()*4294967295).toString(16);
};

//---
//
//
//dbTools.WorldTour.prototype.resize = function() 
//{
//    var now = new Date().getTime();
//    if ((now - this.timestamp) > 2000)
//        this.resize_draw();
//    else
//        this.timestamp = now;
//};
//
//---
//
//
//WT.WorldTour.prototype.resize_draw = function() 
//{
//    var world = this.world;
//    console.log("world:" + this.world);
//
//    if(this.world == undefined) return;
//
//    var title = "robin test";
//
//    this.land = topojson.feature(world, world.objects.land);
//    this.countries = topojson.feature(world, world.objects.countries).features;
//    this.borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });
//    var i = this.animationValue;
//    this.n = this.countries.length;
//    console.log("countries: "+ this.n);
//
//    var names = this.names;
//    
//    this.countries = this.countries.filter(function(d)
//    {
//        return names.some(function(n) {
//        if (d.id == n.id) return d.name = n.name;
//    });
//    }).sort(function(a, b) {
//        return a.name.localeCompare(b.name);
//    });
//    console.log("target i : " + (i+1));
//    console.log("target this.n : " + this.n);
//    i = i % this.n;
//    console.log("target i:" + i);
//    //var data = this.countries[i = (i + 1) % n].name;
//    var data = this.countries[i].name;
//    console.log("index="+i);
//    console.log("name="+data);
//    title = data;
//
//    
//    
//    console.log("--- contain ---");
//    console.log(this.container);
//    
//    var parent = this.container.parentNode;
//    console.log(">>>> " + parent.clientWidth);
//    console.log(">>>> " + parent.clientHeight);
//    
//    this.parentWidth = parent.clientWidth;
//    this.parentHeight = parent.clientHeight;
//    
//    if (this.parentWidth > this.parentHeight)
//    {
//        minValue = this.parentHeight;
//    }
//    else
//    {
//        minValue = this.parentWidth;
//    }
//    this.height = minValue;
//    this.width = minValue;    
//    
//    console.log("width: " + this.width + " height: " + this.height);
//    console.log("width: " + this.width + " height: " + this.height);
//    this.canvas.width = this.width; 
//    this.canvas.height = this.height; 
//    this.canvas.style.marginTop = Math.floor((this.parentHeight - this.height)/2) + "px";
//    this.canvas.style.marginLeft = Math.floor((this.parentWidth - this.width)/2) + "px";
//    
//    this.projection = d3.geo.orthographic()
//        .translate([this.width / 2, this.height / 2])
//        .scale(this.width / 2 - 20)
//        .clipAngle(90)
//        .precision(0.6);   
//    
//    this.path = d3.geo.path()
//        .projection(this.projection)
//        .context(this.ctx);    
//  
//    this.redraw();
//};
//
////---
////
////
//WT.WorldTour.prototype.redraw = function()
//{
//    if (this.countries == undefined || this.countries == null)
//    {
//        console.log("this.countries == undefined || this.countries == null");
//        return;
//    }
//    // check value
//    if ((this.height == 0) || (this.width == 0))
//    {
//        this.width = this.container.clientWidth;
//        this.height = this.container.clientHeight;
//        console.log("[<><><> redraw] h: " + this.height + " w: " + this.width);
//        this.resize();
//        return;
//    }
//    
// 
//    var i = this.animationValue;
//    var globe = {type: "Sphere"};
//    var countries = this.countries;
//    var projection = this.projection;
//    console.log( this.projection );
//    var ctx = this.ctx;
//    console.log( this.ctx );
//    var path = this.path;
//    var height = this.height;
//    var land = this.land;
//    var width = this.width;
//    var borders = this.borders;
//    console.log("[>>> redraw] h: " + height + " w: " + width);
//
//    d3.transition()
//        .duration(1250)
//        .tween("rotate", function() 
//        {
//            var p = d3.geo.centroid(countries[i]);
//            var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
//            //console.log(r);
//            return function(t) 
//            {
//                projection.rotate(r(t));
//                ctx.clearRect(0, 0, width, height);
//                ctx.fillStyle = "#ccc", ctx.beginPath(), path(land), ctx.fill();
//                ctx.fillStyle = "#f00", ctx.beginPath(), path(countries[i]), ctx.fill();
//                ctx.strokeStyle = "#fff", ctx.lineWidth = .5, ctx.beginPath(), path(borders), ctx.stroke();
//                ctx.strokeStyle = "#000", ctx.lineWidth = 2, ctx.beginPath(), path(globe), ctx.stroke();
//            };
//        });
//};
//
////---
////
////
//WT.WorldTour.prototype.updateValue = function( newValue )
//{
//    this.value = newValue;
//    this.animationValue = parseInt(this.value);
//    console.log("[updateValue] " + this.animationValue);
//    this.redraw();
//};
//
//