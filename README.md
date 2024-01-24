# Maxflow_Visualization

## Overview

Maxflow Visualization is a web-based tool that allows users to interactively explore and visualize maximum flow algorithms on graphs. It provides an intuitive way to understand the flow of resources through a network by employing various max-flow algorithms.

## Features

- **Interactive Graph:** Visualize graphs and dynamically adjust edge capacities.
- **Multiple Algorithms:** Explore different maximum flow algorithms, including Ford-Fulkerson and Edmonds-Karp.
- **Step-by-Step Animation:** Step through the algorithm execution to understand each phase.
- **Custom Graphs:** Create custom graphs or load predefined examples.

## Getting Started

Visit the [Maxflow Visualization Website](https://maxflow-visualization.github.io/Maxflow_Visualization/) to start exploring maximum flow algorithms.

## Usage

1. **Load Graph:** Choose a predefined graph or create a custom one.
2. **Set Capacities:** Adjust edge capacities by clicking on edges.
3. **Choose Algorithm:** Select a maximum flow algorithm from the options.
4. **Run and Visualize:** Watch the algorithm in action and step through the process if needed.

## Supported Algorithms

- **Ford-Fulkerson**
  - Random path
- **Edmonds-Karp**
  - Shortest path
- **Capacity Scaling**
  - Widest path
- **Min-cut**

## High-Level Structure

The code is organized as follows:

    .
    ├── css                       # CSS styles
    │   └── ...         
    ├── js                        # Javascript scripts
    │   ├── file-layout-utils.js  # Enables user to download and upload customized graphs, also contains helper functions for graph layout
    │   ├── app.js                # Interface to visualize graph and bridge between user interaction and algorithmic processing
    │   ├── max-flow.js           # Provides algorithmic implementation, i.e. Ford-Fulkerson, Min-cut
    │   ├── priority-queue.js     # Helper function that implements a priority queue functionality
    │   └── utils.js              # Contains helper functions              
    ├── vendor                    # Contains third-party libraries, i.e. Cytoscpape
    │   └── ...     
    ├── index.html              # Main and only html file to be rendered and executed          
    └── ... 


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

The initial styling and the choice of Cytoscape framework were inspired by [this project](https://github.com/isabek/isabek.github.io). We consulted professor [David Kempe](https://www.david-kempe.com/) at University of Southern California and [this slide](https://www.cs.cmu.edu/~avrim/451f11/lectures/lects12-14.pdf) from Carnegie Mellon University on algorithms. We appreciate their work.

## Contact

For questions or support, please contact [Maxflow Visualization Team](mailto:ymy@apache.org).
