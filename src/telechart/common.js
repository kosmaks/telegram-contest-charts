// @flow

import type { Store } from "./store";

export interface PrimaryAxis {
  data: number[];
}

export interface LineAxis {
  id: string;
  data: number[];
  name: string;
  color: string;
  hidden: boolean;
}

export interface State {
  name: string;
  mainHeight: number;
  containerEl: HTMLElement;
  lineAxes: LineAxis[];
  primaryAxis: PrimaryAxis;
  slice: {
    start: number,
    end: number
  };
  hover: ?{ idx: number };
  darkTheme: boolean;
}

export class Module {
  didMount(store: Store<State>) {}

  shouldUpdate(store: Store<State>, prevState: State): boolean {
    return true;
  }

  willUnmount() {}

  render(state: State) {}
}

export const getMinX = (state: State) => {
  const first = state.primaryAxis.data[0];
  const last = state.primaryAxis.data[state.primaryAxis.data.length - 1];
  return (last - first) * state.slice.start + first;
};

export const getMaxX = (state: State) => {
  const first = state.primaryAxis.data[0];
  const last = state.primaryAxis.data[state.primaryAxis.data.length - 1];
  return (last - first) * state.slice.end + first;
};

export const getXScale = (state: State) => {
  const first = state.primaryAxis.data[0];
  const last = state.primaryAxis.data[state.primaryAxis.data.length - 1];
  return (last - first) * (state.slice.end - state.slice.start);
};
