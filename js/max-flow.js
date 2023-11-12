// helper class and function for finding widest path
class WidthNodePair {
  constructor(width, node) {
    this.width = width;
    this.node = node;
  }
}

function compareWidthNodePair(pair1, pair2) {
  return pair1.width > pair2.width;
}

// helper function for finding random path
// Fisher-Yates shuffle algorithm
function shuffle(array) {
  let i = array.length;
  while (--i > 0) {
    let temp = Math.floor(Math.random() * (i + 1));
    [array[temp], array[i]] = [array[i], array[temp]];
  }
}

function isSameGraphSkipFlowComparison(graph1, graph2) {
  if (
    JSON.stringify([...graph1.keys()].sort()) !=
    JSON.stringify([...graph2.keys()].sort())
  ) {
    console.log("here1");
    return false;
  }
  for (const source of graph1.keys()) {
    if (
      JSON.stringify([...graph1.get(source).keys()].sort()) !=
      JSON.stringify([...graph2.get(source).keys()].sort())
    ) {
      console.log("here2");
      return false;
    }
    for (const neighbor of graph1.get(source).keys()) {
      if (
        graph1.get(source).get(neighbor).capacity !=
        graph2.get(source).get(neighbor).capacity
      ) {
        return false;
      }
    }
  }
  return true;
}

class Edge {
  constructor(source, target, capacity, flow = 0) {
    this.source = source;
    this.target = target;
    this.capacity = parseFloat(capacity);
    this.flow = flow;
  }
}

class FlowNetwork {
  constructor(source, sink) {
    // this.edges[source][target] = Edge()
    this.graph = new Map();
    this.source = source;
    this.sink = sink;
  }

  addEdge(source, target, capacity) {
    if (source == target) return;

    var edge = new Edge(source, target, capacity);
    var reverseEdge = new Edge(target, source, 0);
    if (!this.graph.has(source)) this.graph.set(source, new Map());
    if (!this.graph.has(target)) this.graph.set(target, new Map());
    this.graph.get(source).set(target, edge);

    if (!this.isExistEdge(target, source)) {
      this.graph.get(target).set(source, reverseEdge);
    }
  }

  isExistEdge(source, target) {
    return this.graph.has(source) && this.graph.get(source).has(target);
  }

  isExistVertex(vertex) {
    return this.graph.has(vertex);
  }

  // a path topology is not valid if any of these 2 conditions satisfies:
  // 1. there is no path from source to sink
  // 2. there is a node in the given path that does not exist on this path
  // to validate this, first construct a new graph from the path given
  // then use BFS (so that cycle is false later) to find the path from source to sink, if no such path exists, return false
  // otherwise check if there's a node that is not on this path, if so then return false
  // otherwise return true
  // input is list of Edge
  validatePathTopology(path) {
    // construct graph and record all nodes
    var graph = new Map();
    var allNodes = new Set();
    for (const edge of path) {
      if (!graph.has(edge.source)) graph.set(edge.source, new Map());
      if (!graph.has(edge.target)) graph.set(edge.target, new Map());
      allNodes.add(edge.source);
      allNodes.add(edge.target);
      graph.get(edge.source).set(edge.target, edge);
    }
    // find path from source to sink
    if (!graph.has(this.source)) {
      console.log("no source");
      return [false, []];
    }
    var queue = [];
    var visited = new Set();
    var initSearchNode = [this.source, [this.source]];
    queue.push(initSearchNode);
    visited.add(this.source);
    var res = [];
    while (queue.length) {
      var searchNode = queue.shift();
      var node = searchNode[0];
      var path = searchNode[1];
      if (node == this.sink) {
        res = path;
        break;
      }
      for (const neighbor of graph.get(node).keys()) {
        if (!visited.has(neighbor)) {
          var newPath = structuredClone(path);
          newPath.push(neighbor);
          queue.push([neighbor, newPath]);
          visited.add(neighbor);
        }
      }
    }
    // Must have no node outside of the path from source to sink
    return [res.length != 0 && res.length == allNodes.size, res];
  }

  // find bottleneck REMAINING capacity
  // return [bottleneck, "ordered" path from source to sink]
  findBottleneckCapacity(path) {
    const [isValidTopology, pathFromSourceToSink] =
      this.validatePathTopology(path);
    if (!path || !isValidTopology) {
      return [-1, -1, "invalid topology"];
    }
    var bottleneckCapacity = Infinity;
    var bottleneckEdge;
    for (const edge of path) {
      if (edge.capacity - edge.flow < bottleneckCapacity) {
        bottleneckCapacity = edge.capacity - edge.flow;
        bottleneckEdge = edge;
      }
    }
    if (bottleneckCapacity == 0) {
      return [-1, -1, "the selected path is saturated"];
    }
    return [
      bottleneckCapacity,
      bottleneckEdge,
      pathFromSourceToSink.join("->"),
    ];
  }

  // make edge highlighted with given args
  convertNodesToEdges(nodes) {
    var edges = [];
    for (var i = 0; i < nodes.length - 1; i++) {
      edges.push(this.graph.get(nodes[i]).get(nodes[i + 1]));
    }
    return edges;
  }

  // filter neighbors whose edge is not saturated (current flow hasn't reached capacity)
  filterNeighbors(neighborsMap) {
    var filteredNeighborsMap = new Map(
      [...neighborsMap].filter(
        ([neighbor, edge]) => edge.capacity - edge.flow > 0
      )
    );
    return [...filteredNeighborsMap.keys()];
  }

  findShortestAugmentingPath() {
    var res = [];
    var queue = [];
    var visited = new Set();
    var initSearchNode = [this.source, [this.source]];
    queue.push(initSearchNode);
    visited.add(this.source);
    while (queue.length) {
      var searchNode = queue.shift();
      var node = searchNode[0];
      var path = searchNode[1];
      if (node === this.sink) {
        res = path;
        break;
      }
      var filteredNeighbors = this.filterNeighbors(this.graph.get(node));
      for (const neighbor of filteredNeighbors) {
        if (!visited.has(neighbor)) {
          var newPath = structuredClone(path);
          newPath.push(neighbor);
          queue.push([neighbor, newPath]);
          visited.add(neighbor);
        }
      }
    }
    return res;
  }

  findRandomAugmentingPath() {
    var res = [];
    var stack = [];
    var visited = new Set();
    var initSearchNode = [this.source, [this.source]];
    stack.push(initSearchNode);
    while (stack.length) {
      var searchNode = stack.pop();
      var node = searchNode[0];
      var path = searchNode[1];
      if (node === this.sink) {
        res = path;
        break;
      }
      if (visited.has(node)) {
        continue;
      }
      visited.add(node);
      var filteredNeighbors = this.filterNeighbors(this.graph.get(node));
      shuffle(filteredNeighbors);
      for (const neighbor of filteredNeighbors) {
        var newPath = structuredClone(path);
        newPath.push(neighbor);
        stack.push([neighbor, newPath]);
      }
    }
    return res;
  }

  findWidestAugmentingPath() {
    var pq = new PriorityQueue(compareWidthNodePair);
    // dp map that stores the maximum width to a node
    var maxWidth = new Map();
    for (const node of this.graph.keys()) {
      maxWidth.set(node, 0);
    }
    maxWidth.set(this.source, Infinity);
    var prev = new Map();
    for (const node of this.graph.keys()) {
      prev.set(node, "#");
    }
    var startPair = new WidthNodePair(Infinity, this.source);
    pq.push(startPair);
    while (!pq.isEmpty()) {
      var pair = pq.pop();
      var width = pair.width;
      var node = pair.node;
      // if there's already a path from source to current node with higher bottleneck flow, always use that path
      if (maxWidth.get(node) > width) {
        continue;
      }
      var filteredNeighbors = this.filterNeighbors(this.graph.get(node));
      for (const neighbor of filteredNeighbors) {
        // widthto(x) = max e=(v,x):v∈graph [min(widthto(v), width(e))]
        var widthToNeighbor = Math.min(
          this.graph.get(node).get(neighbor).capacity -
          this.graph.get(node).get(neighbor).flow,
          maxWidth.get(node)
        );
        if (widthToNeighbor > maxWidth.get(neighbor)) {
          maxWidth.set(neighbor, widthToNeighbor);
          prev.set(neighbor, node);
          pq.push(new WidthNodePair(widthToNeighbor, neighbor));
        }
      }
    }

    // get the path
    var node = this.sink;
    var res = [];
    var notReachable = false;
    while (node != this.source) {
      if (node == "#") {
        notReachable = true;
        break;
      }
      res.push(node);
      node = prev.get(node);
    }
    if (notReachable) {
      return [];
    }
    res.reverse();
    res.unshift(this.source);
    return res;
  }

  // deepCopyGraph(graph) {
  //   var copy = new Map();
  //   for (const [source, neighborsMap] of graph) {
  //     copy.set(source, new Map());
  //     for (const [neighbor, edge] of neighborsMap) {
  //       copy.get(source).set(neighbor, new Edge(edge.source, edge.target, edge.capacity, edge.flow));
  //     }
  //   }
  //   return copy;
  // }

  addFlow(path, flow, doUpdate) {
    var expectedGraph = _.cloneDeep(this.graph);
    for (const edge of path) {
      expectedGraph.get(edge.source).get(edge.target).flow += flow;
      expectedGraph.get(edge.source).get(edge.target).capacity -= flow;
      expectedGraph.get(edge.target).get(edge.source).capacity += flow;
    }
    if (doUpdate) {
      this.graph = _.cloneDeep(expectedGraph);
    }
    return expectedGraph;
  }

  findMaxFlowFulkerson(paths) {
    console.log(this.graph);
  }

  DFS(node, visited, searchGraph) {
    if (visited.has(node)) {
      return visited;
    }
    visited.add(node);
    var filteredNeighbors = this.filterNeighbors(searchGraph.get(node));
    for (const neighbor of filteredNeighbors) {
      console.log(neighbor);
      if (!visited.has(neighbor)) {
        visited = this.DFS(neighbor, visited, searchGraph);
      }
    }
    return visited;
  }

  reverseGraph(graph) {
    let reversedGraph = new Map();

    for (let node of graph.keys()) {
      if (!reversedGraph.has(node)) {
        reversedGraph.set(node, new Map());
      }

      for (let neighbor of graph.get(node).keys()) {
        if (!reversedGraph.has(neighbor)) {
          reversedGraph.set(neighbor, new Map());
        }
        if (parseFloat(graph.get(node).get(neighbor).capacity) > 0) {
          reversedGraph.get(neighbor).set(node, graph.get(node).get(neighbor));
        }
      }
    }
    return reversedGraph;
  }

  findMinCut(source) {
    let visited = new Set();
    // console.log(this.graph)
    visited = this.DFS(source, visited, this.graph);
    console.log(visited);

    let minCut = [];
    for (let node of visited) {
      for (let neighbor in this.graph[node]) {
        if (!visited.has(neighbor)) {
          minCut.push([node, neighbor]);
        }
      }
    }

    return visited;
  }

  findMinCutBack(sink) {
    let visited = new Set();
    // console.log(this.graph)
    let reversedGraph = this.reverseGraph(this.graph);
    visited = this.DFS(sink, visited, reversedGraph);
    console.log(visited);

    let minCut = [];
    for (let node of visited) {
      for (let neighbor in this.graph[node]) {
        if (!visited.has(neighbor)) {
          minCut.push([node, neighbor]);
        }
      }
    }
    console.log(minCut);
    return visited;
  }

  validateMinCut(sNodes) {
    var tNodes = new Set(Array.from(this.graph.keys()).filter(node => !sNodes.has(node)));
    if (!sNodes.has(this.source) || !tNodes.has(this.sink)) {
      return false;
    }
    console.log(tNodes);
    for (const node of this.graph.keys()) {
      for (const neighbor of this.graph.get(node).keys()) {
        if (sNodes.has(node) && tNodes.has(neighbor) && this.graph.get(node).get(neighbor).capacity > 0) {
          // console.log(node + "->" + neighbor);
          return false;
        }
      }
    }
    return true;
  }

  // findMaxFlowFulkerson (paths) {
  //   paths = paths || [];
  //   var maxFlow = 0;
  //   var parent = {};
  //   console.log("here");
  //   while (this.bfs(parent)) {
  //     var flow = Number.MAX_VALUE;
  //     var curr = this.sink;
  //     var path = [];
  //     while (curr != this.source) {
  //       path.push(curr);
  //       var prev = parent[curr];
  //       flow = Math.min(flow, this.graph[prev][curr].flow);
  //       curr = prev;
  //     }
  //     path.push(this.source);
  //     paths.push({
  //       nodes: path.reverse(),
  //       flow: flow
  //     });

  //     curr = this.sink;
  //     while (curr != this.source) {
  //       prev = parent[curr];
  //       this.graph[prev][curr].flow -= flow;
  //       this.graph[curr][prev].flow += flow;
  //       curr = prev;
  //     }

  //     maxFlow += flow;
  //   }
  //   return maxFlow;
  // };
}
