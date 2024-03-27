cytoscapeSettings = {
    container: document.getElementById("cy"),
    style: [
        {
            selector: "node",
            css: {
                content: "data(id)",
                "text-valign": "center",
                "text-halign": "center",
                "background-color": "white",
                "line-color": "red",
                "target-arrow-color": "#61bffc",
                "transition-property": "background-color, line-color, target-arrow-color",
                "transition-duration": "0.5s",
                "padding-top": "5px",
                "padding-right": "5px",
                "padding-bottom": "5px",
                "padding-left": "5px",
                "border-width": 2,
                "border-color": "black",
            },
        },
        {
            selector: "edge",
            css: {
                "target-arrow-shape": "triangle",
                width: 4,
                "line-color": "lightgray",
                "target-arrow-color": "lightgray",
                label: "1",
                "text-valign": "right",
            },
        },
        {
            selector: ".edgehandles-hover",
            css: {
                "border-width": 3,
                "border-color": "black",
            },
        },
        {
            selector: ".edgehandles-source",
            css: {
                "border-width": 3,
                "border-color": "black",
            },
        },
        {
            selector: ".edgehandles-target",
            css: {
                "border-width": 3,
                "border-color": "black",
            },
        },
        {
            selector: ".edgehandles-preview",
            css: {
                "line-color": "darkgray",
                "target-arrow-color": "darkgray",
                "source-arrow-color": "darkgray",
            },
        },
        {
            selector: "node:selected",
            css: {
                "border-width": 3,
                "border-color": "#000000",
            },
        },
        {
            selector: "edge:selected",
            css: {
                "line-color": "darkgray",
                "target-arrow-color": "darkgray",
            },
        },
        {
            selector: ".highlighted",
            css: {
                "background-color": "#ad1a66",
                "line-color": "#ad1a66",
                "target-arrow-color": "#ad1a66",
                "transition-property":
                "background-color, line-color, target-arrow-color",
                "transition-duration": "0.5s",
            },
        },
    ],
    layout: {
        name: "preset",
        directed: true,
        roots: "#a",
        padding: 10,
    },
    userPanningEnabled: true,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    selectionType: "single",
    minZoom: 0.5, // sets the minimum zoom level
    maxZoom: 2, // sets the maximum zoom level
};