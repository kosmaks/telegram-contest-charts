// @flow

export const toggleClass = (
  current: string,
  name: string,
  on: boolean
): string => {
  const without = current
    .split(" ")
    .filter(x => x !== name)
    .join(" ");
  if (on) return without + " " + name;
  return without;
};

export const clamp = (value: number, low: number = 0, high: number = 1) =>
  Math.min(high, Math.max(low, value));

export const min = (arr: number[]): number =>
  arr.length <= 0 ? 0 : arr.reduce((acc, x) => (x < acc ? x : acc), arr[0]);

export const max = (arr: number[]): number =>
  arr.length <= 0 ? 0 : arr.reduce((acc, x) => (x > acc ? x : acc), arr[0]);

const dist = (left: number, right: number): number => Math.abs(left - right);

export const findClosestIdx = <T>(
  arr: number[],
  target: number,
  startIdx: number,
  endIdx: number
) => {
  if (arr.length <= 0) {
    return -1;
  }

  if (endIdx <= startIdx) {
    return startIdx;
  }

  const from = arr[startIdx];
  const end = arr[endIdx];

  const pos =
    Math.round((endIdx - startIdx) * ((target - from) / (from - end))) +
    startIdx;

  let closestRight = pos;
  let closestRightDist = dist(arr[pos], target);
  for (let i = pos + 1; i <= endIdx; ++i) {
    const value = dist(arr[i], target);
    if (value > closestRightDist) {
      break;
    }
    closestRight = i;
    closestRightDist = value;
  }

  let closestLeft = pos;
  let closestLeftDist = dist(arr[pos], target);
  for (let i = pos - 1; i >= startIdx; --i) {
    const value = dist(arr[i], target);
    if (value > closestLeftDist) {
      break;
    }
    closestLeft = i;
    closestLeftDist = value;
  }

  if (closestLeftDist < closestRightDist) {
    return closestLeft;
  }

  return closestRight;
};
