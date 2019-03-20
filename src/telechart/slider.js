// @flow

import "./styles.css";

import { Module, type State } from "./common";
import { Preview } from "./preview";
import { type Store } from "./store";
import { SvgPreview } from "./svg-preview";

interface SliceSnapshot {
  start: number;
  end: number;
  mouseX: number;
}

export class SliderModule extends Module {
  elements: ?{
    container: HTMLDivElement,
    leftCover: HTMLDivElement,
    rightCover: HTMLDivElement,
    sliderWindow: HTMLDivElement,
    leftHandle: HTMLDivElement,
    rightHandle: HTMLDivElement,
    preview: Preview
  };

  handleMouseMove: (ev: MouseEvent) => void;
  handleMouseUp: (ev: MouseEvent) => void;

  didMount(store: Store<State>) {
    const state = store.getState();

    const container = document.createElement("div");
    container.className = "tc-slider";

    const preview = new Preview();
    container.appendChild(preview.canvas);

    const leftCover = document.createElement("div");
    leftCover.className = "tc-slider-cover";
    leftCover.style.left = "0";
    container.appendChild(leftCover);

    const rightCover = document.createElement("div");
    rightCover.className = "tc-slider-cover";
    rightCover.style.right = "0";
    container.appendChild(rightCover);

    const sliderWindow = document.createElement("div");
    sliderWindow.className = "tc-slider-window";
    container.appendChild(sliderWindow);
    sliderWindow.addEventListener("mousedown", (e: MouseEvent) =>
      this.onWindowMouseDown(store, e)
    );

    const leftHandle = document.createElement("div");
    leftHandle.className = "tc-slider-handle";
    container.appendChild(leftHandle);
    leftHandle.addEventListener("mousedown", (e: MouseEvent) =>
      this.onLeftMouseDown(store, e)
    );

    const rightHandle = document.createElement("div");
    rightHandle.className = "tc-slider-handle";
    container.appendChild(rightHandle);
    rightHandle.addEventListener("mousedown", (e: MouseEvent) =>
      this.onRightMouseDown(store, e)
    );

    this.handleMouseUp = this.onMouseUp.bind(this);
    this.handleMouseMove = (ev: MouseEvent) => this.onMouseMove(store, ev);
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);

    this.elements = {
      container,
      leftCover,
      rightCover,
      sliderWindow,
      leftHandle,
      rightHandle,
      preview
    };

    state.containerEl.appendChild(container);
  }

  willUnmount() {
    if (this.elements) {
      this.elements.container.remove();
    }
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  getSliceSnapshot(store: Store<State>, ev: MouseEvent): SliceSnapshot {
    const state = store.getState();
    return {
      start: state.slice.start,
      end: state.slice.end,
      mouseX: ev.clientX
    };
  }

  windowSliceSnapshot: ?SliceSnapshot;
  onWindowMouseDown(store: Store<State>, ev: MouseEvent) {
    this.windowSliceSnapshot = this.getSliceSnapshot(store, ev);
  }

  leftSliceSnapshot: ?SliceSnapshot;
  onLeftMouseDown(store: Store<State>, ev: MouseEvent) {
    this.leftSliceSnapshot = this.getSliceSnapshot(store, ev);
  }

  rightSliceSnapshot: ?SliceSnapshot;
  onRightMouseDown(store: Store<State>, ev: MouseEvent) {
    this.rightSliceSnapshot = this.getSliceSnapshot(store, ev);
  }

  onMouseMove(store: Store<State>, ev: MouseEvent) {
    const {
      elements,
      windowSliceSnapshot,
      leftSliceSnapshot,
      rightSliceSnapshot
    } = this;
    if (!elements) return;

    if (windowSliceSnapshot) {
      const rect = elements.container.getBoundingClientRect();
      const oldX = (windowSliceSnapshot.mouseX - rect.left) / rect.width;
      const newX = (ev.clientX - rect.left) / rect.width;
      const diff = newX - oldX;
      let newStart = windowSliceSnapshot.start + diff;
      let newEnd = windowSliceSnapshot.end + diff;

      if (newStart > 1 || newEnd < 0) {
        return;
      }

      if (newStart < 0) {
        newStart = 0;
        newEnd = windowSliceSnapshot.end - windowSliceSnapshot.start;
      }

      if (newEnd > 1) {
        newEnd = 1;
        newStart = 1 - (windowSliceSnapshot.end - windowSliceSnapshot.start);
      }

      const state = store.getState();
      store.putState(
        Object.assign({}, state, { slice: { start: newStart, end: newEnd } })
      );
    }

    if (leftSliceSnapshot) {
      const rect = elements.container.getBoundingClientRect();
      const oldX = (leftSliceSnapshot.mouseX - rect.left) / rect.width;
      const newX = (ev.clientX - rect.left) / rect.width;
      const diff = newX - oldX;
      let newStart = Math.max(0, leftSliceSnapshot.start + diff);

      if (leftSliceSnapshot.end - newStart < 0.1) {
        newStart = leftSliceSnapshot.end - 0.1;
      }

      const state = store.getState();
      store.putState(
        Object.assign({}, state, {
          slice: { start: newStart, end: leftSliceSnapshot.end }
        })
      );
    }

    if (rightSliceSnapshot) {
      const rect = elements.container.getBoundingClientRect();
      const oldX = (rightSliceSnapshot.mouseX - rect.left) / rect.width;
      const newX = (ev.clientX - rect.left) / rect.width;
      const diff = newX - oldX;
      let newEnd = Math.min(1, rightSliceSnapshot.end + diff);

      if (newEnd - rightSliceSnapshot.start < 0.1) {
        newEnd = rightSliceSnapshot.start + 0.1;
      }

      const state = store.getState();
      store.putState(
        Object.assign({}, state, {
          slice: { start: rightSliceSnapshot.start, end: newEnd }
        })
      );
    }
  }

  onMouseUp(ev: MouseEvent) {
    this.windowSliceSnapshot = undefined;
    this.leftSliceSnapshot = undefined;
    this.rightSliceSnapshot = undefined;
  }

  render(state: State) {
    const { elements } = this;

    if (!elements) {
      return;
    }

    const rect = elements.container.getBoundingClientRect();
    elements.preview.render(state, rect.width, rect.height);

    const leftPercent = (state.slice.start * 100).toFixed(1) + "%";
    const rightPercent = (state.slice.end * 100).toFixed(1) + "%";
    const invRightPercent = ((1 - state.slice.end) * 100).toFixed(1) + "%";
    const width =
      ((state.slice.end - state.slice.start) * 100).toFixed(1) + "%";

    elements.leftCover.style.width = leftPercent;
    elements.rightCover.style.width = invRightPercent;
    elements.sliderWindow.style.left = leftPercent;
    elements.sliderWindow.style.width = width;
    elements.leftHandle.style.left = leftPercent;
    elements.rightHandle.style.left = rightPercent;
  }
}
