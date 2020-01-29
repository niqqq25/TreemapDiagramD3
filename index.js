(async function ready() {
    const data = await fetchData();
    loadTreemap(data);
})();

async function fetchData() {
    const response = await fetch(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json"
    );
    const json = await response.json();

    if (response.ok) {
        return json;
    } else {
        console.error(json);
    }
}

function loadTreemap(games) {
    const container = d3.select("#treemap-container");

    //title
    container
        .append("h2")
        .attr("id", "title")
        .text("Video Game Sales");

    //description
    container
        .append("p")
        .attr("id", "description")
        .text("Top 100 Most Sold Video Games Grouped by Platform");

    //tooltip
    const tooltip = container
        .append("pre")
        .attr("id", "tooltip")
        .attr("class", "tooltip--hidden");

    //treemap
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const height = 600 - margin.top - margin.bottom;
    const width = 1000 - margin.right - margin.left;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const treeMap = container
        .append("svg")
        .attr("id", "tree-map")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.top)
        .style("overflow", "visible")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const treemapLayout = data =>
        d3.treemap().size([width, height])(
            d3
                .hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value)
        );
    const root = treemapLayout(games);

    const leaf = treeMap
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        .style("overflow", "hidden")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .on("mouseover", d => {
            tooltip
                .classed("tooltip--hidden", false)
                .attr("data-value", d.data.value)
                .text(formatTooltipText(d.data));
        })
        .on("mousemove", () => {
            tooltip
                .style("left", d3.event.pageX + 10 + "px")
                .style("top", d3.event.pageY + 10 + "px");
        })
        .on("mouseout", () => {
            tooltip.classed("tooltip--hidden", true);
        });

    leaf.append("rect")
        .attr("id", (d, i) => (d.id = "tile-" + i))
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => {
            while (d.depth > 1) d = d.parent;
            return color(d.data.name);
        })
        .attr("class", "tile")
        .attr("data-name", d => d.data.name)
        .attr("data-category", d => d.data.category)
        .attr("data-value", d => d.data.value);

    leaf.append("clipPath")
        .attr("id", (d, i) => (d.clipId = "clip-" + i))
        .append("use")
        .attr("xlink:href", (d, i) => "#" + d.id);

    leaf.append("g")
        .attr("clip-path", d => `url(#${d.clipId})`)
        .attr("class", "tile-text")
        .selectAll("text")
        .data(d => d.data.name.split(" "))
        .enter()
        .append("text")
        .style("font-size", "12")
        .attr("x", 3)
        .attr("y", (d, i, node) => parseInt(node[i].style.fontSize) * (i + 1))
        .text(d => d);

    //legend
    const legendHeight = 200;
    const legendWidth = 300;
    const legendItemHeight = 15;
    const legendItemWidth = 100;
    const legendItemOffset = 10;
    const catagories = games.children.map(d => d.name);
    const itemsPerRow = 3;

    const legend = container
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("id", "legend");

    const legendTile = legend
        .selectAll("g")
        .data(catagories)
        .enter()
        .append("g")
        .attr("transform", (d, i) => {
            const row = Math.floor(i / itemsPerRow);
            const column = i - row * itemsPerRow;
            const y = row * (legendItemHeight + legendItemOffset);
            const x = column * (legendItemWidth + legendItemOffset);
            return `translate(${x} ${y})`;
        });

    legendTile
        .append("rect")
        .attr("class", "legend-item")
        .attr("width", legendItemHeight)
        .attr("height", legendItemHeight)
        .attr("fill", d => color(d));

    legendTile
        .append("text")
        .text(d => d)
        .attr("x", legendItemHeight + 5)
        .attr("y", legendItemHeight - 2);
}

function formatTooltipText({ name, category, value }) {
    return `Name: ${name}\nCategoty: ${category}\nValue: ${value}`;
}
