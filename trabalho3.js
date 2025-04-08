import {
    DataSet,
    Network,
} from "https://unpkg.com/vis-network/standalone/esm/vis-network.min.js";

class listaIndexada {
    constructor(data) {
        this.verticies = Object.keys(data);
        this.connections = this.verticies.map((vert) => data[vert]);
    }

    verificaVizinhos(vert) {
        const index = this.verticies.indexOf(vert);
        return this.connections[index];
    }

    calculaGraus(vert) {
        return this.verificaVizinhos(vert).length;
    }

    ordenaVertices() {
        return [...this.verticies].sort(
            (a, b) => this.calculaGraus(b) - this.calculaGraus(a)
        );
    }

    agruparVertices() {
        const groups = [];
        for (const vert of this.ordenaVertices()) {
            let added = false;
            const conns = this.verificaVizinhos(vert);
            for (const group of groups) {
                const hasConnection = group.some((vert2) => conns.includes(vert2));
                if (!hasConnection && !added) {
                    group.push(vert);
                    added = true;
                }
            }
            if (!added) groups.push([vert]);
        }
        return groups;
    }
}

// Conteúdo das bibliotecas:

async function renderFromJson(url, containerId, legendId) {
    const res = await fetch(url);
    const data = await res.json();
    const graph = new listaIndexada(data);
    const groups = graph.agruparVertices();

    const palette = [
        "#e6194b", "#3cb44b", "#ffe119", "#4363d8",
        "#f58231", "#911eb4", "#42d4f4", "#f032e6"
    ];
    const nodeColors = {};
    groups.forEach((group, i) =>
        group.forEach((v) => (nodeColors[v] = palette[i % palette.length]))
    );

    const nodes = new DataSet(
        graph.verticies.map((v) => ({
            id: v,
            label: v,
            color: nodeColors[v] || "#ccc",
        }))
    );

    const edgeSet = new Set();
    const uniqueEdges = [];
    graph.verticies.forEach((v) => {
        graph.verificaVizinhos(v).forEach((v2) => {
            const key = [v, v2].sort().join("-");
            if (!edgeSet.has(key)) {
                edgeSet.add(key);
                uniqueEdges.push({ from: v, to: v2 });
            }
        });
    });

    const container = document.getElementById(containerId);
    new Network(container, { nodes, edges: uniqueEdges }, {
        physics: {
            enabled: true,
            solver: "forceAtlas2Based",
            forceAtlas2Based: {
                springLength: 50,
                springConstant: 0.05,
            },
            stabilization: { iterations: 200 },
        },
        interaction: {
            zoomView: false,
            dragView: true
        },
        nodes: { shape: "dot", size: 20, font: { color: "#000" } },
        edges: { color: "#999", smooth: { type: "continuous" } },
    });

    // Legendas:
    const legend = document.getElementById(legendId);
    legend.innerHTML = "<h3>Legenda</h3>";
    Object.entries(groups).forEach(([i, group]) => {
        const color = palette[i % palette.length];
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.marginBottom = "5px";

        const square = document.createElement("div");
        square.style.width = "20px";
        square.style.height = "20px";
        square.style.backgroundColor = color;
        square.style.marginRight = "10px";
        square.style.border = "1px solid #000";

        const label = document.createElement("span");
        label.textContent = `Grupo ${+i + 1}: ${group.join(", ")}`;

        item.appendChild(square);
        item.appendChild(label);
        legend.appendChild(item);
    });
}

renderFromJson("grafo1.json", "graph1", "legend1");
renderFromJson("grafo2.json", "graph2", "legend2");