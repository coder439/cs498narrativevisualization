let currentScene = 0;
const totalScenes = 3;
const width = 1200;
const height = 650; 
let data;

d3.csv("data.csv").then(d => {
  data = d.map(row => ({
    country: row["Entity"],
    year: +row["Year"],
    co2: +row["Annual CO₂ emissions"]
  }));
  showScene(currentScene);
});

const svg = d3.select("#vis")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

function showScene(scene) {
  svg.selectAll("*").remove();
  d3.selectAll("select").remove();
  if (scene === 0) {
    scene0();
  } else if (scene === 1) {
    scene1();
  } else if (scene === 2) {
    scene2();
  }
}

function scene0() {
  const global = d3.rollup(
    data.filter(d => !isNaN(d.year) && !isNaN(d.co2)),
    v => d3.sum(v, d => d.co2),
    d => d.year
  );

  const lineData = Array.from(global.entries())
    .map(([year, value]) => ({ year: +year, value }))
    .sort((a, b) => a.year - b.year);

  const x = d3.scaleLinear()
    .domain(d3.extent(lineData, d => d.year))
    .range([50, width - 50]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(lineData, d => d.value)])
    .range([height - 50, 120]);  

  svg.append("path")
    .datum(lineData)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value)));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .text("Global CO₂ Emissions Over Time");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 55)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#666")
    .text("Total worldwide CO₂ emissions, aggregated by year.");

  const annotations = [
    {
      note: {
        title: "Industrial Growth",
        label: "Emissions began rising rapidly after 1950",
        align: "left"
      },
      x: x(1955),
      y: y(global.get(1955)),
      dx: -60,
      dy: -30
    }
  ];

  const makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  svg.append("g").call(makeAnnotations);
}

function scene1() {
  const latestYear = d3.max(data, d => d.year);
  const latest = data.filter(d => d.year === latestYear);
  const top10 = latest.sort((a, b) => b.co2 - a.co2).slice(0, 10);

  const x = d3.scaleBand()
    .domain(top10.map(d => d.country))
    .range([50, width - 50])
    .padding(0.2);
  const y = d3.scaleLinear()
    .domain([0, d3.max(top10, d => d.co2)])
    .range([height - 50, 120]); 

  svg.selectAll("rect")
    .data(top10)
    .enter()
    .append("rect")
    .attr("x", d => x(d.country))
    .attr("y", d => y(d.co2))
    .attr("width", x.bandwidth())
    .attr("height", d => height - 50 - y(d.co2))
    .attr("fill", "#3498db");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .text(`Top 10 CO₂ Emitters in ${latestYear}`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 55)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#666")
    .text("The top 10 countries by total CO₂ emissions in the most recent year available.");

  const annotations = [
    {
      note: {
        title: "Top Emitter",
        label: top10[0].country + " leads CO₂ emissions this year",
        align: "middle"
      },
      x: x(top10[0].country) + x.bandwidth() / 2,
      y: y(top10[0].co2),
      dx: 0,
      dy: -20
    }
  ];

  const makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  svg.append("g").call(makeAnnotations);
}

function scene2() {
  const countries = Array.from(new Set(data.map(d => d.country)));

  const dropdown = d3.select("#vis")
    .append("select")
    .on("change", function () {
      drawCountry(this.value);
    });

  dropdown.selectAll("option")
    .data(countries)
    .enter()
    .append("option")
    .text(d => d);

  drawCountry(countries[0]);
}

function drawCountry(country) {
  svg.selectAll("*").remove();
  const countryData = data.filter(d => d.country === country);

  const x = d3.scaleLinear().domain(d3.extent(countryData, d => d.year)).range([50, width - 50]);
  const y = d3.scaleLinear().domain([0, d3.max(countryData, d => d.co2)]).range([height - 50, 120]); 

  svg.append("path")
    .datum(countryData)
    .attr("fill", "none")
    .attr("stroke", "#2ecc71")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d.year))
      .y(d => y(d.co2)));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .text(`CO₂ Emissions for ${country}`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 55)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#666")
    .text("Explore annual CO₂ emissions for individual countries.");

  const peak = d3.max(countryData, d => d.co2);
  const peakYear = countryData.find(d => d.co2 === peak);

  const annotations = [
    {
      note: {
        title: "Peak Emission",
        label: `CO₂ peaked in ${peakYear.year}`,
        align: "middle"
      },
      x: x(peakYear.year),
      y: y(peakYear.co2),
      dx: 0,
      dy: -40
    }
  ];

  const makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  svg.append("g").call(makeAnnotations);
}

d3.select("#nextBtn").on("click", () => {
  if (currentScene < totalScenes - 1) {
    currentScene++;
    showScene(currentScene);
  }
});

d3.select("#prevBtn").on("click", () => {
  if (currentScene > 0) {
    currentScene--;
    showScene(currentScene);
  }
});
