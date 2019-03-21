import { setGlobalConfig, createLineChart } from "./telechart/line";
import chartData from "./chart_data.json";

chartData.forEach(data => {
  const element = document.createElement("div");
  document.body.appendChild(element);

  const chart = createLineChart(element, {
    columns: data.columns,
    types: data.types,
    names: data.names,
    colors: data.colors
  });

  window.addEventListener("resize", () => chart.redraw());
});
