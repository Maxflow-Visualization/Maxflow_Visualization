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

    if (this.graph[source] === undefined) this.graph[source] = new Map();
    if (this.graph[target] === undefined) this.graph[target] = new Map();

    this.graph[source].set(target, edge);

    if (!this.isExistEdge(target, source)) {
      this.graph[target][source] = reverseEdge;
    }
  }

  isExistEdge(source, target) {
    return !!this.graph[source][target];
  }

  isExistVertex(vertex) {
    var nodes = Object.keys(this.graph);
    return nodes.indexOf(vertex) !== -1;
  }

  bfs(parent) {
    var queue = [];
    var visited = [];
    queue.push(this.source);
    visited.push(this.source);
    while (queue.length) {
      var u = queue.shift();
      var keys = Object.keys(this.graph[u]);
      for (var i = 0; i < keys.length; i++) {
        var v = keys[i];
        if (this.graph[u][v].flow > 0 && visited.indexOf(v) === -1) {
          queue.push(v);
          parent[v] = u;
          visited.push(v);
        }
      }
    }
    return visited.indexOf(this.target) !== "-1";
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
        res = path
      }
      var filteredNeighbors = this.filterNeighbors(this.graph[node])
      for (const neighbor of filteredNeighbors) {
        if (!visited.has(neighbor)) {
          var newPath = structuredClone(path)
          newPath.push(neighbor)
          queue.push([neighbor, newPath])
          visited.add(neighbor)
        }
      }
    }
    console.log(res)
    return res
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
        res = path
      }
      var filteredNeighbors = this.filterNeighbors(this.graph[node])
      shuffle(filteredNeighbors);
      for (const neighbor of filteredNeighbors) {
        if (!visited.has(neighbor)) {
          var newPath = structuredClone(path)
          newPath.push(neighbor)
          stack.push([neighbor, newPath])
          visited.add(neighbor)
        }
      }
    }
    console.log(res)
    return res
  }

  findWidestAugmentingPath() {
    
  }

  addFlow(path, flow) {}

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
