// @flow

import { State, Module } from "./common";
import { Store } from "./store";
import checkmarkImg from "./checkmark.png";

interface Toggler {
  container: HTMLDivElement;
  text: HTMLDivElement;
  point: HTMLDivElement;
}

export class TogglersModule extends Module {
  container: HTMLDivElement;
  togglers: ?(Toggler[]);
  store: ?Store<State>;

  didMount(store: Store<State>) {
    this.togglers = [];
    this.container = document.createElement("div");
    this.container.className = "tc-togglers";
    this.store = store;
    store.getState().containerEl.appendChild(this.container);
  }

  shouldUpdate(store: Store<State>, prevState: State) {
    return store.getState().lineAxes !== prevState.lineAxes;
  }

  willUnmount() {
    if (this.container) {
      this.container.remove();
    }
  }

  generateTogglers(count: number) {
    const { container } = this;
    if (!container) return;

    if (!this.togglers) {
      this.togglers = [];
    }

    this.togglers.forEach(toggler => toggler.container.remove());

    this.togglers = [];

    for (let i = 0; i < count; ++i) {
      const toggler = document.createElement("div");
      toggler.className = "tc-toggler";
      toggler.addEventListener("click", () => this.onToggle(i));

      const point = document.createElement("div");
      point.className = "tc-toggler-point";
      toggler.appendChild(point);

      const img = document.createElement("img");
      img.src = checkmarkImg;
      point.appendChild(img);

      const text = document.createElement("div");
      text.className = "tc-toggler-text";
      toggler.appendChild(text);

      container.appendChild(toggler);

      if (this.togglers) {
        this.togglers.push({
          container: toggler,
          point,
          text
        });
      }
    }
  }

  fillTogglers(state: State) {
    const { togglers } = this;
    if (!togglers) return;

    for (let i = 0; i < state.lineAxes.length; ++i) {
      const { color, name, hidden } = state.lineAxes[i];
      const { container, text, point } = togglers[i];

      container.className = hidden
        ? "tc-toggler"
        : "tc-toggler tc-toggler--active";
      point.style.borderColor = color;
      text.innerHTML = name;
    }
  }

  onToggle(idx: number) {
    const { store } = this;
    if (store) {
      const state = store.getState();
      store.putState(
        Object.assign({}, state, {
          lineAxes: state.lineAxes.map((axis, i) =>
            i === idx ? Object.assign({}, axis, { hidden: !axis.hidden }) : axis
          )
        })
      );
    }
  }

  render(state: State) {
    const { togglers } = this;
    if (!togglers) return;

    if (togglers.length !== state.lineAxes.length) {
      this.generateTogglers(state.lineAxes.length);
    }

    this.fillTogglers(state);
  }
}
