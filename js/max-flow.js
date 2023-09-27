class Edge {
  constructor (source, target, capacity) {
    this.source = source;
    this.target = target;
    this.capacity = capacity;
    this.flow = capacity;
  }
};

class FlowNetwork {
  constructor (source, sink) {
    // this.edges[source][target] = Edge()
    this.graph = {}
    this.source = source
    this.sink = sink
  }

  getGraph() {
    return this.graph
  }
  
  addEdge (source, target, capacity) {
    if (source == target) return;
  
    var edge = new Edge(source, target, capacity);
    var reverseEdge = new Edge(target, source, 0);
  
    if (this.graph[source] === undefined) this.graph[source] = {};
    if (this.graph[target] === undefined) this.graph[target] = {};
  
    this.graph[source][target] = edge;
  
    if (!this.isExistEdge(target, source)) {
      this.graph[target][source] = reverseEdge;
    }
  };
  
  isExistEdge (source, target) {
    return !!this.graph[source][target];
  
  };
  
  isExistVertex (vertex) {
    var nodes = Object.keys(this.graph);
    return nodes.indexOf(vertex) !== -1;
  };

  bfs (source, target, parent) {
    var queue = [];
    var visited = [];
    queue.push(source);
    visited.push(source);
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
    return visited.indexOf(target) !== -1;
  };
  
  findMaxFlowFulkerson (paths) {
    paths = paths || [];
    var maxFlow = 0;
    var parent = {};
    while (this.bfs(this.source, this.sink, parent)) {
      var flow = Number.MAX_VALUE;
      var curr = this.sink;
      var path = [];
      while (curr != this.source) {
        path.push(curr);
        var prev = parent[curr];
        flow = Math.min(flow, this.graph[prev][curr].flow);
        curr = prev;
      }
      path.push(this.source);
      paths.push({
        nodes: path.reverse(),
        flow: flow
      });
  
      curr = this.sink;
      while (curr != this.source) {
        prev = parent[curr];
        this.graph[prev][curr].flow -= flow;
        this.graph[curr][prev].flow += flow;
        curr = prev;
      }
  
      maxFlow += flow;
    }
    return maxFlow;
  };
}