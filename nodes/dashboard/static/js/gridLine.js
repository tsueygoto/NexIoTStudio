var App = App || {};

App.gridLine = (function() {
    var space_width = screen.width,
        space_height = screen.height - 84;
    //console.log("Your screen width : "+ screen.width);
	//console.log("Your screen height : "+ screen.height);
    var gridSize = 20;
    var outer = d3.select("#dashboardPage")
        .append("svg:svg")
        .attr("width", space_width)
        .attr("height", space_height)
        .attr("pointer-events", "all") //http://www.oxxostudio.tw/articles/201409/pointer-events.html
        //.style("cursor","crosshair")
		.attr("style","position:absolute")
        .on("mousedown", function() {
            focusView();
        });

    var vis = outer
        .append("svg:g")
        .on("dblclick.zoom", null) //Cancel double-click zoom
        .append("svg:g");
        //.attr('class','innerCanvas')

    var outer_background = vis.append("svg:rect")
        .attr("width", space_width)
        .attr("height", space_height)
        .attr("fill","#fff")
		.attr("fill-opacity","0");

    var grid = vis.append("g");
	var showGridState = localStorage.getItem("showGrid");
	if(showGridState === "true"){
		toggleShowGrid(true);
	}
	else{
		toggleShowGrid(false);
	}
    updateGrid();

    function updateGrid() {
        var gridTicks = [];
        for (var i=0;i<space_width;i+=+gridSize) {
            gridTicks.push(i);
        }
        grid.selectAll("line.horizontal").remove();
        grid.selectAll("line.horizontal").data(gridTicks).enter()
            .append("line")
            .attr(
                {
                    "class":"horizontal",
                    "x1" : 0,
                    "x2" : space_width,
                    "y1" : function(d){ return d;},
                    "y2" : function(d){ return d;},
                    "fill" : "none",
                    "shape-rendering" : "crispEdges", //https://developer.mozilla.org/zh-CN/docs/Web/SVG/Attribute/shape-rendering
                    "stroke" : "#eee",
                    "stroke-width" : "1px"
                });
        grid.selectAll("line.vertical").remove();
        grid.selectAll("line.vertical").data(gridTicks).enter()
            .append("line")
            .attr(
                {
                    "class":"vertical",
                    "y1" : 0,
                    "y2" : space_width,
                    "x1" : function(d){ return d;},
                    "x2" : function(d){ return d;},
                    "fill" : "none",
                    "shape-rendering" : "crispEdges",
                    "stroke" : "#eee",
                    "stroke-width" : "1px"
                });
    }

	function focusView() {
        try {
            // Workaround for browser unexpectedly scrolling iframe into full
            // view - record the parent scroll position and restore it after
            // setting the focus
            var scrollX = window.parent.window.scrollX; //window.pageXOffset
            var scrollY = window.parent.window.scrollY; //window.pageYOffset
            $("#dashboardPage").focus();
            window.parent.window.scrollTo(scrollX,scrollY);
        } catch(err) {
            // In case we're iframed into a page of a different origin, just focus
            // the view following the inevitable DOMException
            $("#dashboardPage").focus();
        }
    }
    /*function selectAll() {
        RED.nodes.eachNode(function(n) {
            if (n.z == RED.workspaces.active()) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({n:n});
                }
            }
        });
        if (activeSubflow) {
            activeSubflow.in.forEach(function(n) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({n:n});
                }
            });
            activeSubflow.out.forEach(function(n) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({n:n});
                }
            });
        }

        selected_link = null;
        updateSelection();
        redraw();
    }*/

    /*function clearSelection() {
        for (var i=0;i<moving_set.length;i++) {
            var n = moving_set[i];
            n.n.dirty = true;
            n.n.selected = false;
        }
        moving_set = [];
        selected_link = null;
    }*/

    /*function copySelection() {
        if (moving_set.length > 0) {
            var nns = [];
            for (var n=0;n<moving_set.length;n++) {
                var node = moving_set[n].n;
                // The only time a node.type == subflow can be selected is the
                // input/output "proxy" nodes. They cannot be copied.
                if (node.type != "subflow") {
                    for (var d in node._def.defaults) {
                        if (node._def.defaults.hasOwnProperty(d)) {
                            if (node._def.defaults[d].type) {
                                var configNode = RED.nodes.node(node[d]);
                                if (configNode && configNode._def.exclusive) {
                                    nns.push(RED.nodes.convertNode(configNode));
                                }
                            }
                        }
                    }
                    nns.push(RED.nodes.convertNode(node));
                    //TODO: if the node has an exclusive config node, it should also be copied, to ensure it remains exclusive...
                }
            }
            clipboard = JSON.stringify(nns);
            RED.notify(RED._("clipboard.nodeCopied",{count:nns.length}));
        }
    }*/

    function toggleShowGrid(state) {
		console.log("ChangeState: "+state);
        if (state) {
            grid.style("visibility","visible");
        } else {
            grid.style("visibility","hidden");
        }
    }
    /*function toggleSnapGrid(state) {
        snapGrid = state;
        redraw();
    }*/

    return {
        focus: focusView,
		toggleShowGrid: toggleShowGrid,
		gridSize: function(v) {
            if (v === undefined) {
                return gridSize;
            } else {
                gridSize = v;
                updateGrid();
            }
        }
    };
})();
