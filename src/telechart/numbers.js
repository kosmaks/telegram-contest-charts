// @flow

export const dropZeros = (value: number, digits: number) =>
  String(parseFloat(value.toFixed(digits)));

export const cutLarge = (value: number): string => {
  if (value === 0) return "0";

  if (value >= 1000000) {
    return dropZeros(value / 1000000, 1) + "m";
  } else if (value >= 1000) {
    return dropZeros(value / 1000, 1) + "k";
  }

  return String(value);
};

export const commaSeparated = (value: number): string => {
  const log = Math.log10(value);
  const formatted = log < 0 ? value.toString() : dropZeros(value, 2);
  const terms = formatted.split(".");
  const aboveZero = terms[0]
    .split(".")[0]
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (terms.length > 1) {
    return aboveZero + "." + terms[1];
  }
  return aboveZero;
};
