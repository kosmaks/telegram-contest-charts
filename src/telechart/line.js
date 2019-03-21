// @flow

import { MainGraphModule } from "./main-graph";
import { Module, type State, type PrimaryAxis, type LineAxis } from "./common";
import { SliderModule } from "./slider";
import { createStore } from "./store";

type Container = string | HTMLElement;

interface Options {
  columns?: mixed;
  types?: mixed;
  names?: mixed;
  colors?: mixed;
}

interface ChartAPI {
  remove: () => void;
  redraw: () => void;
}

const TYPE_PRIMARY: "x" = "x";

export const createLineChart = (
  container: Container,
  options: Options = {}
): ChartAPI => {
  const containerEl =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!containerEl) {
    throw new Error("Container not found");
  }

  const columns = Array.isArray(options.columns) ? options.columns : [];
  const types =
    options.types && typeof options.types === "object" ? options.types : {};
  const names =
    options.names && typeof options.names === "object" ? options.names : {};
  const colors =
    options.colors && typeof options.colors === "object" ? options.colors : {};

  // Note on `any`: we don't want to verify whole data array anyways.
  const axisNames: string[] = columns.map(x => (x: any)[0]);
  const primaryIdx = axisNames.indexOf("x");
  if (primaryIdx < 0) {
    throw new Error("There must be at least one X axis");
  }

  const primaryAxis: PrimaryAxis = {
    data: (columns[primaryIdx]: any).slice(1)
  };

  const lineAxes: LineAxis[] = [];

  axisNames.forEach((id, i) => {
    if (i === primaryIdx) {
      return;
    }

    const data = (columns[i]: any).slice(1);
    const name = names[id] || "line";
    const color = colors[id] || "red";

    lineAxes.push({
      data,
      name: typeof name === "string" ? name : "",
      color: typeof color === "string" ? color : "",
      hidden: false
    });
  });

  const modules: Module[] = [new MainGraphModule(), new SliderModule()];

  const store = createStore(
    ({
      mainHeight: 300,
      containerEl,
      lineAxes,
      primaryAxis,
      slice: {
        start: 0.4,
        end: 0.8
      }
    }: State),
    prevState => {
      modules.forEach(module => {
        if (module.shouldUpdate(store, prevState)) {
          module.render(store.getState());
        }
      });
    }
  );

  modules.forEach(module => {
    module.didMount(store);
  });

  const redraw = () => {
    requestAnimationFrame(() => {
      modules.forEach(module => {
        module.render(store.getState());
      });
    });
  };

  redraw();

  return {
    remove: () => {
      modules.forEach(module => {
        module.willUnmount();
      });
    },
    redraw
  };
};
