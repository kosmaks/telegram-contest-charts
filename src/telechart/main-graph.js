// @flow

import { CanvasRenderer, type Frame } from "./canvas-renderer";
import { Module, type State, getMaxX, getMinX, getXScale } from "./common";
import { Popup } from "./popup";
import { type Store } from "./store";
import { clamp, findClosestIdx } from "./helpers";
import { getTimeTicks, getValueTicks } from "./ticks";

const DPR = (window.devicePixelRatio: number) || 1;

export class MainGraphModule extends Module {
  canvas: ?HTMLCanvasElement;
  container: ?HTMLDivElement;
  popup: ?Popup;
  renderer: ?CanvasRenderer;

  lastWidth: ?number;
  lastHeight: ?number;

  didMount(store: Store<State>) {
    const state = store.getState();

    this.lastWidth = 0;
    this.lastHeight = 0;

    const container = document.createElement("div");
    container.style.height = state.mainHeight + "px";
    this.container = container;
    this.container.className = "tc-main-graph";

    const rect = state.containerEl.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    this.canvas = canvas;
    canvas.addEventListener("mousemove", (e: MouseEvent) =>
      this.onMouseMove(store, e)
    );
    canvas.addEventListener("touchstart", (e: TouchEvent) =>
      this.onMouseMove(store, e)
    );
    canvas.addEventListener("touchmove", (e: TouchEvent) =>
      this.onMouseMove(store, e)
    );
    canvas.addEventListener("touchend", (e: TouchEvent) =>
      this.onMouseLeave(store, e)
    );
    canvas.addEventListener("mouseleave", (e: MouseEvent) =>
      this.onMouseLeave(store, e)
    );
    container.appendChild(canvas);
    state.containerEl.appendChild(container);

    this.popup = new Popup();
    container.appendChild(this.popup.popup);

    this.renderer = new CanvasRenderer(canvas);
  }

  willUnmount() {
    if (this.canvas) {
      this.canvas.remove();
    }
  }

  onMouseMove(store: Store<State>, ev: MouseEvent | TouchEvent) {
    const { canvas } = this;
    if (!canvas) return;
    const state = store.getState();

    if (
      ev instanceof TouchEvent &&
      (ev.touches.length <= 0 || !ev.cancelable)
    ) {
      return;
    }

    const x = ev instanceof TouchEvent ? ev.touches[0].clientX : ev.clientX;

    const rect = canvas.getBoundingClientRect();

    const percX = clamp((x - rect.left) / rect.width);

    const minX = getMinX(state);
    const maxX = getMaxX(state);
    const value = percX * (maxX - minX) + minX;

    const length = state.primaryAxis.data.length - 1;
    const startIdx = Math.floor(length * state.slice.start);
    const endIdx = Math.ceil(length * state.slice.end);

    const closestIdx = findClosestIdx(
      state.primaryAxis.data,
      value,
      startIdx,
      endIdx
    );

    if (closestIdx >= 0 && (!state.hover || state.hover.idx !== closestIdx)) {
      store.putState(Object.assign({}, state, { hover: { idx: closestIdx } }));
    }
  }

  onMouseLeave(store: Store<State>, ev: MouseEvent | TouchEvent) {
    if (ev.cancelable) {
      ev.preventDefault();
    }
    store.putState(Object.assign({}, store.getState(), { hover: undefined }));
  }

  render(state: State) {
    const { renderer, canvas, container, popup } = this;

    if (!canvas || !container || !popup || !renderer) {
      return;
    }

    popup.render(state, container);

    const rect = container.getBoundingClientRect();
    if (rect.width !== this.lastWidth || rect.height !== this.lastHeight) {
      canvas.width = rect.width * DPR;
      canvas.height = rect.height * DPR;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      this.lastWidth = rect.width;
      this.lastHeight = rect.height;
    }

    const length = state.primaryAxis.data.length - 1;
    const startIdx = Math.floor(length * state.slice.start);
    const endIdx = Math.ceil(length * state.slice.end);

    const minX = getMinX(state);
    const maxX = getMaxX(state);
    const xScale = getXScale(state);

    let minY: ?number;
    let maxY: ?number;
    for (let i = startIdx; i <= endIdx; ++i) {
      for (let axis of state.lineAxes) {
        if (axis.hidden) continue;

        const value = axis.data[i];
        if (minY == null || value < minY) {
          minY = value;
        }
        if (maxY == null || value > maxY) {
          maxY = value;
        }
      }
    }

    if (minY == null || maxY == null) {
      minY = 0;
      maxY = 0;
    }

    const yTicksData = getValueTicks({
      min: minY,
      max: maxY,
      ticks: 6
    });

    const yScale = yTicksData.max - yTicksData.min;

    const timeTicks = getTimeTicks({
      min: minX,
      max: maxX,
      width: canvas.width / DPR
    });

    const frame: Frame = {
      primaryAxis: state.primaryAxis,
      lineAxes: state.lineAxes,
      startIdx,
      endIdx,

      yTicks: yTicksData.ticks,
      timeTicks: timeTicks,

      minX,
      xScale,
      minY: yTicksData.min,
      yScale,

      darkTheme: state.darkTheme,
      paddingTop: 20,
      paddingBottom: 20,

      hover: state.hover
    };

    renderer.animateTo(frame);
  }
}
