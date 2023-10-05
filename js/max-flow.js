// Priority Queue Implementation
const topp = 0;
const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[topp];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > topp) {
      this._swap(topp, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[topp] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > topp && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }
  _siftDown() {
    let node = topp;
    while (
      (left(node) < this.size() && this._greater(left(node), node)) ||
      (right(node) < this.size() && this._greater(right(node), node))
    ) {
      let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

class WidthNodePair {
  constructor(width, node) {
    this.width = width;
    this.node = node;
  }
}

function compareWidthNodePair(pair1, pair2) {
  return pair1.width > pair2.width;
}

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
        res = path
      }
      var filteredNeighbors = this.filterNeighbors(this.graph.get(node))
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
      var filteredNeighbors = this.filterNeighbors(this.graph.get(node))
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
    var node = this.sink
    var res = []
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
