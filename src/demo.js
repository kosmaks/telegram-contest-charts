import { setGlobalConfig, createLineChart } from "./telechart/line";
import chartData from "./chart_data.json";

chartData.forEach(data => {
  const element = document.createElement("div");
  document.body.appendChild(element);

  const chart = createLineChart(element, {
    columns: data.columns,
    // columns: data.columns.map(x =>
    //   x
    //     .slice(0, Math.round(x.length * 0.3))
    //     .concat(x.slice(Math.round(x.length * 0.7), -1))
    // ),
    types: data.types,
    names: data.names,
    colors: data.colors
  });

  window.addEventListener("resize", () => chart.redraw());
});
