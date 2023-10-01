// document.getElementById('fileInput').addEventListener('change', readFile);

// function readFile(event) {
//     const file = event.target.files[0];
//     const reader = new FileReader();

//     reader.onload = function(e) {
//         const content = e.target.result;
//         const lines = content.split('\n');
//         const graph = {};
//         var smallest = 10000000;
//         var largest = 0;
//         var positionX = 150;
//         var positionY = 200;
//         let mySet = new Set();
//         var nextAdd = 1;

//         lines.forEach(line => {
//             const parts = line.trim().split(' '); // assuming space-separated values
//             if (parts.length !== 3) return;

//             const node1 = parts[0];
//             const node2 = parts[1];
//             const edgeValue = parts[2];
            
//             var node1val = parseInt(node1, 10);
//             var node2val = parseInt(node2, 10);

//             // find smallest and largest node
//             if (node1val < smallest) {
//                 smallest = node1val;
//             }
//             if (node2val < smallest) {
//                 smallest =  node2val;
//             }
//             if (node1val > largest) {
//                 largest =  node1val;
//             }
//             if (node2val > largest) {
//                 largest =  node2val;
//             }

//             if (!mySet.has(node1val)) {
//                 mySet.add(node1val);
//                 addNode(cy, node1val, node1val, positionX, positionY);
//                 positionX += 50 * (nextAdd % 2) ;
//                 positionY += 60 * ((nextAdd + 1) % 2);
//                 nextAdd ^= 1;
//             }

//             if (!mySet.has(node2val)) {
//                 mySet.add(node2val);
//                 addNode(cy, node2val, node2val, positionX, positionY);
//                 positionX += 50 * (nextAdd % 2) ;
//                 positionY += 60 * ((nextAdd + 1) % 2);
//                 nextAdd ^= 1;
//             }

//             // Adding to graph
//             if (!graph[node1]) {
//                 graph[node1] = {};
//             }
//             graph[node1][node2] = edgeValue;
//         });

//         console.log(graph); // Here's your directed graph
//         console.log(smallest);
//         console.log(largest);
//         $("#source").val(smallest);
//         $("#sink").val(largest);
//     };

//     reader.readAsText(file);
// }


