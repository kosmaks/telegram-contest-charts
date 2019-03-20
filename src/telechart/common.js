// @flow

import type { Store } from "./store";

export interface PrimaryAxis {
  data: number[];
}

export interface LineAxis {
  data: number[];
  name: string;
  color: string;
  hidden: boolean;
}

export interface State {
  containerEl: HTMLElement;
  lineAxes: LineAxis[];
  primaryAxis: PrimaryAxis;
  slice: {
    start: number,
    end: number
  };
}

export class Module {
  didMount(store: Store<State>) {}

  shouldUpdate(store: Store<State>, prevState: State): boolean {
    return true;
  }

  willUnmount() {}

  render(state: State) {}
}
