// @flow

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const leadingZero = (val: number): string =>
  val < 10 ? `0${+val}` : `${+val}`;

export const formatYear = (stamp: number): string => {
  const date = new Date(stamp);
  return date.getFullYear().toString();
};

export const formatMonth = (stamp: number): string => {
  const date = new Date(stamp);
  return months[date.getMonth()] + " " + date.getFullYear();
};

export const formatDay = (stamp: number): string => {
  const date = new Date(stamp);
  const month = months[date.getMonth()];
  const day = leadingZero(date.getDate());
  return `${month} ${day}`;
};

export const formatHour = (stamp: number): string => {
  const date = new Date(stamp);
  return `${leadingZero(date.getHours())}:00`;
};

export const formatMinute = (stamp: number): string => {
  const date = new Date(stamp);
  return `${leadingZero(date.getHours())}:${leadingZero(date.getMinutes())}`;
};

export const formatSecond = (stamp: number): string => {
  const date = new Date(stamp);
  return `${leadingZero(date.getHours())}:${leadingZero(
    date.getMinutes()
  )}:${leadingZero(date.getSeconds())}`;
};

export const formatMillisecond = (stamp: number): string => {
  const date = new Date(stamp);
  return `${leadingZero(date.getHours())}:${leadingZero(
    date.getMinutes()
  )}:${leadingZero(date.getSeconds())}:${date.getMilliseconds()}`;
};
