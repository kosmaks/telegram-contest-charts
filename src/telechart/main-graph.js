// @flow

import { Module, type State } from "./common";
import { type Store } from "./store";

const DPR = (window.devicePixelRatio: number) || 1;

export class MainGraphModule extends Module {
  canvas: ?HTMLCanvasElement;
  ctx: ?CanvasRenderingContext2D;

  resizeHandler: () => void;

  didMount(store: Store<State>) {
    const state = store.getState();

    const rect = state.containerEl.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = rect.width * DPR;
    canvas.height = rect.height * DPR;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    this.canvas = canvas;
    this.ctx = ctx;
    state.containerEl.appendChild(canvas);

    this.resizeHandler = () => {
      const updatedRect = store.getState().containerEl.getBoundingClientRect();
      canvas.width = updatedRect.width * DPR;
      canvas.height = updatedRect.height * DPR;
      canvas.style.width = `${updatedRect.width}px`;
      canvas.style.height = `${updatedRect.height}px`;
    };

    window.addEventListener("resize", this.resizeHandler);
  }

  willUnmount() {
    if (this.canvas) {
      this.canvas.remove();
    }

    window.removeEventListener("resize", this.resizeHandler);
  }

  render(state: State) {
    const { ctx, canvas } = this;

    if (!ctx || !canvas) {
      return;
    }

    const first = state.primaryAxis.data[0];
    const last = state.primaryAxis.data[state.primaryAxis.data.length - 1];

    const length = state.primaryAxis.data.length - 1;
    const startIdx = Math.floor(length * state.slice.start);
    const endIdx = Math.ceil(length * state.slice.end);

    const minX = (last - first) * state.slice.start + first;
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
    const yScale = maxY - minY;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paddingTop = 20;
    const paddingBottom = 20;

    for (let j = 0; j < state.lineAxes.length; ++j) {
      const lineAxis = state.lineAxes[j];
      ctx.beginPath();

      for (let i = startIdx; i <= endIdx; ++i) {
        const xValue = state.primaryAxis.data[i];
        const x = (xValue - minX) / xScale;
        const cx = x * canvas.width;

        const yValue = lineAxis.data[i];
        const y = (yValue - minY) / yScale;
        const cy =
          (1 - y) * (canvas.height - paddingTop - paddingBottom) + paddingTop;

        if (i === startIdx) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }

      ctx.strokeStyle = lineAxis.color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
    }
  }
}
