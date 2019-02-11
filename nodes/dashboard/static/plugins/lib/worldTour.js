//------------------------------------------------------------------------------
//
//
var WT = WT || {};


//---
//
//
WT.WorldTour = function( container , options ) {
    
    this.timestamp = new Date().getTime();
    this.animationValue = 0;
    
    this.container = container;
    this.canvas = document.createElement( "canvas" );
    container.appendChild( this.canvas );
    this.ctx = this.canvas.getContext( "2d" );
    var node = this;
    
    // var tsv = "id\tname\n-1\tNorthern Cyprus\n-2\tKosovo\n-3\tSomaliland\n4\tAfghanistan\n8\tAlbania\n10\tAntarctica\n12\tAlgeria\n16\tAmerican Samoa\n20\tAndorra\n24\tAngola\n28\tAntigua and Barbuda\n31\tAzerbaijan\n32\tArgentina\n36\tAustralia\n40\tAustria\n44\tBahamas\n48\tBahrain\n50\tBangladesh\n51\tArmenia\n52\tBarbados\n56\tBelgium\n60\tBermuda\n64\tBhutan\n68\tBolivia, Plurinational State of\n70\tBosnia and Herzegovina\n72\tBotswana\n74\tBouvet Island\n76\tBrazil\n84\tBelize\n86\tBritish Indian Ocean Territory\n90\tSolomon Islands\n92\tVirgin Islands, British\n96\tBrunei Darussalam\n100\tBulgaria\n104\tMyanmar\n108\tBurundi\n112\tBelarus\n116\tCambodia\n120\tCameroon\n124\tCanada\n132\tCape Verde\n136\tCayman Islands\n140\tCentral African Republic\n144\tSri Lanka\n148\tChad\n152\tChile\n156\tChina\n158\tTaiwan, Province of China\n162\tChristmas Island\n166\tCocos (Keeling) Islands\n170\tColombia\n174\tComoros\n175\tMayotte\n178\tCongo\n180\tCongo, the Democratic Republic of the\n184\tCook Islands\n188\tCosta Rica\n191\tCroatia\n192\tCuba\n196\tCyprus\n203\tCzech Republic\n204\tBenin\n208\tDenmark\n212\tDominica\n214\tDominican Republic\n218\tEcuador\n222\tEl Salvador\n226\tEquatorial Guinea\n231\tEthiopia\n232\tEritrea\n233\tEstonia\n234\tFaroe Islands\n238\tFalkland Islands (Malvinas)\n239\tSouth Georgia and the South Sandwich Islands\n242\tFiji\n246\tFinland\n248\tAland Islands\n250\tFrance\n254\tFrench Guiana\n258\tFrench Polynesia\n260\tFrench Southern Territories\n262\tDjibouti\n266\tGabon\n268\tGeorgia\n270\tGambia\n275\tPalestinian Territory, Occupied\n276\tGermany\n288\tGhana\n292\tGibraltar\n296\tKiribati\n300\tGreece\n304\tGreenland\n308\tGrenada\n312\tGuadeloupe\n316\tGuam\n320\tGuatemala\n324\tGuinea\n328\tGuyana\n332\tHaiti\n334\tHeard Island and McDonald Islands\n336\tHoly See (Vatican City State)\n340\tHonduras\n344\tHong Kong\n348\tHungary\n352\tIceland\n356\tIndia\n360\tIndonesia\n364\tIran, Islamic Republic of\n368\tIraq\n372\tIreland\n376\tIsrael\n380\tItaly\n384\tCote d'Ivoire\n388\tJamaica\n392\tJapan\n398\tKazakhstan\n400\tJordan\n404\tKenya\n408\tKorea, Democratic People's Republic of\n410\tKorea, Republic of\n414\tKuwait\n417\tKyrgyzstan\n418\tLao People's Democratic Republic\n422\tLebanon\n426\tLesotho\n428\tLatvia\n430\tLiberia\n434\tLibya\n438\tLiechtenstein\n440\tLithuania\n442\tLuxembourg\n446\tMacao\n450\tMadagascar\n454\tMalawi\n458\tMalaysia\n462\tMaldives\n466\tMali\n470\tMalta\n474\tMartinique\n478\tMauritania\n480\tMauritius\n484\tMexico\n492\tMonaco\n496\tMongolia\n498\tMoldova, Republic of\n499\tMontenegro\n500\tMontserrat\n504\tMorocco\n508\tMozambique\n512\tOman\n516\tNamibia\n520\tNauru\n524\tNepal\n528\tNetherlands\n531\tCuracao\n533\tAruba\n534\tSint Maarten (Dutch part)\n535\tBonaire, Sint Eustatius and Saba\n540\tNew Caledonia\n548\tVanuatu\n554\tNew Zealand\n558\tNicaragua\n562\tNiger\n566\tNigeria\n570\tNiue\n574\tNorfolk Island\n578\tNorway\n580\tNorthern Mariana Islands\n581\tUnited States Minor Outlying Islands\n583\tMicronesia, Federated States of\n584\tMarshall Islands\n585\tPalau\n586\tPakistan\n591\tPanama\n598\tPapua New Guinea\n600\tParaguay\n604\tPeru\n608\tPhilippines\n612\tPitcairn\n616\tPoland\n620\tPortugal\n624\tGuinea-Bissau\n626\tTimor-Leste\n630\tPuerto Rico\n634\tQatar\n638\tReunion\n642\tRomania\n643\tRussian Federation\n646\tRwanda\n652\tSaint Barthelemy\n654\tSaint Helena, Ascension and Tristan da Cunha\n659\tSaint Kitts and Nevis\n660\tAnguilla\n662\tSaint Lucia\n663\tSaint Martin (French part)\n666\tSaint Pierre and Miquelon\n670\tSaint Vincent and the Grenadines\n674\tSan Marino\n678\tSao Tome and Principe\n682\tSaudi Arabia\n686\tSenegal\n688\tSerbia\n690\tSeychelles\n694\tSierra Leone\n702\tSingapore\n703\tSlovakia\n704\tViet Nam\n705\tSlovenia\n706\tSomalia\n710\tSouth Africa\n716\tZimbabwe\n724\tSpain\n728\tSouth Sudan\n729\tSudan\n732\tWestern Sahara\n740\tSuriname\n744\tSvalbard and Jan Mayen\n748\tSwaziland\n752\tSweden\n756\tSwitzerland\n760\tSyrian Arab Republic\n762\tTajikistan\n764\tThailand\n768\tTogo\n772\tTokelau\n776\tTonga\n780\tTrinidad and Tobago\n784\tUnited Arab Emirates\n788\tTunisia\n792\tTurkey\n795\tTurkmenistan\n796\tTurks and Caicos Islands\n798\tTuvalu\n800\tUganda\n804\tUkraine\n807\tMacedonia, the former Yugoslav Republic of\n818\tEgypt\n826\tUnited Kingdom\n831\tGuernsey\n832\tJersey\n833\tIsle of Man\n834\tTanzania, United Republic of\n840\tUnited States\n850\tVirgin Islands, U.S.\n854\tBurkina Faso\n858\tUruguay\n860\tUzbekistan\n862\tVenezuela, Bolivarian Republic of\n876\tWallis and Futuna\n882\tSamoa\n887\tYemen\n894\tZambia";
    
    function tsvJSON(xtsv) {
        var lines = xtsv.split("\n");
        var result = [];
        var headers=lines[0].split("\t");
        for(var i=1;i<lines.length;i++) {
            var obj = {};
            var currentline=lines[i].split("\t");
     
            for(var j=0;j<headers.length;j++) {
                obj[headers[j]] = currentline[j];
            }
 
            result.push(obj);
        }
  
        return result; //JavaScript object
        //return JSON.stringify(result); //JSON
    }
    
    //this.names = tsvJSON(tsv);
    //console.log("*******************");
    //console.log(this.names);
    //console.log("*******************");
    
    //this.resize_draw();
    
    d3.json("plugins/data/world-110m.json", function(error, world) {
        console.log('plugins/data/world-110m.json', error);
        node.world = world;
        console.log(world);
        node.land = topojson.feature(world, world.objects.land);
        node.countries = topojson.feature(world, world.objects.countries).features;
        node.borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });
        var i = node.animationValue;
        node.n = node.countries.length;
        console.log("countries: "+ node.n);
        


        d3.tsv("plugins/data/world-country-names.tsv", function(error, names) {
            console.log('plugins/data/world-country-names.tsv', error);
            console.log(names);
            node.names = names;
            
            node.countries = node.countries.filter(function(d) {
                    return names.some(function(n) {
                    if (d.id == n.id) return d.name = n.name;
                });
            }).sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
            
            
            node.resize_draw();
        });
    });
};

//---
//
//
WT.WorldTour.prototype.resize = function() 
{
    var now = new Date().getTime();
    if ((now - this.timestamp) > 2000)
        this.resize_draw();
    else
        this.timestamp = now;
};


WT.WorldTour.prototype.mousewheel = function(wheel) {
   
    if (wheel > 0) {
        this.scaleDelta += 20;
    } else {
        this.scaleDelta -= 20;
    }
    
    this.projection.scale(this.scaleDelta);
    
    this.path = d3.geo.path()
        .projection(this.projection)
        .context(this.ctx);    
    
    this.redraw();
}

WT.WorldTour.prototype.mousemove = function(evt) 
{
    
    var λ = d3.scale.linear()
    .domain([0, this.width])
    .range([-180, 180]);

    var φ = d3.scale.linear()
    .domain([0, this.height])
    .range([90, -90]);
    
    
//    var p = d3.mouse(evt);
//    console.log(">>> p ", evt.clientX, evt.clientY);
    var p = [evt.clientX, evt.clientY];
    this.projection.rotate([λ(p[0]), φ(p[1])]);
    
    
    this.path = d3.geo.path()
        .projection(this.projection)
        .context(this.ctx);    
    
    this.redraw();
    
    ////svg.selectAll("path").attr("d", path);
    //this.ctx.clearRect(0, 0, this.width, this.height);
    //
    //var globe = {type: "Sphere"};
    //this.ctx.strokeStyle = "#fff", this.ctx.lineWidth = .5, this.ctx.beginPath(), this.path(this.borders), this.ctx.stroke();
    //this.ctx.strokeStyle = "#000", this.ctx.lineWidth = 2, this.ctx.beginPath(), this.path(globe), this.ctx.stroke();
    //
};


//---
//
//
WT.WorldTour.prototype.resize_draw = function() {
    
    if (!this.world || !this.names) return;
    
    var world = this.world;
    console.log("world:" + world);

    var title = "robin test";

    //this.land = topojson.feature(world, world.objects.land);
    //this.countries = topojson.feature(world, world.objects.countries).features;
    //this.borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });
    //var i = this.animationValue;
    //this.n = this.countries.length;
    //console.log("countries: "+ this.n);

    var names = this.names;
    
    //this.countries = this.countries.filter(function(d) {
    //        return names.some(function(n) {
    //        if (d.id == n.id) return d.name = n.name;
    //    });
    //}).sort(function(a, b) {
    //    return a.name.localeCompare(b.name);
    //});
    
    console.log("target i : " + (i+1));
    console.log("target this.n : " + this.n);
    i = i % this.n;
    console.log("target i:" + i);
    //var data = this.countries[i = (i + 1) % n].name;
    var data = this.countries[i].name;
    console.log("index="+i);
    console.log("name="+data);
    title = data;

    
    
    console.log("--- contain ---");
    console.log(this.container);
    
    var parent = this.container.parentNode;
    console.log(">>>> " + parent.clientWidth);
    console.log(">>>> " + parent.clientHeight);
    
    this.parentWidth = parent.clientWidth;
    this.parentHeight = parent.clientHeight;
    
    if (this.parentWidth > this.parentHeight) {
        minValue = this.parentHeight;
    } else {
        minValue = this.parentWidth;
    }
    this.height = minValue;
    this.width = minValue;    
    
    console.log("width: " + this.width + " height: " + this.height);
    console.log("width: " + this.width + " height: " + this.height);
    this.canvas.width = this.width; 
    this.canvas.height = this.height; 
    this.canvas.style.marginTop = Math.floor((this.parentHeight - this.height)/2) + "px";
    this.canvas.style.marginLeft = Math.floor((this.parentWidth - this.width)/2) + "px";
    
    this.scaleDelta = this.width / 2 - 20;
    
    this.projection = d3.geo.orthographic()
        .translate([this.width / 2, this.height / 2])
        .scale(this.scaleDelta)
        .clipAngle(90)
        .precision(1);   
    
    this.path = d3.geo.path()
        .projection(this.projection)
        .context(this.ctx);    
  
    this.redraw();
};

//---
//
//
WT.WorldTour.prototype.redraw = function()
{
    if (this.countries == undefined || this.countries == null)
    {
        console.log("this.countries == undefined || this.countries == null");
        return;
    }
    // check value
    if ((this.height == 0) || (this.width == 0))
    {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        console.log("[<><><> redraw] h: " + this.height + " w: " + this.width);
        this.resize();
        return;
    }
    
 
    var i = this.animationValue;
    var globe = {type: "Sphere"};
    var countries = this.countries;
    var projection = this.projection;
    console.log( this.projection );
    var ctx = this.ctx;
    console.log( this.ctx );
    var path = this.path;
    var height = this.height;
    var land = this.land;
    var width = this.width;
    var borders = this.borders;
    console.log("[>>> redraw] h: " + height + " w: " + width);

    //d3.transition()
    //    .duration(1250)
    //    .tween("rotate", function() 
    //    {
    //        var p = d3.geo.centroid(countries[i]);
    //        var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
    //        //console.log(r);
    //        return function(t) 
    //        {
    //            projection.rotate(r(t));
    //            ctx.clearRect(0, 0, width, height);
    //            ctx.fillStyle = "#ccc", ctx.beginPath(), path(land), ctx.fill();
    //            ctx.fillStyle = "#f00", ctx.beginPath(), path(countries[i]), ctx.fill();
    //            ctx.strokeStyle = "#fff", ctx.lineWidth = .5, ctx.beginPath(), path(borders), ctx.stroke();
    //            ctx.strokeStyle = "#000", ctx.lineWidth = 2, ctx.beginPath(), path(globe), ctx.stroke();
    //        };
    //    })
    //    ;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ccc", ctx.beginPath(), path(land), ctx.fill();
    ctx.fillStyle = "#f00", ctx.beginPath(), path(countries[i]), ctx.fill();
    ctx.strokeStyle = "#fff", ctx.lineWidth = .5, ctx.beginPath(), path(borders), ctx.stroke();
    ctx.strokeStyle = "#000", ctx.lineWidth = 2, ctx.beginPath(), path(globe), ctx.stroke();
    
};

//---
//
//
WT.WorldTour.prototype.updateValue = function( newValue )
{
    this.value = newValue;
    this.animationValue = parseInt(this.value);
    console.log("[updateValue] " + this.animationValue);
    this.redraw();
};

