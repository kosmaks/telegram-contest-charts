// @flow

import { clamp } from "./helpers";

export class AnimatedValue {
  value: number;
  target: number;
  distance: number;

  constructor(value: number) {
    this.value = value;
    this.target = value;
    this.distance = 0;
  }

  get() {
    return this.value;
  }

  setTarget(target: number) {
    this.target = target;
    this.distance = target - this.value;
  }

  step(step: number) {
    let newValue = this.value + step * this.distance;

    if (
      (this.distance >= 0 && newValue > this.target) ||
      (this.distance < 0 && newValue < this.target)
    ) {
      newValue = this.target;
    }

    this.value = newValue;
  }
}

interface Fading {
  opacity: number;
  appearing: boolean;
}

export class FadingGroup<T> {
  getId: T => string;
  fading: { [id: string]: Fading };
  allValues: T[];

  constructor(getId: T => string) {
    this.fading = {};
    this.allValues = [];
    this.getId = getId;
  }

  putValues(values: T[]) {
    const oldIds = this.allValues.map(this.getId);
    const newIds = values.map(this.getId);

    this.allValues.forEach(value => {
      const id = this.getId(value);
      this.fading[id].appearing = false;
    });

    newIds.forEach(id => {
      if (this.fading[id]) {
        this.fading[id].appearing = true;
      } else {
        this.fading[id] = {
          opacity: 0,
          appearing: true
        };
      }
    });

    values.forEach(value => {
      const id = this.getId(value);

      if (oldIds.indexOf(id) < 0) {
        this.allValues.push(value);
      }
    });
  }

  step(step: number) {
    this.allValues.forEach(value => {
      const id = this.getId(value);
      const fading = this.fading[id];
      fading.opacity += fading.appearing ? step : -step;
      fading.opacity = clamp(fading.opacity);
    });

    this.allValues = this.allValues.filter(value => {
      const id = this.getId(value);
      const fading = this.fading[id];
      return fading.opacity > 0 || fading.appearing;
    });
  }

  getFading(idx: number) {
    return this.fading[this.getId(this.allValues[idx])];
  }

  forEach(cb: (T, Fading) => void) {
    this.allValues.forEach(value => {
      const fading = this.fading[this.getId(value)];
      cb(value, fading);
    });
  }
}
