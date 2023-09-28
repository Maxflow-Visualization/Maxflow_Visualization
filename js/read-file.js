document.getElementById('fileInput').addEventListener('change', readFile);

function readFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n');
        const graph = {};

        lines.forEach(line => {
            const parts = line.trim().split(' '); // assuming space-separated values
            if (parts.length !== 3) return;

            const node1 = parts[0];
            const node2 = parts[1];
            const edgeValue = parts[2];

            // Adding to graph
            if (!graph[node1]) {
                graph[node1] = {};
            }
            graph[node1][node2] = edgeValue;
        });

        console.log(graph); // Here's your directed graph
    };

    reader.readAsText(file);
}
