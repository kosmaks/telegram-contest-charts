import "./demo.css";
import "@babel/polyfill";

import { createLineChart } from "./telechart/line";
import chartData from "./chart_data.json";

const container = document.getElementById("container");

const charts = chartData.map((data, i) => {
  const element = document.createElement("div");
  element.className = "chart";
  container.appendChild(element);

  const chart = createLineChart(element, {
    name: `Graph ${i + 1}`,
    columns: data.columns,
    types: data.types,
    names: data.names,
    colors: data.colors
  });

  window.addEventListener("resize", () => chart.redraw());

  return chart;
});

const modeLink = document.getElementById("mode-link");
modeLink.innerHTML = "Switch to Night Mode";

const setDarkTheme = () => {
  charts.forEach(chart => chart.setDarkTheme(true));
  document.body.className = "dark";
  modeLink.innerHTML = "Switch to Day Mode";
};

const setLightTheme = () => {
  charts.forEach(chart => chart.setDarkTheme(false));
  document.body.className = "";
  modeLink.innerHTML = "Switch to Night Mode";
};

const isDarkTheme = () => document.body.className === "dark";

modeLink.addEventListener("click", () => {
  if (isDarkTheme()) {
    setLightTheme();
  } else {
    setDarkTheme();
  }
});
