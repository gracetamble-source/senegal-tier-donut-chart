const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const radius = 190;

const chartG = svg.append("g")
  .attr("transform", `translate(${width / 2 - 120}, ${height / 2 + 10})`);

const centerG = chartG.append("g")
  .attr("class", "center-label");

const legendG = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width - 230}, 190)`);

const tooltip = d3.select(".tooltip");

const color = d3.scaleOrdinal()
  .domain(["Tier 0/1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"])
  .range([
    "#d73027",
    "#f46d43",
    "#f2cf63",
    "#8fd05a",
    "#1f9448"
  ]);

const pie = d3.pie()
  .value(d => d.value)
  .sort(null);

const arc = d3.arc()
  .innerRadius(85)
  .outerRadius(radius);

const labelArc = d3.arc()
  .innerRadius(radius * 0.72)
  .outerRadius(radius * 0.72);

d3.csv("senegal_pie_chart.csv").then(data => {

  data.forEach(d => {
    d.value = +d.value;
  });

  const years = Array.from(new Set(data.map(d => d.year))).sort();

  d3.select("#year-select")
    .selectAll("option")
    .data(years)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  drawLegend();

  update(years[years.length - 1]);

  d3.select("#year-select")
    .property("value", years[years.length - 1])
    .on("change", function() {
      update(this.value);
    });

  function update(selectedYear) {

    const yearData = data.filter(d => d.year === selectedYear);

    centerG.selectAll("*").remove();

    centerG.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -10)
      .attr("font-size", 38)
      .attr("font-weight", 700)
      .attr("fill", "#2E5C73")
      .text(selectedYear);

    centerG.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 24)
      .attr("font-size", 16)
      .attr("font-weight", 600)
      .attr("fill", "#2E5C73")
      .text("% of population");

    centerG.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 48)
      .attr("font-size", 16)
      .attr("font-weight", 600)
      .attr("fill", "#2E5C73")
      .text("by MTF tier");

    const slices = chartG.selectAll("path")
      .data(pie(yearData), d => d.data.tier);

    slices.join(
      enter => enter.append("path")
        .attr("fill", d => color(d.data.tier))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("d", arc)
        .each(function(d) { this._current = d; })

        .on("mouseover", function(event, d) {

          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.data.tier}</strong><br>
              ${d3.format(".1%")(d.data.value)} of population
            `);

        })

        .on("mousemove", function(event) {

          tooltip
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");

        })

        .on("mouseout", function() {

          tooltip.style("opacity", 0);

        }),

      update => update
        .transition()
        .duration(700)
        .attrTween("d", function(d) {

          const interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(1);

          return t => arc(interpolate(t));

        }),

      exit => exit.remove()
    );

    const labels = chartG.selectAll("text.slice-label")
      .data(pie(yearData), d => d.data.tier);

    labels.join(

      enter => enter.append("text")
        .attr("class", "slice-label")
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .text(d =>
          d.data.value >= 0.04
            ? d3.format(".0%")(d.data.value)
            : ""
        ),

      update => update
        .transition()
        .duration(700)
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .text(d =>
          d.data.value >= 0.04
            ? d3.format(".0%")(d.data.value)
            : ""
        ),

      exit => exit.remove()

    );
  }

  function drawLegend() {

    const items = color.domain();

    const legendItems = legendG.selectAll("g")
      .data(items)
      .join("g")
      .attr("transform", (d, i) => `translate(0, ${i * 40})`);

    legendItems.append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => color(d));

    legendItems.append("text")
      .attr("x", 32)
      .attr("y", 16)
      .text(d => d);

  }

});
