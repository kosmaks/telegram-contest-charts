// @flow

import { AnimatedValue, FadingGroup } from "./animated-value";
import { type LineAxis, type PrimaryAxis } from "./common";
import { type Tick } from "./ticks";

const DPR = (window.devicePixelRatio: number) || 1;

interface Fading {
  opacity: number;
  appearing: boolean;
}

interface StaticFrame {
  primaryAxis: PrimaryAxis;
  startIdx: number;
  endIdx: number;

  minX: number;
  xScale: number;

  darkTheme: boolean;
  paddingTop: number;
  paddingBottom: number;
  hover: ?{ idx: number };
}

export interface Frame extends StaticFrame {
  lineAxes: LineAxis[];

  yTicks: Tick[];
  timeTicks: Tick[];

  minY: number;
  yScale: number;
}

const ANIMATION_DURATION = 100;
const LONG_ANIMATION_DURATION = 300;

export class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  lastTimestamp: number;
  renderTime: number;
  currentFrame: StaticFrame;
  minY: AnimatedValue;
  yScale: AnimatedValue;
  lineAxes: FadingGroup<LineAxis>;
  yTicks: FadingGroup<Tick>;
  timeTicks: FadingGroup<Tick>;

  wrapRenderLoop: (timestamp: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.wrapRenderLoop = this.renderLoop.bind(this);
    this.currentFrame = {
      primaryAxis: { data: [] },
      startIdx: 0,
      endIdx: 0,

      minX: -1,
      xScale: 1,

      darkTheme: false,
      paddingTop: 0,
      paddingBottom: 0,
      hover: undefined
    };

    this.minY = new AnimatedValue(0);
    this.yScale = new AnimatedValue(0);
    this.lineAxes = new FadingGroup(x => x.id);
    this.yTicks = new FadingGroup(x => x.id);
    this.timeTicks = new FadingGroup(x => x.id);

    this.renderTime = 1;
    this.lastTimestamp = 0;
    this.wrapRenderLoop(0);
  }

  xToScreen(val: number) {
    return (
      (this.canvas.width * (val - this.currentFrame.minX)) /
      this.currentFrame.xScale
    );
  }

  yToScreen(val: number) {
    const { currentFrame: frame, canvas } = this;
    return (
      (1 - (val - this.minY.get()) / this.yScale.get()) *
        (canvas.height - frame.paddingTop * DPR - frame.paddingBottom * DPR) +
      frame.paddingTop * DPR
    );
  }

  renderYLines() {
    const { currentFrame: frame, canvas, ctx } = this;
    this.yTicks.forEach((tick, fading) => {
      ctx.beginPath();
      const cy = this.yToScreen(tick.position);
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.globalAlpha = fading.opacity * (frame.darkTheme ? 0.05 : 1);
      ctx.strokeStyle = frame.darkTheme ? "#FFFFFF" : "#F0F0F0";
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
      ctx.closePath();
      ctx.globalAlpha = 1;
    });
  }

  renderLineAxes() {
    const { currentFrame: frame, canvas, ctx } = this;

    for (let j = 0; j < this.lineAxes.allValues.length; ++j) {
      const lineAxis = this.lineAxes.allValues[j];
      ctx.beginPath();

      for (let i = frame.startIdx; i <= frame.endIdx; ++i) {
        const xValue = frame.primaryAxis.data[i];
        const cx = this.xToScreen(xValue);

        const yValue = lineAxis.data[i];
        const cy = this.yToScreen(yValue);

        if (i === frame.startIdx) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }

      ctx.globalAlpha = this.lineAxes.getFading(j).opacity;
      ctx.strokeStyle = lineAxis.color;
      ctx.lineWidth = 2 * DPR;
      ctx.stroke();
      ctx.closePath();
      ctx.globalAlpha = 1;
    }
  }

  renderHover() {
    const { currentFrame: frame, canvas, ctx } = this;
    const idx = frame.hover ? frame.hover.idx : null;

    if (idx == null) {
      return;
    }

    const cx = this.xToScreen(frame.primaryAxis.data[idx]);
    ctx.beginPath();
    ctx.moveTo(cx, frame.paddingTop * DPR);
    ctx.lineTo(
      cx,
      canvas.height - (frame.paddingBottom + frame.paddingTop) * DPR
    );
    ctx.globalAlpha = frame.darkTheme ? 0.1 : 1;
    ctx.strokeStyle = frame.darkTheme ? "#FFFFFF" : "#F0F0F0";
    ctx.lineWidth = DPR;
    ctx.stroke();
    ctx.closePath();
    ctx.globalAlpha = 1;

    for (let j = 0; j < this.lineAxes.allValues.length; ++j) {
      const lineAxis = this.lineAxes.allValues[j];
      if (lineAxis.hidden) continue;

      const cx = this.xToScreen(frame.primaryAxis.data[idx]);
      const cy = this.yToScreen(lineAxis.data[idx]);

      ctx.beginPath();
      ctx.globalAlpha = this.lineAxes.getFading(j).opacity;
      ctx.clearRect(cx - 3 * DPR, cy - 3 * DPR, 6 * DPR, 6 * DPR);
      ctx.arc(cx, cy, 3 * DPR, 0, 2 * Math.PI);
      ctx.strokeStyle = lineAxis.color;
      ctx.lineWidth = 2 * DPR;
      ctx.stroke();
      ctx.closePath();
    }

    ctx.globalAlpha = 1;
  }

  renderYLabels() {
    const { currentFrame: frame, canvas, ctx } = this;

    ctx.font = `${12 * DPR}px sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = frame.darkTheme ? "#FFFFFF" : "#C3C3C3";
    this.yTicks.forEach((tick, fading) => {
      const cy = this.yToScreen(tick.position);
      ctx.globalAlpha = (frame.darkTheme ? 0.15 : 1) * fading.opacity;
      ctx.fillText(tick.label, 0, cy - 3 * DPR);
    });
    ctx.globalAlpha = 1;
  }

  renderXLabels() {
    const { currentFrame: frame, canvas, ctx } = this;

    ctx.font = `${12 * DPR}px sans-serif`;
    ctx.textAlign = "center";
    this.timeTicks.forEach((tick, fading) => {
      const cy = canvas.height - frame.paddingBottom * DPR + 14 * DPR;
      const cx = this.xToScreen(tick.position);
      ctx.globalAlpha = (frame.darkTheme ? 0.15 : 1) * fading.opacity;
      ctx.fillText(tick.label, cx, cy);
    });
    ctx.globalAlpha = 1;
  }

  renderFade() {
    const { currentFrame: frame, canvas, ctx } = this;

    ctx.globalCompositeOperation = "destination-in";

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "transparent");
    grad.addColorStop((frame.paddingTop * DPR) / canvas.height, "#FFF");
    grad.addColorStop(1, "#FFF");

    ctx.fillStyle = grad;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "source-over";
  }

  renderFrame() {
    const { canvas, ctx } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.renderYLines();
    this.renderLineAxes();
    this.renderHover();
    this.renderYLabels();
    this.renderXLabels();
    this.renderFade();
  }

  renderLoop(timestamp: number) {
    const diff = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    const { currentFrame: frame, renderTime } = this;

    if (renderTime > 0) {
      const step = diff / ANIMATION_DURATION;
      const longStep = diff / LONG_ANIMATION_DURATION;
      this.minY.step(step);
      this.yScale.step(step);
      this.lineAxes.step(step);
      this.yTicks.step(step);
      this.timeTicks.step(longStep);

      this.renderFrame();
      this.renderTime -= diff;
    }

    requestAnimationFrame(this.wrapRenderLoop);
  }

  animateTo(frame: Frame) {
    this.minY.setTarget(frame.minY);
    this.yScale.setTarget(frame.yScale);
    this.lineAxes.putValues(frame.lineAxes.filter(x => !x.hidden));
    this.yTicks.putValues(frame.yTicks);
    this.timeTicks.putValues(frame.timeTicks);
    this.currentFrame = frame;
    this.renderTime = LONG_ANIMATION_DURATION;
  }
}
