// @flow

import { type State } from "./common";

const DPR = (window.devicePixelRatio: number) || 1;

export class Preview {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lastRenderedWidth: number;
  lastRenderedHeight: number;
  lastRenderedState: ?State;

  constructor() {
    this.lastRenderedWidth = 0;
    this.lastRenderedHeight = 0;

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  redraw(state: State, width: number, height: number) {
    const { canvas, ctx } = this;

    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const minX = state.primaryAxis.data[0];
    const maxX = state.primaryAxis.data[state.primaryAxis.data.length - 1];
    let minY: ?number;
    let maxY: ?number;

    state.lineAxes.forEach(axis => {
      axis.data.forEach(val => {
        if (minY == null || val < minY) {
          minY = val;
        }

        if (maxY == null || val > maxY) {
          maxY = val;
        }
      });
    });

    if (minY == null || maxY == null) return;

    const xScale = maxX - minX;
    const yScale = maxY - minY;

    for (let j = 0; j < state.lineAxes.length; ++j) {
      const axis = state.lineAxes[j];

      ctx.beginPath();

      for (let i = 0; i < axis.data.length; ++i) {
        const yValue = axis.data[i];
        const xValue = state.primaryAxis.data[i];
        const cx = canvas.width * ((xValue - minX) / xScale);
        const cy = canvas.height * (1 - (yValue - minY) / yScale);

        if (i === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }

      ctx.strokeStyle = axis.color;
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
      ctx.closePath();
    }
  }

  render(state: State, width: number, height: number) {
    if (
      !this.lastRenderedState ||
      this.lastRenderedWidth !== width ||
      this.lastRenderedHeight !== height ||
      this.lastRenderedState.lineAxes !== state.lineAxes ||
      this.lastRenderedState.primaryAxis !== state.primaryAxis
    ) {
      this.redraw(state, width, height);
      this.lastRenderedWidth = width;
      this.lastRenderedHeight = height;
      this.lastRenderedState = state;
    }
  }
}
