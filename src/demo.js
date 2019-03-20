import { setGlobalConfig, createLineChart } from "./telechart/line";
import chartData from "./chart_data.json";

createLineChart(document.getElementById("mychart"), {
  columns: chartData[0].columns,
  types: chartData[0].types,
  names: chartData[0].names,
  colors: chartData[0].colors
});
