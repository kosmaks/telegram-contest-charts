// @flow

import { Module, type State, getMaxX, getMinX, getXScale } from "./common";
import { Popup } from "./popup";
import { type Store } from "./store";
import { clamp, findClosestIdx } from "./helpers";
import { getTimeTicks, getValueTicks } from "./ticks";

const DPR = (window.devicePixelRatio: number) || 1;

export class MainGraphModule extends Module {
  canvas: ?HTMLCanvasElement;
  container: ?HTMLDivElement;
  ctx: ?CanvasRenderingContext2D;
  popup: ?Popup;

  didMount(store: Store<State>) {
    const state = store.getState();

    const container = document.createElement("div");
    container.style.height = state.mainHeight + "px";
    this.container = container;
    this.container.className = "tc-main-graph";

    const rect = state.containerEl.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    this.canvas = canvas;
    this.ctx = ctx;
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
    const { ctx, canvas, container, popup } = this;

    if (!ctx || !canvas || !container || !popup) {
      return;
    }

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * DPR;
    canvas.height = rect.height * DPR;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const timeTicks = getTimeTicks({
      min: minX,
      max: maxX,
      width: canvas.width / DPR
    });

    const paddingTop = 20 * DPR;
    const paddingBottom = 20 * DPR;

    const xToScreen = (val: number) => (canvas.width * (val - minX)) / xScale;
    const yToScreen = (val: number) =>
      (1 - (val - yTicksData.min) / yScale) *
      (canvas.height - paddingTop - paddingBottom + paddingTop);

    popup.render(state, container);

    yTicksData.ticks.forEach(tick => {
      ctx.beginPath();
      const cy = yToScreen(tick.position);
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.globalAlpha = state.darkTheme ? 0.05 : 1;
      ctx.strokeStyle = state.darkTheme ? "#FFFFFF" : "#F0F0F0";
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
      ctx.closePath();
      ctx.globalAlpha = 1;
    });

    for (let j = 0; j < state.lineAxes.length; ++j) {
      const lineAxis = state.lineAxes[j];
      if (lineAxis.hidden) continue;
      ctx.beginPath();

      for (let i = startIdx; i <= endIdx; ++i) {
        const xValue = state.primaryAxis.data[i];
        const cx = xToScreen(xValue);

        const yValue = lineAxis.data[i];
        const cy = yToScreen(yValue);

        if (i === startIdx) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }

      ctx.strokeStyle = lineAxis.color;
      ctx.lineWidth = 2 * DPR;
      ctx.stroke();
      ctx.closePath();
    }

    if (state.hover) {
      const idx = state.hover.idx;

      for (let j = 0; j < state.lineAxes.length; ++j) {
        const lineAxis = state.lineAxes[j];
        if (lineAxis.hidden) continue;
        const cx = xToScreen(state.primaryAxis.data[idx]);

        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, canvas.height);
        ctx.globalAlpha = state.darkTheme ? 0.1 : 1;
        ctx.strokeStyle = state.darkTheme ? "#FFFFFF" : "#F0F0F0";
        ctx.lineWidth = DPR;
        ctx.stroke();
        ctx.closePath();
        ctx.globalAlpha = 1;
      }

      for (let j = 0; j < state.lineAxes.length; ++j) {
        const lineAxis = state.lineAxes[j];
        if (lineAxis.hidden) continue;
        const cx = xToScreen(state.primaryAxis.data[idx]);
        const cy = yToScreen(lineAxis.data[idx]);

        ctx.beginPath();
        ctx.clearRect(cx - 3 * DPR, cy - 3 * DPR, 6 * DPR, 6 * DPR);
        ctx.arc(cx, cy, 3 * DPR, 0, 2 * Math.PI);
        ctx.strokeStyle = lineAxis.color;
        ctx.lineWidth = 2 * DPR;
        ctx.stroke();
        ctx.closePath();
      }
    }

    ctx.font = `${12 * DPR}px sans-serif`;
    ctx.textAlign = "left";
    ctx.globalAlpha = state.darkTheme ? 0.15 : 1;
    ctx.fillStyle = state.darkTheme ? "#FFFFFF" : "#C3C3C3";
    yTicksData.ticks.forEach(tick => {
      const cy = yToScreen(tick.position);
      ctx.fillText(tick.label, 0, cy - 3 * DPR);
    });

    ctx.textAlign = "center";
    timeTicks.forEach(tick => {
      const cy = canvas.height - paddingBottom + 14 * DPR;
      const cx = xToScreen(tick.position);
      ctx.fillText(tick.label, cx, cy);
    });
    ctx.globalAlpha = 1;
  }
}
