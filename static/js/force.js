var width = window.innerWidth,
    height = window.innerHeight;

// mouse event vars
var selected_node = null,
    selectState = 1,
    mousedown_node = null,
    mouseup_node = null;

//Triggers rescaling - Must be at top since called by SVG Container
var zoom = d3.behavior.zoom()
    .scaleExtent([0.2, 10])
    .on("zoom", rescale);

//Create Containers
var svg = d3.select("body").append("svg")
    .call(zoom)
    .attr("width", width)
    .attr("height", height)
    .on("dblclick.zoom", null)
    .on("mouseup", clickadd);

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "black");

var vis = svg.append("g")
    .attr("id", "innergroup");


// needed for safari for some reason
var rect = vis.append('svg:rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'black');

// Initialise Force Layout Variables
var force = d3.layout.force()
    .size([width, height])
    .nodes([{}])
    .charge(-1500)
    .linkDistance(120)
    .on("tick", tick);

// (these are declared here to set global scope)
var nodes = force.nodes(),
    links = force.links(),
    link = vis.selectAll(".link"),
    node = vis.selectAll(".node");

// add keyboard callback
d3.select(window)
    .on("keydown", keydown);

// Runs the thing!
$(document).ready(function () {
    GetData();
    resize();
    d3.select(window).on("resize", resize);

    $("#savebutton").click(function () {
        Save()
    });

    $("#updatebutton").click(function () {
        $("#selectnodes").addClass("fa-crosshairs");
        $("#selectnodes").removeClass("fa-check");
        selectState = 1;
        addDetails()
    });

    $("#selectnodes").click(function () {
        if (selectState == 2) {
            $("#selectnodes").addClass("fa-crosshairs");
            $("#selectnodes").removeClass("fa-check");
            selectState = 1;
        } else {
            $("#selectnodes").removeClass("fa-crosshairs");
            $("#selectnodes").addClass("fa-check");
            selectState = 2;
        }
    });

    $('#nodelist').on('change',changeSelectedNode)
});

// These functions create the force layout
function start() {
    d3.json("/datapoints", function (error, graph) {
        //d3.json("../static/js/graph.json", function(error, graph) {

        if (error) throw error;

        nodes = force.nodes(graph.nodes).nodes();
        links = force.links(graph.links).links();
        force.start();


        link = link.data(graph.links)
            .enter().append("line")
            .attr("class", "link");

        node = node.data(graph.nodes)
            .enter().append("g").attr("class", "node")
            .on("mousedown", nodeClickFn)
            .call(force.drag);

        node.append("circle")
            .attr("r", 8)
        //.call(force.drag);

        vis.selectAll(".node").append("text")
            .attr("dx", 10)
            .attr("dy", "0.35em")
            .text(function (d) {
                return d.title
            });
    });
}

function restart() {

    link = link.data(links);
    link.enter().insert("line", ".node")
        .attr("class", "link");
    link.exit().remove();


    node = node.data(nodes);
    nodeParent = node.enter().append("g").attr("class", "node")
        .on("mousedown", nodeClickFn).call(force.drag);

    nodeParent.insert("circle", ".cursor")
        .attr("r", 8);

    nodeParent.insert("text", ".cursor")
        .attr("dx", 10)
        .attr("dy", "0.35em")
        .text(function (d) {
            return d.title
        });


    node.exit().remove();

    node
        .classed("node_selected", function (d) {
            return d === selected_node;
        });

    //vis.selectAll(".node").selectAll("text")
    //    .data([1])
    //    .enter()
    //    .append("text")
    //        .attr("dx", 10)
    //        .attr("dy", "0.35em")
    //        .text(function (d) {
    //            return d.title
    //        });

    force.start();
}

function tick() {
    //force.alpha(.01);
    link.attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });

    node
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

}

// Interactions

function nodeClickFn(d) {
    mousedown_node = d;

    switch (selectState) {
        case 1: //nothing active
            populateDrawer(d);
            break;
        case 2: //changing linked nodes
            changeLink(d);
            break;

    }
}

function clickadd() {

    if (!mousedown_node) {
        var point = d3.mouse(innergroup),
            node = {x: point[0], y: point[1]},
            n = nodes.push(node);

        //var dataOutput = {x: node.x, y: node.y},
        //    targetList = [];
        // add links to any nearby nodes
        //nodes.forEach(function (target) {
        //    var x = target.x - node.x,
        //        y = target.y - node.y;
        //    if (Math.sqrt(x * x + y * y) < 30 && Math.sqrt(x * x + y * y) > 0.01) {
        //        linkID = links.push({source: node, target: target});
        //        sourceID = nodes.length - 1
        //        targetID = links[linkID - 1].target.index
        //        targetList.push(targetID)
        //        dataOutput = {x: node.x, y: node.y, source: sourceID, targets: targetList};
        //    }
        //});
        //update(dataOutput);

        restart();

        populateDrawer(nodes[n - 1])

            $("#selectnodes").removeClass("fa-crosshairs");
    $("#selectnodes").addClass("fa-check");
    selectState = 2;
    }



    mousedown_node = null;
}

function changeSelectedNode() {
    var nodeID = $('#nodelist').val(),
        d = nodes[nodeID];

    populateDrawer(d)
}

function addDetails() {
    var title = $('#titleinput').val(),
        description = $('#descriptioninput').val();

    var index = selected_node.index;

    nodes[index].title = title;
    nodes[index].description = description;

    vis.selectAll(".node").selectAll("text")
        .text(function (d) {
            return d.title
        });

    restart();
}

function changeLink(d) {

    var i = neighbours.indexOf(d.index);


    if (i == -1) {
        neighbours.push(d.index);
        links.push({source: selected_node.index, target: d.index})
        linkObnum.push(links.length - 1);

    } else {
        neighbours.splice(i, 1);
        links.splice(linkObnum[i], 1);

        linkObnum.forEach(function (e, j) {
            if (e > linkObnum[i]) {
                linkObnum[j] -= 1
            }
        });

        linkObnum.splice(i, 1);

    }

    $("#nodelist").empty();
    neighbours.forEach(function (f) {
        $("#nodelist").append($("<option></option>")
            .attr("value", nodes[f].index)
            .text(nodes[f].title));
    });

    restart()

}


function populateDrawer(d) {
    // disable zoom
    //svg.call(d3.behavior.zoom().on("zoom"), null);

    selected_node = d;

    var index = selected_node.index;

    findNeighbours(index)

    //document.getElementById("titleinput").innerHTML = selected_node.title;
    $('#titleinput').val(selected_node.title);
    $('#descriptioninput').val(selected_node.description);

    $("#nodelist").empty();
    neighbours.forEach(function (f) {
        $("#nodelist").append($("<option></option>")
            .attr("value", nodes[f].index)
            .text(nodes[f].title));


    });

    node
        .classed("node_neighbour", function (d) {
            console.log(d.index);
            console.log($.inArray(d.index, neighbours));
            if ($.inArray(d.index, neighbours) == -1){
                return false;
            } else {
                return true;
            }
        });


    node
        .classed("node_selected", function (d) {
            return d === selected_node;
        });

    //restart();
}

function spliceLinksForNode(node) {
    toSplice = links.filter(
        function (l) {
            return (l.source === node) || (l.target === node);
        });
    toSplice.map(
        function (l) {
            links.splice(links.indexOf(l), 1);
        });
}

function keydown() {
    if (!selected_node || $("#titleinput").is(':focus') || $("#descriptioninput").is(':focus')) return;
    switch (d3.event.keyCode) {
        case 8: // backspace
        case 46:
        { // delete
            nodes.splice(nodes.indexOf(selected_node), 1);
            spliceLinksForNode(selected_node);

            //neighbours.forEach(changeLink);

            //spliceLinksForNode(selected_node);
            restart();
            break;
        }
    }

}

// SQL AJAX Functions
function Save() {
    addDetails()

    NodesLinks = {nodes: nodes, links: links}
    $.ajax({
        url: '/SaveData',
        data: JSON.stringify(NodesLinks),
        type: 'POST',
        contentType: 'application/json;charset=UTF-8'
    });
}

function GetData() {
    $.ajax({
        url: '/datapoints',
        type: 'GET',
        success: function (res) {
            start()

        },
        error: function (error) {
            console.log(error);
        }
    });
}

function update(dataOutput) {
    $.ajax({
        url: '/updateData',
        data: JSON.stringify(dataOutput),
        type: 'POST',
        contentType: 'application/json;charset=UTF-8'
    });
}

function findNeighbours(NodeOfInterest) {
    neighbours = [];
    linkObnum = [];

    links.forEach(function (e, i) {
        if (e.source.index == NodeOfInterest) {
            neighbours.push(e.target.index);
            linkObnum.push(i);
        }
        else if (e.target.index == NodeOfInterest) {
            neighbours.push(e.source.index);
            linkObnum.push(i);
        }
    });
}


// Scale and Size Functions
function resize() {
    width = window.innerWidth, height = window.innerHeight;
    //vis.attr("width", width).attr("height", height);
    svg.attr("width", width).attr("height", height);
    //rect.attr("width", width).attr("height", height);
    force.size([width, height]).resume();
}

function rescale() {
    trans = d3.event.translate;
    scale = d3.event.scale;

    vis.attr("transform",
        "translate(" + trans + ")"
        + " scale(" + scale + ")");
}

