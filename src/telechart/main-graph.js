// @flow

import { Module, type State } from "./common";
import { type Store } from "./store";
import { getTimeTicks, getValueTicks } from "./ticks";

const DPR = (window.devicePixelRatio: number) || 1;

export class MainGraphModule extends Module {
  canvas: ?HTMLCanvasElement;
  container: ?HTMLDivElement;
  ctx: ?CanvasRenderingContext2D;

  didMount(store: Store<State>) {
    const state = store.getState();

    const container = document.createElement("div");
    container.style.height = state.mainHeight + "px";
    this.container = container;

    const rect = state.containerEl.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    this.canvas = canvas;
    this.ctx = ctx;

    container.appendChild(canvas);
    state.containerEl.appendChild(container);
  }

  willUnmount() {
    if (this.canvas) {
      this.canvas.remove();
    }
  }

  render(state: State) {
    const { ctx, canvas, container } = this;

    if (!ctx || !canvas || !container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * DPR;
    canvas.height = rect.height * DPR;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const first = state.primaryAxis.data[0];
    const last = state.primaryAxis.data[state.primaryAxis.data.length - 1];

    const length = state.primaryAxis.data.length - 1;
    const startIdx = Math.floor(length * state.slice.start);
    const endIdx = Math.ceil(length * state.slice.end);

    const minX = (last - first) * state.slice.start + first;
    const maxX = (last - first) * state.slice.end + first;
    const xScale = (last - first) * (state.slice.end - state.slice.start);

    let minY: ?number;
    let maxY: ?number;
    for (let i = startIdx; i <= endIdx; ++i) {
      for (let axis of state.lineAxes) {
        const value = axis.data[i];
        if (minY == null || value < minY) {
          minY = value;
        }
        if (maxY == null || value > maxY) {
          maxY = value;
        }
      }
    }
    if (minY == null || maxY == null) return;

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

    yTicksData.ticks.forEach(tick => {
      ctx.beginPath();
      const cy = yToScreen(tick.position);
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.strokeStyle = "#F0F0F0";
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
      ctx.closePath();
    });

    for (let j = 0; j < state.lineAxes.length; ++j) {
      const lineAxis = state.lineAxes[j];
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

    ctx.font = `${12 * DPR}px sans-serif`;
    ctx.fillStyle = "#C3C3C3";
    yTicksData.ticks.forEach(tick => {
      const cy = yToScreen(tick.position);
      ctx.fillText(tick.label, 0, cy - 3 * DPR);
    });

    timeTicks.forEach(tick => {
      const cy = canvas.height - paddingBottom + 14 * DPR;
      const cx = xToScreen(tick.position);
      ctx.fillText(tick.label, cx, cy);
    });
  }
}
