// @flow

import { type State } from "./common";
import { clamp } from "./helpers";
import { formatPreviewDate } from "./date";

export class Popup {
  popup: HTMLDivElement;
  date: HTMLDivElement;
  values: HTMLDivElement;

  constructor() {
    this.popup = document.createElement("div");
    this.popup.className = "tc-popup";
    this.popup.style.display = "none";

    this.date = document.createElement("div");
    this.date.className = "tc-popup-date";
    this.popup.appendChild(this.date);

    this.values = document.createElement("div");
    this.values.className = "tc-popup-values";
    this.popup.appendChild(this.values);
  }

  renderDate(state: State) {
    if (state.hover) {
      const stamp = state.primaryAxis.data[state.hover.idx];
      this.date.innerHTML = formatPreviewDate(stamp);
    }
  }

  renderValues(state: State) {
    if (state.hover) {
      this.values.innerHTML = state.lineAxes
        .map(axis => {
          const value = state.hover ? axis.data[state.hover.idx] : 0;
          return (
            `<div class="tc-popup-value" style="color: ${axis.color}">` +
            `<div>${value}</div>` +
            axis.name +
            "</div>"
          );
        })
        .join("");
    }
  }

  render(state: State, container: HTMLElement) {
    if (state.hover) {
      const idx = state.hover.idx;

      this.popup.style.display = "block";
      this.renderDate(state);
      this.renderValues(state);

      const first = state.primaryAxis.data[0];
      const last = state.primaryAxis.data[state.primaryAxis.data.length - 1];
      const minX = (last - first) * state.slice.start + first;
      const xScale = (last - first) * (state.slice.end - state.slice.start);

      const value = state.primaryAxis.data[idx];
      const containerWidth = container.getBoundingClientRect().width;
      const width = this.popup.getBoundingClientRect().width;
      const x = (containerWidth * (value - minX)) / xScale;
      const offset = -width / 2;
      const pos = clamp(x + offset, 20, containerWidth - width - 10);
      this.popup.style.left = `${pos}px`;
    } else {
      this.popup.style.display = "none";
    }
  }
}
