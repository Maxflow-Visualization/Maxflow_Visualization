$(function () {
  function loop(count, callback, done) {
    var counter = 0;
    var next = function () {
      setTimeout(iteration, 1000);
    };
    var iteration = function () {
      if (counter < count) {
        callback(counter, next);
      } else {
        done && done();
      }
      counter++;
    };
    iteration();
  }

  console.log("Starting...");

  // initialize style of cy
  var cy = cytoscape({
    container: document.getElementById("cy"),
    style: [
      {
        selector: "node",
        css: {
          content: "data(id)",
          "text-valign": "center",
          "text-halign": "center",
          "background-color": "white",
          "line-color": "red",
          "target-arrow-color": "#61bffc",
          "transition-property":
            "background-color, line-color, target-arrow-color",
          "transition-duration": "0.5s",
          "padding-top": "5px",
          "padding-right": "5px",
          "padding-bottom": "5px",
          "padding-left": "5px",
          "border-width": 2,
          "border-color": "black",
        },
      },
      {
        selector: "edge",
        css: {
          "target-arrow-shape": "triangle",
          width: 4,
          "line-color": "lightgray",
          "target-arrow-color": "lightgray",
          label: "4",
          "text-valign": "right",
        },
      },
      {
        selector: ".edgehandles-hover",
        css: {
          "border-width": 3,
          "border-color": "black",
        },
      },
      {
        selector: ".edgehandles-source",
        css: {
          "border-width": 3,
          "border-color": "black",
        },
      },
      {
        selector: ".edgehandles-target",
        css: {
          "border-width": 3,
          "border-color": "black",
        },
      },
      {
        selector: ".edgehandles-preview",
        css: {
          "line-color": "darkgray",
          "target-arrow-color": "darkgray",
          "source-arrow-color": "darkgray",
        },
      },
      {
        selector: "node:selected",
        css: {
          "border-width": 3,
          "border-color": "#000000",
        },
      },
      {
        selector: "edge:selected",
        css: {
          "line-color": "darkgray",
          "target-arrow-color": "darkgray",
        },
      },
      {
        selector: ".highlighted",
        css: {
          "background-color": "#ad1a66",
          "line-color": "#ad1a66",
          "target-arrow-color": "#ad1a66",
          "transition-property":
            "background-color, line-color, target-arrow-color",
          "transition-duration": "0.5s",
        },
      },
    ],
    layout: {
      name: "preset",
      directed: true,
      roots: "#a",
      padding: 10,
    },
    userPanningEnabled: false,
    zoomingEnabled: false,
    userZoomingEnabled: false,
    selectionType: "single",
  });

  // edge handles, which is used for creating edge interactively
  cy.edgehandles({
    handleColor: "grey",
    handleSize: 15,
    handleLineWidth: 10,
    handleNodes: "node",
    toggleOffOnLeave: true,
  });

  // check which state we are in: modifying or practicing
  function allowModify() {
    return $("#state").text() === "State: Graph Creation";
  }

  function getId() {
    var ids = cy.nodes().map(function (node) {
      return node.id();
    });
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] != i + 1) {
        return i + 1;
      }
    }
    return ids.length + 1;
  }

  // double click for creating node
  var $cy = $("#cy");
  $cy.dblclick(function (e) {
    if (!allowModify()) {
      return;
    }
    var id = getId();
    var posX = e.pageX - $cy.offset().left;
    var posY = e.pageY - $cy.offset().top;
    addNode(cy, id, id, posX, posY);
    if (id > 1) $("#sink").val(id);
    if (id == 1) $("#source").val(id);
  });

  $("html").keyup(function (e) {
    if (!allowModify()) {
      return;
    }
    if (e.key == "Backspace" || e.key == "Delete") {
      cy.$(":selected").remove();
    }
  });

  $("#clear").on("click", function (event) {
    event.preventDefault();
    cy.nodes().remove();
    cy.edges().remove();

    $("#sink").val("");
    $("#source").val("");

    $("#status").text("");
    $(".log").remove();
    $("#label").val("");
  });

  $("#reset").on("click", function (event) {
    event.preventDefault();
    var edges = cy.edges();
    edges.forEach(function (edge) {
      var l = edge.css("label").split("/");
      if (l.length == 2) l = l[1];
      else l = l[0];
      edge.css("label", l);
    });
    $("#status").text("");
    $(".log").remove();
    $("#label").val("");
  });

  $("#change-mode").on("click", function (event) {
    event.preventDefault();
    if ($(this).text() === "Start Practice") {
      $(this).text("Modify Network Graph");
      $("#state").text("State: Select Path");
      $("#proceed-step").toggle();
      $("#proceed-step").text("Confirm Path");
    } else {
      $(this).text("Start Practice");
      $("#state").text("State: Graph Creation");
      $("#proceed-step").toggle();
    }
    $(".modification").toggle();
  });

  function addNode(cy, id, name, posX, posY) {
    if (!allowModify()) {
      return;
    }
    cy.add({
      group: "nodes",
      data: {
        id: id,
        name: name,
      },
      position: {
        x: posX,
        y: posY,
      },
      selectable: true,
    });
  }

  function addEdge(cy, id, label, source, target) {
    if (!allowModify()) {
      return;
    }
    cy.add({
      group: "edges",
      data: {
        id: id,
        source: source,
        target: target,
      },
      selectable: true,
      css: {
        label: label,
      },
    });
  }

  var selectedEdge = null;
  cy.on("tap", function (event) {
    var target = event.cyTarget;
    if (target.group != "edges") {
      selectedEdge = null;
      $("#label").val("");
    }
  });

  function highlightEdge(source, target) {
    cy.edges("[source='" + source + "'][target='" + target + "']").addClass(
      "highlighted"
    );
  }

  var path = new Set();
  cy.on("tap", "edge", function (event) {
    var edge = event.cyTarget;
    if (!edge) return;
    selectedEdge = edge;
    $("#label").val(edge.css("label"));
    if (!allowModify() && $("#state").text() === "State: Select Path") {
      // in steps
      if (!path.has(edge)) {
        path.add(edge);
      } else {
        path.delete(edge);
      }
    }
  });

  $("#proceed-step").on("click", function (event) {
    event.preventDefault();
    if ($("#state").text() === "State: Select Path") {
      for (var edge in path) {
      }
    }
  });

  $("#label-btn").on("click", function () {
    if (!allowModify()) {
      return;
    }
    var $label = $("#label");
    var label = $label.val();
    if (isNaN(parseInt(label)) || parseInt(label) < 0) {
      $label.css("border", "1px solid red");
      return;
    }
    $label.css("border", "1px solid #18a689");
    if (!selectedEdge) return;

    selectedEdge.css("label", label);
  });

  $("#fulkerson").on("click", function (e) {
    e.preventDefault();

    var $source = $("#source");
    var source = $source.val();
    var $sink = $("#sink");
    var sink = $sink.val();

    var flowNetwork = new FlowNetwork(source, sink);

    $("#reset").triggerHandler("click");

    if (!parseInt(source)) {
      $source.css("border", "1px solid red");
      return;
    } else {
      $source.css("border", "1px solid #18a689");
    }

    if (!parseInt(sink)) {
      $sink.css("border", "1px solid red");
      return;
    } else {
      $sink.css("border", "1px solid #18a689");
    }

    var edges = cy.edges();
    edges.forEach(function (edge) {
      var label = edge.css("label");
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    console.log(flowNetwork);

    if (!flowNetwork.isExistVertex(source)) {
      $source.css("border", "1px solid red");
      return;
    } else {
      $source.css("border", "1px solid #18a689");
    }

    if (!flowNetwork.isExistVertex(sink)) {
      $sink.css("border", "1px solid red");
      return;
    } else {
      $sink.css("border", "1px solid #18a689");
    }

    if (sink == source) {
      $source.css("border", "1px solid red");
      $sink.css("border", "1px solid red");
      return;
    } else {
      $source.css("border", "1px solid #18a689");
      $sink.css("border", "1px solid #18a689");
    }

    var paths = [];
    flowNetwork.findShortestAugmentingPath();
    var sum = 0;
    loop(
      paths.length,
      function (pathIndex, nextPath) {
        cancelHighlightedElements();
        var path = paths[pathIndex];
        var nodes = path.nodes;
        var flow = path.flow;
        sum += flow;
        var _source = nodes[0],
          _target = null;
        highlightNode(_source);
        loop(
          nodes.length - 1,
          function (nodeIndex, nextNode) {
            _source = nodes[nodeIndex];
            _target = nodes[nodeIndex + 1];
            highlightNode(_target);
            if (_source && _target) {
              highlightEdge(_source, _target);
              changeLabel(_source, _target, flow);
            }
            nextNode();
          },
          function () {
            nextPath();
            addLog(nodes, flow);
            updateStatus(source, sink, sum);
          }
        );
      },
      cancelHighlightedElements
    );

    function highlightEdge(source, target) {
      cy.edges("[source='" + source + "'][target='" + target + "']").addClass(
        "highlighted"
      );
    }

    function highlightNode(name) {
      var nodes = cy.nodes("[name=" + name + "]");
      if (nodes.length) {
        nodes[0].addClass("highlighted");
      }
    }

    function changeLabel(source, target, flow) {
      var edges = cy.edges(
        "[source='" + source + "'][target='" + target + "']"
      );
      if (edges.length) {
        var edge = edges[0];
        var label = edge.css("label");
        var parts = label.split("/");
        if (parts.length == 2) parts[0] = +parts[0] + flow;
        else {
          parts[0] = flow;
          parts[1] = label;
        }
        edge.css("label", parts.join("/"));
      }
    }

    function updateStatus(source, sink, sum) {
      $("#status").text(
        "Maximum flow from " + source + " to " + sink + " is " + sum
      );
    }

    function addLog(nodes, flow) {
      $("#log-container").append(
        '<p class="text-success log">' + nodes.join("->") + ": " + flow + "</p>"
      );
    }

    function cancelHighlightedElements() {
      cy.elements().removeClass("highlighted");
    }
  });

  var $add = $("#add-graph");
  $add.on("click", function (event) {
    $("#clear").triggerHandler("click");
    event.preventDefault();

    $("#source").val(1);
    $("#sink").val(8);

    var nodes = [
      { id: 1, name: 1, x: 150, y: 240 },
      { id: 2, name: 2, x: 300, y: 150 },
      { id: 3, name: 3, x: 300, y: 330 },
      { id: 4, name: 4, x: 450, y: 150 },
      { id: 5, name: 5, x: 450, y: 330 },
      { id: 6, name: 6, x: 600, y: 150 },
      { id: 7, name: 7, x: 600, y: 330 },
      { id: 8, name: 8, x: 750, y: 240 },
    ];

    var edges = [
      { id: "1-2", label: 6, source: 1, target: 2 },
      { id: "1-3", label: 6, source: 1, target: 3 },
      { id: "2-4", label: 4, source: 2, target: 4 },
      { id: "2-5", label: 2, source: 2, target: 5 },
      { id: "3-2", label: 5, source: 3, target: 2 },
      { id: "3-5", label: 9, source: 3, target: 5 },
      { id: "4-2", label: 7, source: 4, target: 7 },
      { id: "4-6", label: 4, source: 4, target: 6 },
      { id: "5-4", label: 8, source: 5, target: 4 },
      { id: "5-7", label: 7, source: 5, target: 7 },
      { id: "6-8", label: 7, source: 6, target: 8 },
      { id: "7-6", label: 11, source: 7, target: 6 },
      { id: "7-8", label: 4, source: 7, target: 8 },
    ];

    nodes.forEach(function (node) {
      addNode(cy, node.id, node.name, node.x, node.y);
    });

    edges.forEach(function (edge) {
      addEdge(cy, edge.id, edge.label, edge.source, edge.target);
    });
  });

  $add.trigger("click");

  document.getElementById('fileInput').addEventListener('change', readFile);

  function readFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n');
        const graph = {};
        var smallest = 10000000;
        var largest = 0;
        var positionX = 150;
        var positionY = 200;
        let mySet = new Set();
        var nextAdd = 1;

        lines.forEach(line => {
            const parts = line.trim().split(' '); // assuming space-separated values
            if (parts.length !== 3) return;

            const node1 = parts[0];
            const node2 = parts[1];
            const edgeValue = parts[2];
            
            var node1val = parseInt(node1, 10);
            var node2val = parseInt(node2, 10);

            // find smallest and largest node
            if (node1val < smallest) {
                smallest = node1val;
            }
            if (node2val < smallest) {
                smallest =  node2val;
            }
            if (node1val > largest) {
                largest =  node1val;
            }
            if (node2val > largest) {
                largest =  node2val;
            }

            if (!mySet.has(node1val)) {
                mySet.add(node1val);
                addNode(cy, node1val, node1val, positionX, positionY);
                positionX += 100 * (nextAdd % 2) ;
                positionY += 120 * ((nextAdd + 1) % 2);
                nextAdd ^= 1;
            }

            if (!mySet.has(node2val)) {
                mySet.add(node2val);
                addNode(cy, node2val, node2val, positionX, positionY);
                positionX += 100 * (nextAdd % 2) ;
                positionY += 120 * ((nextAdd + 1) % 2);
                nextAdd ^= 1;
            }

            addEdge(cy, node1 + "-" + node2, parseInt(edgeValue, 10), node1val, node2val);

            // Adding to graph
            if (!graph[node1]) {
                graph[node1] = {};
            }
            graph[node1][node2] = edgeValue;
        });

        console.log(graph); // Here's your directed graph
        console.log(smallest);
        console.log(largest);
        $("#source").val(smallest);
        $("#sink").val(largest);
    };

    reader.readAsText(file);
  }
});