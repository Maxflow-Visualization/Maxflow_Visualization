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
  for (const source of graph1.keys()) {
    if (
      JSON.stringify([...graph1.get(source).keys()].sort()) !=
      JSON.stringify([...graph2.get(source).keys()].sort())
    ) {
      return "Some edges that are not yet saturated in the residual graph are deleted/There are extra edges that should not be added in the residual graph.";
    }
    for (const neighbor of graph1.get(source).keys()) {
      if (
        graph1.get(source).get(neighbor).capacity !=
        graph2.get(source).get(neighbor).capacity
      ) {
        return "Some edges in the residual graph have wrong capacity. For example, " + source + "->" + neighbor + ".";
      }
    }
  }
  return "";
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

    let edge = new Edge(source, target, capacity);
    let reverseEdge = new Edge(target, source, 0);
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

  // a path topology is valid if and only if:
  // 1. it starts from source and ends in sink
  // 2. it does not contain any extra edges (e.g. cycle, random branch, ...)
  // to validate this, first construct a new graph from the path given
  // then use BFS (so that cycle is false later) to find the path from source to sink, if no such path exists, return false
  // otherwise check if user supplies more edges than the path from source to sink, if so then return false
  // otherwise return true
  // input is a list of Edge
  validatePathTopology(path) {
    if (!path) {
      return ["Invalid topology: no path selected", []];
    }
    // construct graph and record all nodes
    let graph = new Map();
    for (const edge of path) {
      if (!graph.has(edge.source)) graph.set(edge.source, new Map());
      if (!graph.has(edge.target)) graph.set(edge.target, new Map());
      graph.get(edge.source).set(edge.target, edge);
    }
    // find path from source to sink
    if (!graph.has(this.source)) {
      return ["Invalid topology: the selected path does not start from the source", []];
    }
    let queue = [];
    let visited = new Set();
    let initSearchNode = [this.source, [this.source]];
    queue.push(initSearchNode);
    visited.add(this.source);
    let res = [];
    while (queue.length) {
      let searchNode = queue.shift();
      let node = searchNode[0];
      let path = searchNode[1];
      if (node === this.sink) {
        res = path;
        break;
      }
      for (const neighbor of graph.get(node).keys()) {
        if (!visited.has(neighbor)) {
          let newPath = structuredClone(path);
          newPath.push(neighbor);
          queue.push([neighbor, newPath]);
          visited.add(neighbor);
        }
      }
    }
    if (res.length === 0) {
      return ["Invalid topology: the selected path does not reach the sink", []];
    } else if (res.length - 1 !== path.length) {
      return ["Invalid topology: the selected path contains extra edges than what is needed to reach sink from source (note that technically an augmenting path with cycles is okay, but the tool doesn't allow cycles)", []];
    } else {
      return ["", res];
    }
  }

  // find bottleneck REMAINING capacity
  // return error or [bottleneck, bottleneck edge, "ordered" path from source to sink]
  findBottleneckCapacity(path) {
    let [errorMessage, pathFromSourceToSink] = this.validatePathTopology(path);
    if (errorMessage !== "") {
      return [-1, -1, errorMessage];
    }
    let bottleneckCapacity = Infinity;
    let bottleneckEdge;
    for (const edge of path) {
      if (edge.capacity - edge.flow < bottleneckCapacity) {
        bottleneckCapacity = edge.capacity - edge.flow;
        bottleneckEdge = edge;
      }
    }
    if (bottleneckCapacity == 0) {
      return [-1, -1, "The selected path is saturated"];
    }
    return [
      bottleneckCapacity,
      bottleneckEdge,
      pathFromSourceToSink.join("->"),
    ];
  }

  // make edge highlighted with given args
  convertNodesToEdges(nodes) {
    let edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push(this.graph.get(nodes[i]).get(nodes[i + 1]));
    }
    return edges;
  }

  // filter neighbors whose edge is not saturated (current flow hasn't reached capacity)
  filterNeighbors(neighborsMap) {
    let filteredNeighborsMap = new Map(
      [...neighborsMap].filter(
        ([neighbor, edge]) => edge.capacity - edge.flow > 0
      )
    );
    return [...filteredNeighborsMap.keys()];
  }

  findShortestAugmentingPath() {
    let res = [];
    let queue = [];
    let visited = new Set();
    let initSearchNode = [this.source, [this.source]];
    queue.push(initSearchNode);
    visited.add(this.source);
    while (queue.length) {
      let searchNode = queue.shift();
      let node = searchNode[0];
      let path = searchNode[1];
      if (node === this.sink) {
        res = path;
        break;
      }
      let filteredNeighbors = this.filterNeighbors(this.graph.get(node));
      for (const neighbor of filteredNeighbors) {
        if (!visited.has(neighbor)) {
          let newPath = structuredClone(path);
          newPath.push(neighbor);
          queue.push([neighbor, newPath]);
          visited.add(neighbor);
        }
      }
    }
    return res;
  }

  findRandomAugmentingPath() {
    let res = [];
    let stack = [];
    let visited = new Set();
    let initSearchNode = [this.source, [this.source]];
    stack.push(initSearchNode);
    while (stack.length) {
      let searchNode = stack.pop();
      let node = searchNode[0];
      let path = searchNode[1];
      if (node === this.sink) {
        res = path;
        break;
      }
      if (visited.has(node)) {
        continue;
      }
      visited.add(node);
      let filteredNeighbors = this.filterNeighbors(this.graph.get(node));
      shuffle(filteredNeighbors);
      for (const neighbor of filteredNeighbors) {
        let newPath = structuredClone(path);
        newPath.push(neighbor);
        stack.push([neighbor, newPath]);
      }
    }
    return res;
  }

  findWidestAugmentingPath() {
    let pq = new PriorityQueue(compareWidthNodePair);
    // dp map that stores the maximum width to a node
    let maxWidth = new Map();
    for (const node of this.graph.keys()) {
      maxWidth.set(node, 0);
    }
    maxWidth.set(this.source, Infinity);
    let prev = new Map();
    for (const node of this.graph.keys()) {
      prev.set(node, "#");
    }
    let startPair = new WidthNodePair(Infinity, this.source);
    pq.push(startPair);
    while (!pq.isEmpty()) {
      let pair = pq.pop();
      let width = pair.width;
      let node = pair.node;
      // if there's already a path from source to current node with higher bottleneck flow, always use that path
      if (maxWidth.get(node) > width) {
        continue;
      }
      let filteredNeighbors = this.filterNeighbors(this.graph.get(node));
      for (const neighbor of filteredNeighbors) {
        // widthto(x) = max e=(v,x):v∈graph [min(widthto(v), width(e))]
        let widthToNeighbor = Math.min(
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
    let node = this.sink;
    let res = [];
    let notReachable = false;
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
  //   let copy = new Map();
  //   for (const [source, neighborsMap] of graph) {
  //     copy.set(source, new Map());
  //     for (const [neighbor, edge] of neighborsMap) {
  //       copy.get(source).set(neighbor, new Edge(edge.source, edge.target, edge.capacity, edge.flow));
  //     }
  //   }
  //   return copy;
  // }

  addFlow(path, flow, doUpdate) {
    let expectedGraph = _.cloneDeep(this.graph);
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
    let filteredNeighbors = this.filterNeighbors(searchGraph.get(node));
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

  // Since this.graoph is currently a residual graph, no need to check for "min" since if there are other augmenting paths, our tool will not proceed to this step.
  // Rather, we only check if it is not possible to reach t from s (student supplies sNodes) or reach s from t (student supplies tNodes)
  validateMinCut(sNodes) {
    return [this.doValidateMinCut(sNodes, false), this.doValidateMinCut(sNodes, true)]
    // return this.doValidateMinCut(sNodes, false) || this.doValidateMinCut(sNodes, true);
  }

  // For some reason Javascript doesn't find the overloading, so have to rename the function...
  doValidateMinCut(sNodes, isReversed) {
    let graph = isReversed ? this.reverseGraph(this.graph) : this.graph;
    let tNodes = new Set(Array.from(graph.keys()).filter(node => !sNodes.has(node)));

    if (!isReversed && (!sNodes.has(this.source) || !tNodes.has(this.sink))) {
      return "Your selected cut does not contain the source or contains the sink.";
    } else if (isReversed && (!sNodes.has(this.sink) || !tNodes.has(this.source))) {
      return "Your selected cut does not contain the sink or contains the source.";
    }
    for (const node of graph.keys()) {
      for (const neighbor of graph.get(node).keys()) {
        if (sNodes.has(node) && tNodes.has(neighbor) && graph.get(node).get(neighbor).capacity > 0) {
          let reachEdge = node + "->" + neighbor;
          if (!isReversed) {
            return "We can still reach T from S via " + reachEdge + " so that it is not a \"cut\".";
          } else {
            return "We can still reach S from T via " + reachEdge + " so that it is not a \"cut\".";
          }
        }
      }
    }
    return "";
  }

  // findMaxFlowFulkerson (paths) {
  //   paths = paths || [];
  //   let maxFlow = 0;
  //   let parent = {};
  //   console.log("here");
  //   while (this.bfs(parent)) {
  //     let flow = Number.MAX_VALUE;
  //     let curr = this.sink;
  //     let path = [];
  //     while (curr != this.source) {
  //       path.push(curr);
  //       let prev = parent[curr];
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
