function graphToEdgelist(graph) {
    let edgelist = "";

    graph.forEach((neighbors, node1) => {
        neighbors.forEach((edgeValue, node2) => {
            const capacity = edgeValue.capacity;
            if (parseInt(capacity) !== 0) {
                edgelist += `${node1} ${node2} ${capacity}\n`;
            }
        });
    });

    return edgelist.trim(); // Return the edgelist content
}

function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    // These lines are used to trigger the download immediately
    document.body.appendChild(element);  // Append to the document
    element.click();  // Programmatically click the anchor
    document.body.removeChild(element);  // Remove the anchor from the document
}

// read file and load it to cy drawboard
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
        // Updated regex to include negative values
        const parts = data.match(/(\d+)\((-?\d+),(-?\d+)\)/);
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

      // Rest of the code
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

    $("#source").text("Source=" + smallest);
    $("#sink").text("Sink=" + largest);
    source = smallest;
    sink = largest;
    cancelHighlightedNodes();
    highlightSourceAndSink();

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
      x: currentPosition.y,
      y: currentPosition.x / 2.5,
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
        { label: parseFloat(edgeValue, 10) },
        parseInt(node1, 10),
        parseInt(node2, 10)
      );
    });
  });
}

//draw nodes according to the input graph. Node position needs further considerations.
function drawNodes(graph, source, sink) {
  cy.nodes().remove();
  var yPosition = 80;
  let mySet = new Set();
  var xPositionOffset = -30;
  graph.forEach((edges, node) => {
    edges.forEach((edgeValue, node2) => {
      var node2val = parseInt(node2, 10);
      if (!mySet.has(node2val)) {
        mySet.add(node2val);
        if (node2val === sink) {
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