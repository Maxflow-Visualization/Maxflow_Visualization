// Initialize cytoscape, cytoscapeSettings is in "cytoscape-settings.js"
var cy = cytoscape(cytoscapeSettings);

var source;
var sink;

// These 2 functions are global because file-layout-utils.js depends on them

// For some reason this function needs to be called in multiple places that don't need to call it
function highlightSourceAndSink() {
  cy.style()
    .selector("#" + source)
    .style({
      "background-color": "#87CEEB",
    })
    .update();
  cy.style()
    .selector("#" + sink)
    .style({
      "background-color": "#FFCCCB",
    })
    .update();
}

// Cancel all highlighed nodes except the ones with ids in exceptNodeIdsList
function cancelHighlightedNodes(exceptNodeIdsList = []) {
  let filteredNodes = cy.collection();
  cy.nodes().forEach( function (node) {
    if (!exceptNodeIdsList.includes(node["_private"]["data"]["id"])) {
      filteredNodes = filteredNodes.union(node);
    }
  });
  filteredNodes.style("border-color", "black");
  filteredNodes.style("background-color", "white");
}

// Add node with given args
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

// Add edge with given args
function addEdge(cy, id, style, source, target) {
  cy.add({
    group: "edges",
    data: {
      id: id,
      source: source,
      target: target,
    },
    selectable: true,
    style: style,
  });
}

$(function () {
  const GRAPH_CREATION = "graph-creation";
  const SELECT_PATH = "select-path";
  const CHOOSE_FLOW = "choose-flow";
  const UPDATE_RESIDUAL_GRAPH = "update-residual-graph";

  const GRAPH_CREATION_INSTRUCTIONS =
    "<li>In this step, you will construct a graph to run maxflow on.</li><li>Double click on the white space to add a node.</li><li>Click an existing node and then press the keyboard's <code>Delete</code> to delete that node.</li><li>Right click a node to set it as the source/sink.</li><li>Hover on/click an existing node n1 to generate a dot on top. Click and drag the dot to another node n2 to generate an edge from n1 to n2.</li><li>Click an existing edge and then press the keyboard's <code>Delete</code> to delete that edge.</li><li>Right click an edge to change its capacity.</li><li>Click <code>Clear</code> at the bottom to clear the entire graph. Click <code>Example</code> to bring up the example graph.</li><li>You can download the current graph for future convenient importing by clicking <code>Download Edgelist</code>. To import a graph (supports edgelist and csv format), click <code>Choose File</code>.</li><li>Don't forget to set the source and sink! Once you are ready, click <code>Start Practice</code>!</li>";
  const SELECT_PATH_INSTRUCTIONS =
    "<li>In this step, you will choose yourself or let the algorithm choose an augmenting path.</li><li>To choose an augmenting path yourself, click all the edges on your desired path (order doesn't matter).</li><li>To let the algorithm choose an augmenting path, click one of the <code>Choose Shortest Path</code> (Edmonds-Karp), <code>Choose Random Path</code> (Ford-Fulkerson), <code>Choose Widest Path</code> (Capacity Scaling).</li><li>Once an augmenting path is chosen, click <code>Confirm Path</code>. If the chosen path is valid, you will proceed to the next step. Otherwise the system will tell why the path is not valid.</li><li>Once you think you have found the max flow, click <code>Confirm Max Flow Found!</code> on the right to verify your max flow.</li><li>Once you think you have found the max flow, you can click on nodes to form a min-cut, click <code>Validate Selected Min Cut</code> to verify. Note that you can provide either a S-cut or T-cut, our tool will interpret your selected cut as both S-cut and T-cut and if anyone is valid, your selected cut is a valid min cut.</li><li>Alternatively, you can click <code>Find Min Cut</code> to automatically find a min S-cut.</li>";
  const CHOOSE_FLOW_INSTRUCTIONS =
    "<li>In this step, you will choose a flow amount to add to the path you have chosen in the last step.</li><li>Click <code>Choose Flow</code>; a dialog box will appear.</li><li>Input a flow amount in the dialog box and click <code>OK</code>.</li><li>If the flow is valid (does not exceed the bottleneck capacity), you will proceed to the next step. Otherwise you will be prompted to input another flow amount.</li><li>You can find the bottleneck edge by clicking <code>Find Bottleneck Edge</code>.</li>";
  const UPDATE_RESIDUAL_GRAPH_INSTRUCTIONS =
    "<li>In this step, you will update the residual graph by editing edges according to the flow you decided.</li><li>Click an existing edge and then press <code>Delete</code> to delete that edge.</li><li>Right click an edge to change its capacity.</li><li>You can automatically complete the residual graph by clicking <code>Auto Complete</code>.</li><li>If you forget the original graph before applying change, you can undo all your steps by clicking <code>Undo All Updates</code>.</li><li>When you are done, click <code>Confirm Residual Graph</code>.</li>";

  const ENTER_KEY = 13;

  // Note: states don't include graph creation since that state is only run once
  var states = [SELECT_PATH, CHOOSE_FLOW, UPDATE_RESIDUAL_GRAPH];
  var index = 0;

  var originalFlowNetwork = [];
  var showOriginalCapacitiesAndCurrentFlow = false;

  cy.panzoom({
    // ... options ...
  });

  // Users should not be able to create an edge from x to y if an edge from x to y already exists
  function hasEdge(source, target) {
    var edges = cy.edges();
    var hasEdge = false;
    edges.forEach(function (edge) {
      if (edge.source().id() === source.id() && edge.target().id() === target.id()) {
        hasEdge = true;
        return;
      }
    });
    return hasEdge;
  }

  var defaults = {
    handleColor: "grey",
    handleSize: 15,
    handleLineWidth: 10,
    handleNodes: "node",
    toggleOffOnLeave: true,
    edgeType: function (source, target) {
      return hasEdge(source, target) ? null : 'flat';
    },
  }

  // edge handles, which is used for creating edge interactively
  cy.edgehandles(defaults);

  // Check which mode are we in: modifying or practicing
  function allowModify() {
    return $("#state").text().includes("State: Graph Creation");
  }

  function showElementAndItsChildren(selector) {
    $(selector).show();
    $(selector).children().show();
  }

  function hideElementAndItsChildren(selector) {
    $(selector).hide();
    $(selector).children().hide();
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

  // Make edge highlighted with given args
  function highlightEdge(source, target) {
    cy.edges("[source='" + source + "'][target='" + target + "']").addClass(
      "highlighted"
    );
  }

  // Cancel all highlights
function cancelHighlightedElements() {
  cy.elements().removeClass("highlighted");
}


  // Cancel one edge's highlight
  function cancelHighlightedEdge(source, target) {
    edge = cy.edges("[source='" + source + "'][target='" + target + "']");
    edge.removeClass("highlighted");
    edge.css("line-color", "lightgray");
    edge.css("target-arrow-color", "lightgray");
  }

  // Construct backend FlowNetwork data structure based on current graph
  function constructFlowNetwork() {
    var flowNetwork = new FlowNetwork(source, sink);
    highlightSourceAndSink();
    var edges = cy.edges();
    edges.forEach(function (edge) {
      var label = edge.css("label");
      if (label.includes("/")) return null;
      flowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
    });

    var nodes = cy.nodes();
    nodes.forEach(function (node) {
      flowNetwork.addNode(node.id());
    })

    return flowNetwork;
  }

  function doShowOriginalCapacitiesAndCurrentFlow() {
    for (const edge of originalFlowNetwork) {
      var backward = cy
        .edges("[source='" + edge.target + "'][target='" + edge.source + "']")
        .css("label");
      if (backward === undefined || backward === null || backward === "")
        backward = "0";

      addEdge(
        cy,
        edge.source + "/" + edge.target,
        {
          "line-color": "LightSkyBlue",
          "target-arrow-color": "LightSkyBlue",
          label: backward + "/" + edge.capacity,
        },
        edge.source,
        edge.target
      );
    }
    highlightSourceAndSink();
  }

  function removeOriginalCapacitiesAndCurrentFlow() {
    var edges = cy.edges();
    edges.forEach(function (edge) {
      if (edge.css("label").includes("/")) {
        edge.remove();
      }
    });
    highlightSourceAndSink();
  }

  function updateUIForNextState() {
    // First hide all buttons
    hideElementAndItsChildren(".buttons");
    // Show next state's buttons
    showElementAndItsChildren("#" + state);
    // ending-actions (min cut, etc.) buttons are only shown in the select path state
    if (state === CHOOSE_FLOW) {
      hideElementAndItsChildren(".ending-actions");
    } else if (state === SELECT_PATH) {
      showElementAndItsChildren(".ending-actions");
      // In UPDATE_RESIDUAL_GRAPH, bring back the right click edge change capacity
    } else {
      showElementAndItsChildren(".change-capacity");
    }
  }

  // When state changes and previous state has no errors, disable all buttons and only show buttons of the next state
  function onStateChange(prevStateOk) {
    if (prevStateOk) {
      index = (index + 1) % states.length;
      state = states[index];
      updateUIForNextState();
    }
  }

  // All of the following are implementations of logic in a specific state, returns ok to proceed or not

  // SELECT PATH IMPLEMENTATION
  function selectPath() {
    // check if path is valid, get max flow, -1 if not valid path
    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return false;
    }

    // get path expression to show in the front end and the bottleneck: -1 means invalid path
    const [bottleneck, bottleneckEdge, message] =
      flowNetwork.findBottleneckCapacity(selectedPath);
    if (bottleneck === -1) {
      alert(message);
      return false;
    }

    $("#state").text("State: Choose Flow");

    cancelHighlightedNodes();
    highlightSourceAndSink();
    selectedNodes.clear();

    $(".proceed-step").text("Choose Flow");

    $("#instructions-state").html("<b>Choose Flow:</b>");
    $("#instructions").html(CHOOSE_FLOW_INSTRUCTIONS);
    return true;
  }

  // CHOOSE FLOW IMPLEMENTATION
  function chooseFlow() {
    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return false;
    }

    const [bottleneck, bottleneckEdge, message] =
      flowNetwork.findBottleneckCapacity(selectedPath);

    // tell user the range he can choose from
    var prompt = window.prompt("Enter a flow you want to apply to the path. ");

    // User pressed cancel
    if (prompt === null) {
      return false;
    }
    // check if the user entered a proper flow: check int and should be within valid range
    flow = parseFloat(prompt);
    while (isNaN(flow) || flow <= 0 || flow > bottleneck) {
      prompt = null;
      if (isNaN(flow)) {
        prompt = window.prompt(
          "The flow amount entered is not a number. Please enter a valid flow amount."
        );
      } else if (flow > bottleneck) {
        prompt = window.prompt(
          "The flow amount entered is too high (HINT: the flow amount is bounded by the bottleneck edge). Please try again."
        );
      } else if (flow <= 0) {
        prompt = window.prompt(
          "The flow amount must be positive. Please try again. "
        );
      }
      if (prompt === null) {
        return false;
      }
      flow = parseFloat(prompt);
    }

    $("#history").append(
      "Path: " + message + " \n<br>Chosen Flow: " + flow + "<br>"
    );

    $("#state").text("State: Update Residual Graph");
    oldFlowNetwork = flowNetwork;
    $(".proceed-step").text("Confirm Residual Graph");
    cy.edgehandles("enable");

    // Set default label of edge to applied flow
    var cytoscapeStyle = cytoscapeSettings["style"];
    cytoscapeStyle[1]["css"]["label"] = flow.toString();
    cy.style().fromJson(cytoscapeStyle);

    $("#instructions-state").html("<b>Update Residual Graph:</b>");
    $("#instructions").html(UPDATE_RESIDUAL_GRAPH_INSTRUCTIONS);
    return true;
  }

  // UPDATE RESIDUAL GRAPH IMPLEMENTATION
  function updateResidualGraph() {
    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return false;
    }

    // check if the current graph is the same network after applying the flow
    // if not, let user redo it.
    var expectedGraph = oldFlowNetwork.addFlow(selectedPath, flow, false);
    errorMessage = isSameGraphSkipFlowComparison(
      flowNetwork.graph,
      expectedGraph
    );
    if (errorMessage === "") {
      cancelHighlightedElements();

      totalflow += flow;
      selectedPath = [];

      $("#state").text("State: Select Path");
      $(".proceed-step").text("Confirm Path");

      cy.edgehandles("disable");

      $("#instructions-state").html("<b>Select Path:</b>");
      $("#instructions").html(SELECT_PATH_INSTRUCTIONS);
      return true;
    } else {
      alert(errorMessage + " Please try again.");
      return false;
    }
  }

  // double click for creating node
  var $cy = $("#cy");
  $cy.dblclick(function (e) {
    // Students can only add nodes during graph creation
    if (allowModify() && !e.target.matches(".cy-panzoom-reset")) {
      var id = getId();
      // Adjust position with zoom and pan
      var zoom = cy.zoom();
      var pan = cy.pan();
      var posX = (e.pageX - $cy.offset().left - pan.x) / zoom;
      var posY = (e.pageY - $cy.offset().top - pan.y) / zoom;
      addNode(cy, id, id, posX, posY);
      if (id == 1) {
        $("#source").text("Source=" + id);
        source = id;
        cancelHighlightedNodes([source, sink]);
        highlightSourceAndSink();
      }
      if (id > 1) {
        $("#sink").text("Sink=" + id);
        sink = id;
        cancelHighlightedNodes([source, sink]);
        highlightSourceAndSink();
      }
    }
  });

  // delete a node with backspace or delete button
  state = states[index];
  $("html").keyup(function (e) {
    if (
      allowModify() ||
      (state === UPDATE_RESIDUAL_GRAPH && cy.$(":selected").isEdge() && !cy.$(":selected").css("label").includes("/"))
    ) {
      // Delete only if user is not updating capacity, I know this !"is not hidden" is really weird. However, jQuery (F*** it for wasting 1 hour of my time!)'s "is hidden"
      // only checks for css attributes display and visibility whereas jQuery's hide does not change those attributes but rather caches them...
      if (e.key == "Delete" && !$("#mouse-update").is(":not(':hidden')")) {
        const inputElement = document.getElementById("label");
        // Check if there's a selection within the input
        if (document.activeElement != inputElement) {
          cy.$(":selected").remove();
        }
      }
    }
  });

  // clear cy drawboard
  $("#clear").on("click", function (event) {
    event.preventDefault();
    cy.nodes().remove();
    cy.edges().remove();

    $("#source").text("Source=");
    $("#sink").text("Sink=");

    $("#status").text("");
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
    $("#label").val("");
  });

  // Graph creation completed, disable graph modification and enter practice mode
  $("#start-practice").on("click", function (event) {
    event.preventDefault();
    // proceed to algorithm practice
    if (allowModify()) {
      source = $("#source").text();
      source = source.substring(source.indexOf("=") + 1);
      sink = $("#sink").text();
      sink = sink.substring(sink.indexOf("=") + 1);
      if (source === sink) {
        alert("The source and the sink can not be the same node!");
        return;
      }
      highlightSourceAndSink();

      cy.edgehandles("disable");

      hideElementAndItsChildren(".buttons");
      state = states[index];
      showElementAndItsChildren(".ending-actions");
      showElementAndItsChildren("#" + state);
      $(this).text("Start Over from the Beginning");
      $(this).css("background-color", "#ed5565");

      $("#state").text("State: Select Path");
      $(".proceed-step").text("Confirm Path");
      showElementAndItsChildren(".proceed-step");
      showElementAndItsChildren("#applied-capacity");

      hideElementAndItsChildren(".change-capacity");

      var edges = cy.edges();

      edges.forEach(function (edge) {
        var label = edge.css("label");
        originalFlowNetwork.push(
          new Edge(edge.source().id(), edge.target().id(), label)
        );
      });

      $("#instructions-state").html("<b>Select Path:</b>");
      $("#instructions").html(SELECT_PATH_INSTRUCTIONS);
    } else {
      index = 0;
      cancelHighlightedElements();
      selectedPath = [];
      $("#history").html("");

      $(this).css("background-color", "#1ab394");
      $(this).text("Start Practice");

      $("#state").text("State: Graph Creation");
      hideElementAndItsChildren(".proceed-step");
      hideElementAndItsChildren("#applied-capacity");
      hideElementAndItsChildren(".buttons");

      showElementAndItsChildren("#" + GRAPH_CREATION);
      showElementAndItsChildren("#clear");
      showElementAndItsChildren("#mouse-label");
      showElementAndItsChildren("#mouse-update");
      hideElementAndItsChildren("#fileInput");

      if (showOriginalCapacitiesAndCurrentFlow) {
        removeOriginalCapacitiesAndCurrentFlow();
      }

      $("#instructions-state").html("<b>Graph Creation:</b>");
      $("#instructions").html(GRAPH_CREATION_INSTRUCTIONS);

      // restore original graph
      cy.edges().remove();
      for (const edge of originalFlowNetwork) {
        addEdge(
          cy,
          edge.source + "-" + edge.target,
          { label: edge.capacity },
          edge.source,
          edge.target
        );
      }

      // var oldFlowNetwork = new FlowNetwork(source, sink);

      // var edges = cy.edges();
      // edges.forEach(function (edge) {
      //   var label = edge.css("label");
      //   if (label.includes("/")) return;
      //   oldFlowNetwork.addEdge(edge.source().id(), edge.target().id(), label);
      // });

      // for (const [_, neighborsMap] of originalFlowNetwork.graph) {
      //   for (const [_, edge] of neighborsMap) {
      //     if (edge.capacity !== 0) {
      //       addEdge(
      //         cy,
      //         edge.source + "-" + edge.target,
      //         { label: edge.capacity },
      //         edge.source,
      //         edge.target
      //       );
      //     }
      //   }
      // }
    }
  });

  // allow edge label to show and disappear
  var selectedEdge = null;
  cy.on("tap", function (event) {
    var target = event.cyTarget;
    if (target.group != "edges") {
      selectedEdge = null;
      $("#label").val("");
    }
  });

  var selectedNodes = new Set();
  cy.on("tap", "node", function (event) {
    var node = event.cyTarget;
    if (!node) return;
    var id = node.id();
    state = states[index];
    highlightSourceAndSink();
    if (!allowModify() && state === SELECT_PATH) {
      if (node.style("border-color") === "black") {
        selectedNodes.add(id);
        node.style("border-color", "#ad1a66");
      } else {
        selectedNodes.delete(id);
        node.style("border-color", "black");
      }
    }
  });

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
    state = states[index];
    if (!allowModify() && state === SELECT_PATH) {
      if (selectedPath.length === 0) {
        selectedPath.push(new Edge(source, target, capacity));
        highlightEdge(source, target);
        return;
      }
      var index2 = selectedPath.findIndex(
        (edge) => edge.source === source && edge.target === target
      );
      if (index2 !== -1) {
        // console.log("highlighted");
        cancelHighlightedEdge(source, target);
        selectedPath.splice(index2, 1);
      } else {
        // console.log("unhighlighted");
        highlightEdge(source, target);
        selectedPath.push(new Edge(source, target, capacity));
      }
    }
  });

  var oldFlowNetwork = null;
  var totalflow = 0;
  var flow = 0;
  // proceed in steps in pracitcing mode
  $(".proceed-step").on("click", function (event) {
    event.preventDefault();
    prevStateOk = false;
    switch (state) {
      case SELECT_PATH:
        prevStateOk = selectPath();
        break;
      case CHOOSE_FLOW:
        prevStateOk = chooseFlow();
        break;
      case UPDATE_RESIDUAL_GRAPH:
        prevStateOk = updateResidualGraph();
        break;
    }
    onStateChange(prevStateOk);
  });

  $("#applied-capacity").on("click", function (e) {
    e.preventDefault();

    showOriginalCapacitiesAndCurrentFlow = !showOriginalCapacitiesAndCurrentFlow;

    if (showOriginalCapacitiesAndCurrentFlow) {
      doShowOriginalCapacitiesAndCurrentFlow();
    } else {
      removeOriginalCapacitiesAndCurrentFlow();
    }
  });

  cy.on("cyedgehandles.complete", function (e) {
    e.preventDefault();

    if (showOriginalCapacitiesAndCurrentFlow) {
      doShowOriginalCapacitiesAndCurrentFlow();
    } else {
      removeOriginalCapacitiesAndCurrentFlow();
    }
  });

  $("#validate-min-cut").on("click", function (e) {
    e.preventDefault();

    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return false;
    }

    var path = flowNetwork.findRandomAugmentingPath();

    if (path.length > 1) {
      alert(
        "There is still a possible augmenting path from source to sink Please keep moving on. "
      );
      return;
    }

    let [sCutErrorMessage, tCutErrorMessage] =
      flowNetwork.validateMinCut(selectedNodes);
    if (sCutErrorMessage === "" || tCutErrorMessage === "") {
      alert(
        "Congratulation! You have sccessfully find a min cut for the given network graph!"
      );
    } else {
      cancelHighlightedNodes();
      highlightSourceAndSink();
      selectedNodes.clear();
      alert(
        "The group of nodes you provided is not a valid min cut for the given flow network for the following reasons.\n\nLet N be the set of nodes you selected.\n\nIf you wanted N to be the source side of a cut, then the problem is:\n" +
          sCutErrorMessage +
          "\n\nIf you wanted N to be the sink side of a cut, then the problem is:\n" +
          tCutErrorMessage
      );
    }
  });

  $("#find-min-cut").on("click", function (e) {
    e.preventDefault();
    cancelHighlightedElements();

    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return;
    }

    var path = flowNetwork.findRandomAugmentingPath();

    if (path.length > 1) {
      alert(
        "There is still a possible augmenting path from the source to the sink. Please keep moving on. "
      );
      return;
    } else {
      var minCutFromSource = flowNetwork.findMinCut(flowNetwork.source);

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

    // Call check graph function, update the graph
    var expectedGraph = oldFlowNetwork.addFlow(selectedPath, flow, false);

    cy.edges().remove();
    for (const [_, neighborsMap] of expectedGraph) {
      for (const [_, edge] of neighborsMap) {
        if (edge.capacity !== 0) {
          addEdge(
            cy,
            edge.source + "-" + edge.target,
            { label: edge.capacity },
            edge.source,
            edge.target
          );
        }
      }
    }

    if (showOriginalCapacitiesAndCurrentFlow) {
      doShowOriginalCapacitiesAndCurrentFlow();
    }

    highlightSourceAndSink();
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
            { label: edge.capacity },
            edge.source,
            edge.target
          );
        }
      }
    }

    if (showOriginalCapacitiesAndCurrentFlow) {
      doShowOriginalCapacitiesAndCurrentFlow();
    }

    highlightSourceAndSink();
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

    if (parseFloat(label) === 0) {
      selectedEdge.remove();
    } else {
      selectedEdge.css("label", label);
    }
  });

  $("#confirm-max-flow").on("click", function (e) {
    e.preventDefault();

    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return;
    }

    var path = flowNetwork.findRandomAugmentingPath();

    if (path.length > 1) {
      alert(
        "There is still a possible path from the source to the sink. Please keep moving on. "
      );
      return;
    } else {
      var usermaxflow = window.prompt(
        "Please enter the value of the max flow: "
      );

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
          "There is no more augmenting path, but the max flow you have entered is not correct. Please try again."
        );
        // window.location.reload();
        // start practicing again, need original network (maybe)
      } else {
        alert(
          "Congratulation! You have successfully found the max flow for the given flow network!"
        );
        // window.location.reload();
      }
    }
  });

  // find random path
  $("#random-path").on("click", function (e) {
    e.preventDefault();
    cancelHighlightedElements();

    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return;
    }

    var path = flowNetwork.findRandomAugmentingPath();

    if (path.length === 0 || path.length === 1) {
      alert("No more augmenting path.");
      return;
    }

    selectedPath = flowNetwork.convertNodesToEdges(path);

    selectedPath.forEach(function (edge) {
      highlightEdge(edge.source, edge.target);
    });

    return;
  });

  // find shortest path
  $("#shortest-path").on("click", function (e) {
    e.preventDefault();
    cancelHighlightedElements();

    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return;
    }

    var path = flowNetwork.findShortestAugmentingPath();

    if (path.length === 0 || path.length === 1) {
      alert("No more augmenting path.");
      return;
    }

    selectedPath = flowNetwork.convertNodesToEdges(path);
    const [bottleneck, bottleneckEdge, message] =
      flowNetwork.findBottleneckCapacity(selectedPath);
    // console.log(message);
    expectedGraph = flowNetwork.addFlow(selectedPath, bottleneck, false);
    selectedPath.forEach(function (edge) {
      highlightEdge(edge.source, edge.target);
    });

    return;
  });

  $("#widest-path").on("click", function (e) {
    e.preventDefault();
    cancelHighlightedElements();

    var flowNetwork = constructFlowNetwork();
    if (flowNetwork === null) {
      return;
    }

    var path = flowNetwork.findWidestAugmentingPath();

    if (path.length === 0 || path.length === 1) {
      alert("No more augmenting path.");
      return;
    }

    selectedPath = flowNetwork.convertNodesToEdges(path);

    selectedPath.forEach(function (edge) {
      highlightEdge(edge.source, edge.target);
    });

    return;
  });

  // creating example graph
  var $add = $("#add-graph");
  $add.on("click", function (event) {
    $("#clear").triggerHandler("click");
    event.preventDefault();
    $("#source").text("Source=1");
    $("#sink").text("Sink=8");
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
      addEdge(cy, edge.id, { label: edge.label }, edge.source, edge.target);
    });
  });
  $add.trigger("click");

  source = "1";
  sink = "8";
  highlightSourceAndSink();

  // readFile() is defined in file-layout-utils.js
  document.getElementById("fileInput").addEventListener("change", readFile);

  document
    .getElementById("downloadButton")
    .addEventListener("click", function () {
      // Assuming the graph is globally accessible or you can pass it as an argument
      event.preventDefault();
      // var tooltip = document.getElementById('edgeTooltip');
      // if (!event.target.matches('.edge')) {
      //     tooltip.style.display = 'none';
      // }
      var flowNetwork = constructFlowNetwork();
      if (flowNetwork === null) {
        return;
      }

      graph = flowNetwork.graph;
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
            y2: centerY + (boundingBox.y2 - centerY) * scaleFactor,
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

  rightClickedEdge = null;

  // Right click on an edge brings up a div for update capacity, only available in GRAPH_CREATION and UPDATE_RESIDUAL_GRAPH
  cy.on("cxttap", "edge", function (event) {
    if (state !== UPDATE_RESIDUAL_GRAPH && !allowModify() || event.cyTarget.css("label").includes("/")) return;
    var mouseX = event.originalEvent.clientX;
    var mouseY = event.originalEvent.clientY;
    rightClickedEdge = event.cyTarget;
    $("#mouse-label").val(rightClickedEdge.css("label"));

    // Set the text and position of the floating div
    var floatingText = document.getElementById("floatingText");
    // floatingText.textContent = capacity; // Change this to whatever text you want
    floatingText.style.display = "block";
    floatingText.style.left = mouseX + "px";
    floatingText.style.top = mouseY + "px";
  });

  var lastRightClickedNode;
  // Right click on an node lets users mark it as the source or the sink
  cy.on("cxttap", "node", function (event) {
    if (allowModify()) {
      var markAsSourceOrSinkDiv = document.getElementById("mark-as-source-or-sink");

      var mouseX = event.originalEvent.clientX;
      var mouseY = event.originalEvent.clientY;
      markAsSourceOrSinkDiv.style.display = "block";
      markAsSourceOrSinkDiv.style.left = mouseX + "px";
      markAsSourceOrSinkDiv.style.top = mouseY + "px";

      lastRightClickedNode = event.cyTarget;
    }
  });

  // if not clicking the div near the mouse, make the div disappear
  document.addEventListener("click", function (event) {
    var floatingText = document.getElementById("floatingText");
    var markAsSourceOrSinkDiv = document.getElementById("mark-as-source-or-sink");
    function clickInsideElement(event, element) {
      var target = event.target;
      do {
        if (target === element) {
          return true;
        }
        target = target.parentNode;
      } while (target);

      return false;
    }
    var isClickInsideFloatingText = clickInsideElement(event, floatingText);
    if (!isClickInsideFloatingText) {
      floatingText.style.display = "none";
    }
    var isClickInsideMarkAsSourceOrSinkDiv = clickInsideElement(event, markAsSourceOrSinkDiv);
    if (!isClickInsideMarkAsSourceOrSinkDiv) {
      markAsSourceOrSinkDiv.style.display = "none";
    }
  });

  // update capacity using the input box near the mouse
  $("#mouse-update").on("click", function (event) {
    event.preventDefault();
    var $mouseLabel = $("#mouse-label");
    var label = $mouseLabel.val();
    if (isNaN(parseFloat(label)) || parseFloat(label) < 0) {
      $mouseLabel.css("border", "1px solid red");
      return;
    }
    if (parseFloat(label) === 0) {
      rightClickedEdge.remove();
    } else {
      rightClickedEdge.css("label", label);
    }
    $mouseLabel.css("border", "1px solid #18a689");
    if (!rightClickedEdge) return;

    rightClickedEdge.css("label", label);

    document.getElementById("floatingText").style.display = "none";

    if (showOriginalCapacitiesAndCurrentFlow) {
      doShowOriginalCapacitiesAndCurrentFlow();
    } else {
      removeOriginalCapacitiesAndCurrentFlow();
    }
    floatingText.style.display = "none";
  });

  $("#mark-as-source").on("click", function (event) {
    event.preventDefault();
    source = lastRightClickedNode.id();
    $("#source").text("Source=" + source);
    cancelHighlightedNodes([source, sink]);
    highlightSourceAndSink();
  });

  $("#mark-as-sink").on("click", function (event) {
    event.preventDefault();
    sink = lastRightClickedNode.id();
    $("#sink").text("Sink=" + sink);
    cancelHighlightedNodes([source, sink]);
    highlightSourceAndSink();
  });

  // Enter is the same as click
  $("#floatingText").on("keydown", function (event) {
    if (event.which === ENTER_KEY) {
      $("#mouse-update").click();
    }
  });

  $(document).on("keydown", function (event) {
    var floatingText = document.getElementById("floatingText");
    if (event.which === ENTER_KEY && floatingText.style.display === "block") {
      $("#mouse-update").click();
    }
  });
});
