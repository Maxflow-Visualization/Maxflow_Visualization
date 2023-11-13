$(function () {
  // function loop(count, callback, done) {
  //   var counter = 0;
  //   var next = function () {
  //     setTimeout(iteration, 1000);
  //   };
  //   var iteration = function () {
  //     if (counter < count) {
  //       callback(counter, next);
  //     } else {
  //       done && done();
  //     }
  //     counter++;
  //   };
  //   iteration();
  // }

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
    userPanningEnabled: true,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    selectionType: "single",
    minZoom: 0.5, // sets the minimum zoom level
    maxZoom: 2,   // sets the maximum zoom level
    
  });

  cy.panzoom({
    // ... options ...
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
    } else if ($("#state").text().includes("State: Choose Flow")) {
      return "Choose Flow";
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
    if (!allowModify() || e.target.id == "show-hide-instructions") {
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
    if (!allowModify() && getState() !== "Update Residual Graph") {
      return;
    }
    if (e.key == "Delete") {
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

  var originalFlowNetwork = [];
  // change state between modifying and practicing
  $("#change-mode").on("click", function (event) {
    event.preventDefault();
    // proceed to algorithm practice
    if (allowModify()) {
      cy.edgehandles("disable");

      $(this).text("Modify Network Graph");
      $(this).css("background-color", "#ed5565");

      $("#state").text("State: Select Path");
      $("#proceed-step").text("Confirm Path");
      showElement("#proceed-step");
      showElement("#applied-capacity");

      $("#source-label").text("S=" + $("#source").val());
      hideElement("#source");
      $("#sink-label").text("T=" + $("#sink").val());
      hideElement("#sink");

      showElement(".find-path");

      hideElement(".change-capacity");
      hideElement("#add-graph");
      hideElement("#clear");

      var edges = cy.edges();

      edges.forEach(function (edge) {
        var label = edge.css("label");
        originalFlowNetwork.push(
          new Edge(edge.source().id(), edge.target().id(), label)
        );
      });

      var instruction =
        '<ul><b>Select Path: </b><li>In this step, you will choose yourself or let the algorithm choose an augmenting path.</li><li>To choose an augmenting path yourself, click all the edges on your desired path (order doesn\'t matter).</li><li>To let the algorithm choose an augmenting path, click one of the "Choose Shortest Path" (Edmonds-Karp), "Choose Random Path" (Ford-Fulkerson), "Choose Widest Path" (Capacity Scaling).</li><li>Once an augmenting path is chosen, click "Confirm Path". If the chosen path is valid, you will proceed to the next step. Otherwise the system will tell why the path is not valid.</li><li>Whenever you think you have found the max flow, click "Confirm I Already Found the Max Flow!" on the right to input your max flow.</li></ul>';

      $("#instructions").html(instruction);
    } else {
      cancelHighlightedElements();

      $(this).css("background-color", "#1ab394");
      $(this).text("Start Practice");

      $("#state").text("State: Graph Creation");
      hideElement("#proceed-step");
      hideElement("#applied-capacity");

      $("#source-label").text("S=");
      showElement("#source");
      $("#sink-label").text("T=");
      showElement("#sink");

      hideElement(".find-path");

      showElement(".change-capacity");
      showElement("#add-graph");
      showElement("#clear");

      var shown = false;

      var edges = cy.edges();

      // check if applied capacity is shown
      edges.forEach(function (edge) {
        if (edge.css("label").includes("/")) {
          shown = true;
        }
      });

      if (shown) {
        edges.forEach(function (edge) {
          if (edge.css("label").includes("/")) {
            edge.remove();
          }
        });
      }

      var instruction =
        '<ul><b>Graph Creation:</b><li>In this step, you will construct a graph to run maxflow on.</li><li>Double click on the white space will add a node.</li><li>Click an existing node and then press "Delete" will delete that node.</li><li>Hover on/click an existing node n1 will generate a dot on top. Click and drag from the dot to another node n2 will generate an edge from n1 to n2.</li><li>Click an existing edge and then press "Delete" will delete that edge.</li><li>Click an existing edge, the input box on the bottom left will show the capacity of that edge, input a number and then click "Update" will update that edge\'s capacity to the number.</li><li>Click "Clear" at the bottom will clear the entire graph. Click "Example" will bring up the example graph.</li><li>You can download the current graph for future convenient import by clicking "Download Edgelist". To import a graph (supports edgelist and csv format), click "Choose File".</li><li>Don\'t forget to set source and sink! Once you are ready, click "Start Practice".</li></ul>';

      $("#instructions").html(instruction);
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

  var selectedPath = [];
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
      if (selectedPath.length === 0) {
        selectedPath.push(new Edge(source, target, capacity));
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
  var totalflow = 0;
  var flow = 0;
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
        if (label.includes("/")) return;
        flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      });

      // get path expression to show in the front end and the bottleneck: -1 means invalid path
      const [bottleneck, bottleneckEdge, message] =
        flowNetwork.findBottleneckCapacity(selectedPath);
      // console.log(message);
      if (bottleneck === -1) {
        alert(message);
        return;
      }

      $("#state").text("State: Choose Flow");

      hideElement(".find-path");
      showElement("#bottleneck");

      $("#proceed-step").text("Choose Flow");

      var instruction =
        '<ul><b>Choose Flow: </b><li>In this step, you will choose a flow number to add to the path you have chosen in the last step.</li><li>Click "Choose Flow", a dialog box will appear.</li><li>Input a flow number in the dialog box and click "OK".</li><li>If the flow is valid (does not exceed the bottleneck capacity), you will proceed to the next step. Otherwise you will be prompted to input another flow number.</li><li>You can find the bottleneck edge by clicking "Find Bottleneck Edge".</li></ul>';

      $("#instructions").html(instruction);
    } else if (getState() === "Choose Flow") {
      var $source = $("#source");
      var source = $source.val();
      var $sink = $("#sink");
      var sink = $sink.val();

      var flowNetwork = new FlowNetwork(source, sink);

      var edges = cy.edges();
      edges.forEach(function (edge) {
        var label = edge.css("label");
        if (label.includes("/")) return;
        flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      });

      const [bottleneck, bottleneckEdge, message] =
        flowNetwork.findBottleneckCapacity(selectedPath);

      // tell user the range he can choose from
      var prompt = window.prompt(
        "Enter a flow you want to apply to the edge. "
      );

      console.log(prompt);
      // User pressed cancel
      if (prompt === null) {
        return;
      }
      // check if the user entered a proper flow: check int and should be within valid range
      flow = parseFloat(prompt);
      while (isNaN(flow) || flow < 0 || flow > bottleneck) {
        prompt = window.prompt(
          "Enter a valid flow you want to apply to the edge. "
        );
        if (prompt === null) {
          return;
        }
        flow = parseFloat(prompt);
      }

      $("#history").append(
        "Path: " + message + " \nChosen Flow: " + flow + "<br>"
      );
      console.log(flow);

      $("#state").text("State: Update Residual Graph");
      oldFlowNetwork = flowNetwork;
      showElement(".change-capacity");
      hideElement("#bottleneck");
      showElement("#auto-complete");
      showElement("#undo-updates");
      $("#proceed-step").text("Confirm Residual Graph");
      cy.edgehandles("enable");

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

      var instruction =
        '<ul><b>Update Residual Graph: </b><li>In this step, you will update the residual graph by editing edges according to the flow you decided.</li><li>Click an existing edge and then press "Delete" will delete that edge.</li><li>Click an existing edge, the input box on the bottom left will show the capacity of that edge, input a number and then click "Update" will update that edge\'s capacity to the number.</li><li>You can auto complete the update step by clicking "Auto Complete Residual Graph" button.</li><li>If you forget the original graph before applying change, you can undo all your steps by clicking "Undo All Updates to Residual Graph" button.</li><li>When you are done, click "Confirm Residual Graph".</li></ul>';

      $("#instructions").html(instruction);
    } else if (getState() === "Update Residual Graph") {
      var $source = $("#source");
      var source = $source.val();
      var $sink = $("#sink");
      var sink = $sink.val();

      var flowNetwork = new FlowNetwork(source, sink);

      var edges = cy.edges();
      edges.forEach(function (edge) {
        var label = edge.css("label");
        if (label.includes("/")) return;
        flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      });
      console.log(flowNetwork);
      // check if the current graph is the same network after applying the flow
      // if not, let user redo it.

      var expectedGraph = oldFlowNetwork.addFlow(selectedPath, flow, false);
      if (isSameGraphSkipFlowComparison(flowNetwork.graph, expectedGraph)) {
        cancelHighlightedElements();

        totalflow += flow;
        selectedPath = [];

        hideElement(".change-capacity");
        showElement(".find-path");
        hideElement("#auto-complete");
        hideElement("#undo-updates");

        $("#state").text("State: Select Path");
        $("#proceed-step").text("Confirm Path");

        cy.edgehandles("disable");

        var instruction =
          "<ul><b>Select Path: </b><li>In this step, you will choose yourself or let the algorithm choose an augmenting path</li><li>To choose an augmenting path yourself, click all the edges on your desired path (order doesn't matter) </li><li>To let the algorithm choose an augmenting path, click one of the “Choose Shortest Path” (Edmonds-Karp), “Choose Random Path” (Ford-Fulkerson), “Choose Widest Path” (Capacity Scaling) </li><li>Once an augmenting path is chosen, click “Confirm Path”. If the chosen path is valid, you will proceed to the next step. Otherwise the system will tell why the path is not valid</li><li>Whenever you think you have find the max flow, click the button on the right to confirm your max flow.</li></ul>";

        $("#instructions").html(instruction);
      } else {
        alert("Residual graph not yet completed, please keep trying.");
      }
    }
  });

  $("#applied-capacity").on("click", function (e) {
    e.preventDefault();

    var edges = cy.edges();

    var shown = false;

    // check if applied capacity is shown
    edges.forEach(function (edge) {
      if (edge.css("label").includes("/")) {
        shown = true;
      }
    });

    if (shown) {
      // remove applied capacity
      edges.forEach(function (edge) {
        if (edge.css("label").includes("/")) {
          edge.remove();
        }
      });
    } else {
      console.log("HERE");
      for (const edge of originalFlowNetwork) {
        var backward = cy
          .edges("[source='" + edge.target + "'][target='" + edge.source + "']")
          .css("label");
        if (backward === undefined || backward === null || backward === "")
          backward = "0";

        cy.add({
          group: "edges",
          data: {
            id: edge.source + "/" + edge.target,
            source: edge.source,
            target: edge.target,
          },
          selectable: true,
          css: {
            label: backward + "/" + edge.capacity,
          },
        });

        // addEdge(
        //   cy,
        //   edge.source + "/" + edge.target,
        //   backward + "/" + edge.capacity,
        //   edge.source,
        //   edge.target
        // );
      }
    }
  });

  $("#show-hide-instructions").on("click", function (e) {
    e.preventDefault();

    $("#instructions").toggle();
  });

  $("#find-min-cut").on("click", function (e) {
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
      if (label.includes("/")) return;
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    var path = flowNetwork.findRandomAugmentingPath();

    if (path.length > 0) {
      alert(
        "There is still a possible augmenting path from source to sink Please keep moving on. "
      );
      return;
    } else {
      var minCutFromSource = flowNetwork.findMinCut(source);
      console.log(flowNetwork.validateMinCut(new Set(["1", "2"]), totalflow));

      console.log(minCutFromSource);

      var nodes = cy.nodes();

      nodes.forEach(function (node) {
        if (minCutFromSource.has(node.id())) {
          node.css("border-color", "red");
        }
      });
    }
    // var minCutFromSink = flowNetwork.findMinCutBack(sink);
    // console.log(minCutFromSink);
  });

  $("#bottleneck").on("click", function (event) {
    event.preventDefault();

    var $source = $("#source");
    var source = $source.val();
    var $sink = $("#sink");
    var sink = $sink.val();

    var flowNetwork = new FlowNetwork(source, sink);

    const [bottleneck, bottleneckEdge, message] =
      flowNetwork.findBottleneckCapacity(selectedPath);

    var edge = cy.edges(
      "[source='" +
        bottleneckEdge.source +
        "'][target='" +
        bottleneckEdge.target +
        "']"
    );
    edge.css("line-color", "#1ab394");
    edge.css("target-arrow-color", "#1ab394");
  });

  $("#auto-complete").on("click", function (event) {
    event.preventDefault();
    // call check graph function, update the graph
    var expectedGraph = oldFlowNetwork.addFlow(selectedPath, flow, false);

    cy.edges().remove();
    for (const [_, neighborsMap] of expectedGraph) {
      for (const [_, edge] of neighborsMap) {
        if (edge.capacity !== 0) {
          addEdge(
            cy,
            edge.source + "-" + edge.target,
            edge.capacity,
            edge.source,
            edge.target
          );
        }
      }
    }
  });

  $("#undo-updates").on("click", function (event) {
    event.preventDefault();

    cy.edges().remove();
    for (const [_, neighborsMap] of oldFlowNetwork.graph) {
      for (const [_, edge] of neighborsMap) {
        if (edge.capacity !== 0) {
          addEdge(
            cy,
            edge.source + "-" + edge.target,
            edge.capacity,
            edge.source,
            edge.target
          );
        }
      }
    }
  });

  // change edge capacity after clicking update button
  $("#label-btn").on("click", function () {
    var $label = $("#label");
    var label = $label.val();
    if (isNaN(parseFloat(label)) || parseFloat(label) < 0) {
      $label.css("border", "1px solid red");
      return;
    }
    $label.css("border", "1px solid #18a689");
    if (!selectedEdge) return;

    selectedEdge.css("label", label);
  });

  $("#confirm-max-flow").on("click", function (e) {
    e.preventDefault();

    var $source = $("#source");
    var source = $source.val();
    var $sink = $("#sink");
    var sink = $sink.val();

    var flowNetwork = new FlowNetwork(source, sink);

    var edges = cy.edges();
    edges.forEach(function (edge) {
      var label = edge.css("label");
      if (label.includes("/")) return;
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    var path = flowNetwork.findRandomAugmentingPath();

    if (path.length > 0) {
      alert(
        "There is still a possible path from source to target. Please keep moving on. "
      );
      return;
    } else {
      var usermaxflow = window.prompt("Please enter the max flow: ");

      if (usermaxflow === null) {
        // cancel button
        return;
      }

      // check if the user entered a proper flow: check int and should be within valid range
      usermaxflow = parseFloat(usermaxflow);
      while (isNaN(usermaxflow) || usermaxflow < 0) {
        usermaxflow = window.prompt("Enter a valid number for max flow.");
        if (usermaxflow === null) {
          return;
        }
        usermaxflow = parseFloat(usermaxflow);
      }
      if (usermaxflow !== totalflow) {
        alert(
          "The max flow you have entered is not correct, but there is no more augumenting path. Try again from the start."
        );
        window.location.reload();
        // start practicing again, need original network (maybe)
      } else {
        alert(
          "Congratulation! You have sccessfully find the max flow for the given network graph!"
        );
        // window.location.reload();
      }
    }
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
      if (label.includes("/")) return;
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    var path = flowNetwork.findRandomAugmentingPath();

    if (path.length === 0) {
      alert("No more augmenting path.");
      return;
    }

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
      if (label.includes("/")) return;
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    // p1 = [new Edge("1", "3", 0), new Edge("1", "2", 0)];
    // p2 = [
    //   new Edge("1", "2", 0),
    //   new Edge("2", "3", 0),
    //   new Edge("3", "1", 0),
    //   new Edge("2", "4", 0),
    // ];
    // p3 = [
    //   new Edge("1", "2", 0),
    //   new Edge("2", "3", 0),
    //   new Edge("2", "4", 0),
    //   new Edge("3", "5", 0),
    //   new Edge("4", "5", 0),
    // ];
    // console.log(flowNetwork.validatePathTopology(p3));

    var path = flowNetwork.findShortestAugmentingPath();

    if (path.length === 0) {
      alert("No more augmenting path.");
      return;
    }

    selectedPath = flowNetwork.convertNodesToEdges(path);
    const [bottleneck, bottleneckEdge, message] =
      flowNetwork.findBottleneckCapacity(selectedPath);
    // console.log(message);
    expectedGraph = flowNetwork.addFlow(selectedPath, bottleneck, false);
    // expectedGraph.delete("1");
    // console.log(expectedGraph);
    // console.log(flowNetwork.graph);
    // console.log(_.isEqual(expectedGraph, flowNetwork.graph));
    selectedPath.forEach(function (edge) {
      highlightEdge(edge.source, edge.target);
    });
    console.log(selectedPath);

    return;
  });

  $("#widest-path").on("click", function (e) {
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
      if (label.includes("/")) return;
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    var path = flowNetwork.findWidestAugmentingPath();

    if (path.length === 0) {
      alert("No more augmenting path.");
      return;
    }

    selectedPath = flowNetwork.convertNodesToEdges(path);
    console.log(path);

    selectedPath.forEach(function (edge) {
      highlightEdge(edge.source, edge.target);
    });
    console.log(selectedPath);

    return;
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
    if (!event.target.files.length) {
      // User clicked "Cancel" in the file selection dialog
      return;
    }
    $("#clear").triggerHandler("click");
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;
      const lines = content.split("\n");
      var graph = new Map();
      var smallest = 10000000;
      var largest = 0;

      const hasPositionData = lines[0].includes("(") && lines[0].includes(")");

      if (hasPositionData) {
        const positions = lines[0].split(" ").map((data) => {
          // Extract and process node positions here if needed
          // Example: "1(100,200)" => { id: "1", x: 100, y: 200 }
          const parts = data.match(/(\d+)\((\d+),(\d+)\)/);
          if (parts) {
            addNode(
              cy,
              parts[1],
              parts[1],
              parseInt(parts[2], 10),
              parseInt(parts[3], 10)
            );
          }
        });

        // Use the positions data as required
        // console.log(positions);
        // Remove the first line so that the edgelist processing doesn't consider it
        lines.shift();
      }

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

      $("#source").val(smallest);
      $("#sink").val(largest);
      if (!hasPositionData) {
        drawNodes(graph, smallest, largest);
      }

      drawEdges(graph);

      if (!hasPositionData) {
        cy.layout({
          name: "breadthfirst",
          directed: true, // because max-flow problems are typically directed
          spacingFactor: 1.25,
          avoidOverlap: true,
          ScreenOrientation: "horizontal",
        });
        makeLayoutHorizontal(cy);
      }

      // // Apply the "spring model" layout
      // cy.layout({
      //   name: 'cose'
      // })

      // let layout = cy.layout({
      //   name: 'circle'
      // });
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
          parseFloat(edgeValue, 10),
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
        if (label.includes("/")) return;
        flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      });
      graph = flowNetwork.getGraph();
      let positions = "";

      // Iterate over all nodes in the Cytoscape instance and gather positions
      cy.nodes().forEach((node) => {
        const id = node.id();
        const pos = node.position();

        positions += `${id}(${parseInt(pos.x)},${parseInt(pos.y)}) `;
      });

      const edgelistContent = graphToEdgelist(graph);
      console.log(edgelistContent);
      download("edgelist.txt", positions + "\n" + edgelistContent);
    });

  document
    .getElementById("layoutChoices")
    .addEventListener("change", function (event) {
      const selectedValue = event.target.value;
      let boundingBox = cy.elements().boundingBox({});
      let centerX = (boundingBox.x1 + boundingBox.x2) / 2;
      let centerY = (boundingBox.y1 + boundingBox.y2) / 2;

      switch (selectedValue) {
        case "layered":
          // Execute code for layered layout
          console.log("Executed code for Choice 1");
          cy.layout({
            name: "breadthfirst",
            directed: true, // because max-flow problems are typically directed
            spacingFactor: 1.25,
            avoidOverlap: true,
            ScreenOrientation: "horizontal",
            // boundingBox: boundingBox,
          });
          makeLayoutHorizontal(cy);
          cy.center();
          break;
        case "spring":
          // Execute code for Spring Model layout
          console.log("Executed code for Choice 2");
          let scaleFactor = 1.2;
          let expandedBoundingBox = {
              x1: centerX + (boundingBox.x1 - centerX) * scaleFactor,
              y1: centerY + (boundingBox.y1 - centerY) * scaleFactor,
              x2: centerX + (boundingBox.x2 - centerX) * scaleFactor,
              y2: centerY + (boundingBox.y2 - centerY) * scaleFactor
          };
          let layout = cy.layout({
            name: "cose",
            boundingBox: expandedBoundingBox,
          });
          break;
        default:
          console.log("No choice");
      }

    });
});
