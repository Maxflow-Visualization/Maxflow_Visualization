function graphToEdgelist(graph) {
    let edgelist = "";

    graph.forEach((neighbors, node1) => {
        neighbors.forEach((edgeValue, node2) => {
            const capacity = edgeValue.capacity;
            if (parseInt(capacity) !== 0){
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