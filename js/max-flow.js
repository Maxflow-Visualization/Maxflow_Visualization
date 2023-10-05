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

class Edge {
  constructor(source, target, capacity) {
    this.source = source;
    this.target = target;
    this.capacity = parseInt(capacity);
    this.flow = 0;
  }
}

class FlowNetwork {
  constructor(source, sink) {
    // this.edges[source][target] = Edge()
    this.graph = new Map();
    this.source = source;
    this.sink = sink;
  }

  getGraph() {
    return this.graph;
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
    console.log(graph);
    // find path from source to sink
    if (!graph.has(this.source)) {
      console.log("no source");
      return false;
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
    return res.length != 0 && res.length == allNodes.size;
  }

  // find bottleneck REMAINING capacity
  findBottleneckCapacity(path) {
    if (!this.validatePathTopology(path)) {
      return -1;
    }
  }

  isExistEdge(source, target) {
    return this.graph.has(source) && this.graph.get(source).has(target);
  }

  isExistVertex(vertex) {
    return this.graph.has(vertex);
  }

  // make edge highlighted with given args
  convertNodesToEdges(nodes) {
    var edges = [];
    for (var i = 0; i < nodes.length - 1; i++) {
      edges.push(this.graph.get(nodes[i]).get(nodes[i+1]));
    }
    return edges;
  }

  // filter neighbors whose edge is not saturated (current flow hasn't reached capacity)
  filterNeighbors (neighborsMap) {
    var filteredNeighborsMap = new Map(
      [...neighborsMap].filter(
        ([neighbor, edge]) => edge.capacity - edge.flow > 0
      )
    );
    return [...filteredNeighborsMap.keys()]
  }

  findShortestAugmentingPath() {
    var res = []
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
    console.log(res);
    return res;
  }

  findRandomAugmentingPath() {
    var res = []
    var stack = [];
    var visited = new Set();
    var initSearchNode = [this.source, [this.source]];
    stack.push(initSearchNode);
    visited.add(this.source);
    while (stack.length) {
      var searchNode = stack.pop();
      var node = searchNode[0];
      var path = searchNode[1];
      if (node === this.sink) {
        res = path;
        break;
      }
      var filteredNeighbors = this.filterNeighbors(this.graph.get(node));
      shuffle(filteredNeighbors);
      for (const neighbor of filteredNeighbors) {
        if (!visited.has(neighbor)) {
          var newPath = structuredClone(path);
          newPath.push(neighbor);
          stack.push([neighbor, newPath]);
          visited.add(neighbor);
        }
      }
    }
    console.log(res);
    return res;
  }

  findWidestAugmentingPath() {
    var pq = new PriorityQueue(compareWidthNodePair)
    // dp map that stores the maximum width to a node
    var maxWidth = new Map();
    for (const node of this.graph.keys()) {
      maxWidth.set(node, 0);
    }
    maxWidth.set(this.source, Infinity);
    var prev = new Map();
    for (const node of this.graph.keys()) {
      prev.set(node, '#');
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
        var widthToNeighbor = Math.min(this.graph.get(node).get(neighbor).capacity - this.graph.get(node).get(neighbor).flow, maxWidth.get(node));
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
    while (node != this.source) {
      res.push(node);
      node = prev.get(node);
    }
    res.reverse();
    res.unshift(this.source);
    console.log(res);
    return res;
  }

  addFlow(path, flow) {
  }

  findMaxFlowFulkerson(paths) {
    console.log(this.graph);
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
