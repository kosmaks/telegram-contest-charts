// @flow

import { AnimatedValue, FadingGroup } from "./animated-value";
import { type LineAxis, type State } from "./common";

const DPR = (window.devicePixelRatio: number) || 1;

const ANIMATION_DURATION = 100;

export class Preview {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lastRenderedWidth: number;
  lastRenderedHeight: number;
  lastRenderedState: ?State;

  lineAxes: FadingGroup<LineAxis>;
  minY: AnimatedValue;
  yScale: AnimatedValue;
  frame: ?{ state: State, width: number, height: number };

  lastTimestamp: number;
  renderTime: number;

  wrapRenderLoop: (timestamp: number) => void;

  constructor() {
    this.wrapRenderLoop = this.renderLoop.bind(this);
    this.lastTimestamp = 0;
    this.renderTime = 0;
    this.lastRenderedWidth = 0;
    this.lastRenderedHeight = 0;

    this.lineAxes = new FadingGroup(x => x.id);
    this.minY = new AnimatedValue(0);
    this.yScale = new AnimatedValue(0);

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.renderLoop(0);
  }

  updateAnimatedValues(state: State) {
    let minY: ?number;
    let maxY: ?number;

    state.lineAxes.forEach(axis => {
      if (axis.hidden) return;
      axis.data.forEach(val => {
        if (minY == null || val < minY) {
          minY = val;
        }

        if (maxY == null || val > maxY) {
          maxY = val;
        }
      });
    });

    if (minY == null || maxY == null) {
      minY = 0;
      maxY = 0;
    }

    const yScale = maxY - minY;

    this.minY.setTarget(minY);
    this.yScale.setTarget(yScale);
  }

  renderFrame(state: State, width: number, height: number) {
    const { canvas, ctx } = this;

    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const minX = state.primaryAxis.data[0];
    const maxX = state.primaryAxis.data[state.primaryAxis.data.length - 1];
    const xScale = maxX - minX;

    const minY = this.minY.get();
    const yScale = this.yScale.get();

    const padding = 5 * DPR;

    for (let j = 0; j < this.lineAxes.allValues.length; ++j) {
      const axis = this.lineAxes.allValues[j];

      ctx.beginPath();

      for (let i = 0; i < axis.data.length; ++i) {
        const yValue = axis.data[i];
        const xValue = state.primaryAxis.data[i];
        const cx = canvas.width * ((xValue - minX) / xScale);
        const cy =
          (canvas.height - padding) * (1 - (yValue - minY) / yScale) + padding;

        if (i === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }

      ctx.globalAlpha = this.lineAxes.getFading(j).opacity;
      ctx.strokeStyle = axis.color;
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
      ctx.closePath();
      ctx.globalAlpha = 1;
    }
  }

  renderLoop(timestamp: number) {
    const { frame } = this;

    if (frame) {
      const diff = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;
      if (this.renderTime > 0) {
        const step = diff / ANIMATION_DURATION;
        this.minY.step(step);
        this.yScale.step(step);
        this.lineAxes.step(step);
        this.renderFrame(frame.state, frame.width, frame.height);
        this.renderTime -= diff;
      }
    }

    requestAnimationFrame(this.wrapRenderLoop);
  }

  render(state: State, width: number, height: number) {
    if (
      !this.lastRenderedState ||
      this.lastRenderedWidth !== width ||
      this.lastRenderedHeight !== height ||
      this.lastRenderedState.lineAxes !== state.lineAxes ||
      this.lastRenderedState.primaryAxis !== state.primaryAxis
    ) {
      this.frame = { state, width, height };
      this.lineAxes.putValues(state.lineAxes.filter(x => !x.hidden));
      this.updateAnimatedValues(state);
      this.renderTime = ANIMATION_DURATION;

      this.lastRenderedWidth = width;
      this.lastRenderedHeight = height;
      this.lastRenderedState = state;
    }
  }
}
