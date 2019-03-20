// @flow

export const clamp = (value: number, low: number = 0, high: number = 1) =>
  Math.min(high, Math.max(low, value));
