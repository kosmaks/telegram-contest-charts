// @flow

import { cutLarge } from "./numbers";
import {
  formatDay,
  formatHour,
  formatMillisecond,
  formatMinute,
  formatMonth,
  formatSecond,
  formatYear
} from "./date";

interface ValueTicksRequest {
  min: number;
  max: number;
  ticks: number;
}

interface TimeTicksRequest {
  min: number;
  max: number;
  width: number;
}

export interface Tick {
  id: string;
  position: number;
  label: string;
}

interface TicksResponse {
  min: number;
  max: number;
  ticks: Tick[];
}

const roundNums = (value: number, log: number): number =>
  Number(log < 0 ? value.toFixed(Math.ceil(-log) + 1) : Math.round(value));

const closestRound = (value: number, log: number, upper: boolean): number => {
  const scale = Math.pow(10, Math.floor(log));

  if (upper) {
    return Math.ceil(value / scale) * scale;
  }

  return Math.floor(value / scale) * scale;
};

export const getValueTicks = (data: ValueTicksRequest): TicksResponse => {
  const spread = data.max - data.min;

  if (spread === 0) {
    return {
      min: -1,
      max: 1,
      ticks: [{ id: "0", position: 0, label: "0" }]
    };
  }

  const logSpread = Math.log10(spread);
  const lowBound = closestRound(data.min, logSpread, false);
  const highBound = closestRound(data.max, logSpread, true);
  const boundsDiff = highBound - lowBound;
  const step = boundsDiff / data.ticks;

  const result: Tick[] = [];

  for (let i = 0; i < data.ticks; ++i) {
    const value = roundNums(lowBound + step * i, logSpread);
    result.push({
      id: String(value),
      position: value,
      label: cutLarge(value)
    });
  }

  return {
    min: lowBound,
    max: highBound,
    ticks: result
  };
};

export const getTimeTicks = (data: TimeTicksRequest): Tick[] => {
  const diff = data.max - data.min;
  const secondsDiff = diff / 1000;
  const minutesDiff = secondsDiff / 60;
  const hoursDiff = minutesDiff / 60;
  const daysDiff = hoursDiff / 24;
  const monthsDiff = daysDiff / 24;
  const yearsDiff = monthsDiff / 12;

  const widthPerTick = 60;
  const capacity = Math.max(Math.floor(data.width / widthPerTick), 1);

  let size = 0;
  let scaleDiff = 0;
  let format: ?(number) => string;

  if (yearsDiff > capacity) {
    size = 1000 * 60 * 60 * 24 * 31 * 12;
    scaleDiff = yearsDiff;
    format = formatYear;
  } else if (monthsDiff > capacity) {
    size = 1000 * 60 * 60 * 24 * 31;
    scaleDiff = monthsDiff;
    format = formatMonth;
  } else if (daysDiff > capacity) {
    size = 1000 * 60 * 60 * 24;
    scaleDiff = daysDiff;
    format = formatDay;
  } else if (hoursDiff > capacity) {
    size = 1000 * 60 * 60;
    scaleDiff = hoursDiff;
    format = formatHour;
  } else if (minutesDiff > capacity) {
    size = 1000 * 60;
    scaleDiff = minutesDiff;
    format = formatMinute;
  } else if (secondsDiff > capacity) {
    size = 1000;
    scaleDiff = secondsDiff;
    format = formatSecond;
  } else {
    size = 1;
    scaleDiff = diff;
    format = formatMillisecond;
  }

  if (!format) {
    return [];
  }

  const step = Math.pow(2, Math.ceil(Math.log2(scaleDiff / capacity)));

  const ticks: Tick[] = [];

  let stamp = Math.floor(data.min / (size * step)) * step * size;
  while (stamp <= data.max) {
    ticks.push({
      id: `${stamp}`,
      position: stamp,
      label: format(stamp)
    });
    stamp += step * size;
  }

  return ticks;
};
