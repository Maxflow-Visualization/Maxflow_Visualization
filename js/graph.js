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
    return $("#state").text().includes("State: Graph Creation");
  }

  function getState() {
    if ($("#state").text().includes("State: Select Path")) {
      return "Select Path";
    } else if ($("#state").text().includes("State: Update Residual Graph")) {
      return "Update Residual Graph";
    }
  }

  function showElement(selector) {
    $(selector).css("display", "block");
  }

  function hideElement(selector) {
    $(selector).css("display", "none");
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

  // delete a node with backspace or delete button
  $("html").keyup(function (e) {
    if (!allowModify() && getState() !== "Update Graph") {
      return;
    }
    if (e.key == "Backspace" || e.key == "Delete") {
      const inputElement = document.getElementById("label");
      // Check if there's a selection within the input
      if (document.activeElement != inputElement) {
        cy.$(":selected").remove();
      }
    }
  });

  // clear cy drawboard
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

  // reset with sample graph
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

  // change state between modifying and practicing
  $("#change-mode").on("click", function (event) {
    event.preventDefault();
    // proceed to algorithm practice
    if (allowModify()) {

      cy.edgehandles('disable');

      $(this).text("Modify Network Graph");
      $(this).css("background-color", "#ed5565");

      $("#state").text("State: Select Path");
      $("#proceed-step").text("Confirm Path");
      showElement("#proceed-step");

      $("#source-label").text("S=" + $("#source").val());
      hideElement("#source");
      $("#sink-label").text("T=" + $("#sink").val());
      hideElement("#sink");

      showElement("#random-path");
      showElement("#shortest-path");

      hideElement(".change-capacity");
      hideElement("#add-graph");
      hideElement("#clear");
    } else {
      cancelHighlightedElements();

      $(this).css("background-color", "#1ab394");
      $(this).text("Start Practice");

      $("#state").text("State: Graph Creation");
      hideElement("#proceed-step");

      $("#source-label").text("S=");
      showElement("#source");
      $("#sink-label").text("T=");
      showElement("#sink");

      hideElement("#random-path");
      hideElement("#shortest-path");
      
      showElement(".change-capacity");
      showElement("#add-graph");
      showElement("#clear");
    }
  });

  // add node with given args
  function addNode(cy, id, name, posX, posY) {
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

  // add edge with given args
  function addEdge(cy, id, label, source, target) {
    var edge = cy.edges("[source='" + source + "'][target='" + target + "']");
    //if there's already an edge, remove it
    if (edge.css("label")) {
      edge.remove();
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

  // allow edge label to show and disappear
  var selectedEdge = null;
  cy.on("tap", function (event) {
    var target = event.cyTarget;
    if (target.group != "edges") {
      selectedEdge = null;
      $("#label").val("");
    }
  });

  // make edge highlighted with given args
  function highlightEdge(source, target) {
    cy.edges("[source='" + source + "'][target='" + target + "']").addClass(
      "highlighted"
    );
  }

  // cancel all highlights
  function cancelHighlightedElements() {
    cy.elements().removeClass("highlighted");
  }

  // cancel one edge's highlight
  function cancelHighlightedEdge(source, target) {
    edge = cy.edges("[source='" + source + "'][target='" + target + "']");
    edge.removeClass("highlighted");
    edge.css("line-color", "lightgray");
    edge.css("target-arrow-color", "lightgray");
  }

  var selectedPath = null;
  // tap edge to change capacity in modifying mode or select path in practicing mode
  cy.on("tap", "edge", function (event) {
    var edge = event.cyTarget;
    if (!edge) return;
    selectedEdge = edge;
    $("#label").val(edge.css("label"));
    var source = edge.source().id();
    var target = edge.target().id();
    var capacity = edge.css("label");
    if (!allowModify() && getState() === "Select Path") {
      if (selectedPath === null || selectedPath.length === 0) {
        selectedPath = [new Edge(source, target, capacity)];
        highlightEdge(source, target);
        return;
      }
      var index = selectedPath.findIndex(
        (edge) => edge.source === source && edge.target === target
      );
      if (index !== -1) {
        console.log("highlighted");
        cancelHighlightedEdge(source, target);
        selectedPath.splice(index, 1);
      } else {
        console.log("unhighlighted");
        highlightEdge(source, target);
        selectedPath.push(new Edge(source, target, capacity));
      }
    }
    console.log(selectedPath);
  });


  var oldFlowNetwork = null;
  // proceed in steps in pracitcing mode
  $("#proceed-step").on("click", function (event) {
    event.preventDefault();
    if (getState() === "Select Path") {
      // check if path is valid, get max flow, -1 if not valid path
      var $source = $("#source");
      var source = $source.val();
      var $sink = $("#sink");
      var sink = $sink.val();

      var flowNetwork = new FlowNetwork(source, sink);

      var edges = cy.edges();
      edges.forEach(function (edge) {
        var label = edge.css("label");
        flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      });

      // get path expression to show in the front end and the bottleneck: -1 means invalid path
      var bottleneck = flowNetwork.findBottleneckCapacity(selectedPath);
      console.log(bottleneck);
      if (bottleneck === -1) {
        alert("Not valid path, select again.");
        return;
      }

      bottleneck = 5;//parseInt(bottleneck);

      // tell user the range he can choose from
      var prompt = window.prompt("Enter a flow you want to apply to the edge. " + "Hint: 1 to " + bottleneck);

      console.log(prompt);
      // User pressed cancel
      if (prompt === null) {
        return;
      }
      // check if the user entered a proper flow: check int and should be within valid range
      var flow = parseInt(prompt);
      while (isNaN(flow) || flow < 1 || flow > bottleneck)  {
        prompt = window.prompt("Enter a valid flow you want to apply to the edge. " + "Hint: 1 to " + bottleneck);
        if (prompt === null) {
          return;
        }
        flow = parseInt(prompt);
      }

      $("#history").text(selectedPath);
      console.log(flow);

      $("#state").text("State: Update Residual Graph");
      oldFlowNetwork = flowNetwork;
      showElement(".change-capacity");
      hideElement("#random-path");
      hideElement("#shortest-path");
      showElement("#auto-complete");
      $("#proceed-step").text("Confirm Residual Graph");
      cy.edgehandles('enable');

      var cyStyles = [
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
            label: flow.toString(),
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
      ];

      cy.style().fromJson(cyStyles);

    } else if (getState() === "Update Residual Graph") {
      
      var $source = $("#source");
      var source = $source.val();
      var $sink = $("#sink");
      var sink = $sink.val();

      var flowNetwork = new FlowNetwork(source, sink);

      var edges = cy.edges();
      edges.forEach(function (edge) {
        var label = edge.css("label");
        flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      });
      // check if the current graph is the same network after applying the flow
      // if not, let user redo it. 
      
      // var valid = oldFlowNetwork. function
      var valid = true;
      if (valid) {
        cancelHighlightedElements();

        hideElement(".change-capacity");
        showElement("#random-path");
        showElement("#shortest-path");
        hideElement("#auto-complete");

        $("#state").text("State: Select Path");
        $("#proceed-step").text("Confirm Path");

        cy.edgehandles('disable');
      }
    }
  });

  $("#auto-complete").on("click", function() {
    event.preventDefault();
    // call check graph function, update the graph
  });

  // change edge capacity after clicking update button
  $("#label-btn").on("click", function () {
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

  // find random path
  $("#random-path").on("click", function (e) {
    e.preventDefault();

    cancelHighlightedElements();

    var $source = $("#source");
    var source = $source.val();
    var $sink = $("#sink");
    var sink = $sink.val();

    var flowNetwork = new FlowNetwork(source, sink);

    var edges = cy.edges();
    edges.forEach(function (edge) {
      var label = edge.css("label");
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    var path = flowNetwork.findRandomAugmentingPath();
    selectedPath = flowNetwork.convertNodesToEdges(path);
    console.log(path);

    selectedPath.forEach(function (edge) {
      highlightEdge(edge.source, edge.target);
    });
    console.log(selectedPath);

    return;
  });

  // find shortest path
  $("#shortest-path").on("click", function (e) {
    e.preventDefault();

    cancelHighlightedElements();

    var $source = $("#source");
    var source = $source.val();
    var $sink = $("#sink");
    var sink = $sink.val();

    var flowNetwork = new FlowNetwork(source, sink);

    var edges = cy.edges();
    edges.forEach(function (edge) {
      var label = edge.css("label");
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    p1 = [new Edge("1", "3", 0), new Edge("1", "2", 0)];
    p2 = [
      new Edge("1", "2", 0),
      new Edge("2", "3", 0),
      new Edge("3", "1", 0),
      new Edge("2", "4", 0),
    ];
    p3 = [
      new Edge("1", "2", 0),
      new Edge("2", "3", 0),
      new Edge("2", "4", 0),
      new Edge("3", "5", 0),
      new Edge("4", "5", 0),
    ];
    console.log(flowNetwork.validatePathTopology(p3));

    var path = flowNetwork.findShortestAugmentingPath();
    selectedPath = flowNetwork.convertNodesToEdges(path);
    const [bottleneck, message] = flowNetwork.findBottleneckCapacity(selectedPath);
    console.log(message);
    expectedGraph = flowNetwork.addFlow(selectedPath, bottleneck, false);
    // expectedGraph.delete("1");
    console.log(expectedGraph)
    console.log(flowNetwork.graph)
    console.log(_.isEqual(expectedGraph, flowNetwork.graph));
    selectedPath.forEach(function(edge) {
      highlightEdge(edge.source, edge.target);
    });
    console.log(selectedPath);

    return;
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

    // var paths = [];
    var path = flowNetwork.findWidestAugmentingPath();
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

    // function highlightEdge(source, target) {
    //   cy.edges("[source='" + source + "'][target='" + target + "']").addClass(
    //     "highlighted"
    //   );
    // }

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

    // function cancelHighlightedElements() {
    //   cy.elements().removeClass("highlighted");
    // }
  });

  // creating example graph
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

  // read file and load it to cy drawboard
  document.getElementById("fileInput").addEventListener("change", readFile);
  function readFile(event) {
    $("#clear").triggerHandler("click");
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;
      const lines = content.split("\n");
      var graph = new Map();
      var smallest = 10000000;
      var largest = 0;

      lines.forEach((line) => {
        var parts = "";
        if (file.name.endsWith(".csv")) {
          parts = line.trim().split(","); // Splitting on commas for CSV
        } else {
          parts = line.trim().split(" "); // assuming space-separated values
        }
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
          smallest = node2val;
        }
        if (node1val > largest) {
          largest = node1val;
        }
        if (node2val > largest) {
          largest = node2val;
        }

        // Adding to graph
        if (!graph.has(node1)) {
          graph.set(node1, new Map());
        }

        graph.get(node1).set(node2, edgeValue);
      });

      console.log(graph); // Here's your directed graph
      console.log(smallest);
      console.log(largest);
      $("#source").val(smallest);
      $("#sink").val(largest);
      drawNodes(graph, smallest, largest);
      drawEdges(graph);

      cy.layout({
        name: "breadthfirst",
        directed: true, // because max-flow problems are typically directed
        spacingFactor: 1.25,
        avoidOverlap: true,
        ScreenOrientation: "horizontal",
      });
      makeLayoutHorizontal(cy);

      // // Apply the "spring model" layout
      // cy.layout({
      //   name: 'cose'
      // }).run();
    };

    reader.readAsText(file);
  }

  function makeLayoutHorizontal(cy) {
    //get the width and height
    let width = cy.width();
    let height = cy.height();

    //rotate correspondingly
    cy.nodes().forEach((node) => {
      let currentPosition = node.position();
      node.position({
        x: (currentPosition.y / height) * 800,
        y: (currentPosition.x / width) * 500,
      });
    });
  }

  //draw edges according to the input graph. There might be memory issue about the remove()
  function drawEdges(graph) {
    cy.edges().remove();
    graph.forEach((edges, node1) => {
      edges.forEach((edgeValue, node2) => {
        addEdge(
          cy,
          node1 + "-" + node2,
          parseInt(edgeValue, 10),
          parseInt(node1, 10),
          parseInt(node2, 10)
        );
      });
    });
  }

  //draw nodes according to the input graph. Node position needs further considerations.
  function drawNodes(graph, source, tank) {
    cy.nodes().remove();
    var yPosition = 80;
    let mySet = new Set();
    var xPositionOffset = -30;
    console.log(source);
    console.log(tank);
    graph.forEach((edges, node) => {
      edges.forEach((edgeValue, node2) => {
        var node2val = parseInt(node2, 10);
        if (!mySet.has(node2val)) {
          mySet.add(node2val);
          if (node2val === tank) {
            addNode(cy, node2val, node2val, 600, 300);
          } else {
            addNode(cy, node2val, node2val, 350 + xPositionOffset, yPosition);
            yPosition += 80;
            xPositionOffset = -xPositionOffset;
          }
        }
      });
      var nodeVal = parseInt(node, 10);
      if (!mySet.has(nodeVal)) {
        mySet.add(nodeVal);
        if (nodeVal === source) {
          addNode(cy, nodeVal, nodeVal, 100, 300);
        } else {
          addNode(cy, nodeVal, nodeVal, 350 + xPositionOffset, yPosition);
          yPosition += 80;
          xPositionOffset = -xPositionOffset;
        }
      }
    });
  }

  document
    .getElementById("downloadButton")
    .addEventListener("click", function () {
      // Assuming the graph is globally accessible or you can pass it as an argument
      event.preventDefault();
      var $source = $("#source");
      var source = $source.val();
      var $sink = $("#sink");
      var sink = $sink.val();
      var flowNetwork = new FlowNetwork(source, sink);
      var edges = cy.edges();
      edges.forEach(function (edge) {
        var label = edge.css("label");
        flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      });
      graph = flowNetwork.getGraph();
      console.log(graph);
      const edgelistContent = graphToEdgelist(graph);
      console.log(edgelistContent);
      download("edgelist.txt", edgelistContent);
    });
});
