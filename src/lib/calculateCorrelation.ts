import type { CorrelationGrade } from "../types";
import { loadSettings } from "./settingsStorage";

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const calculateCorrelation = (xValues: number[], yValues: number[]) => {
  const length = Math.min(xValues.length, yValues.length);

  if (length < 2) {
    return 0;
  }

  const x = xValues.slice(0, length);
  const y = yValues.slice(0, length);
  const xAverage = x.reduce((total, value) => total + value, 0) / length;
  const yAverage = y.reduce((total, value) => total + value, 0) / length;

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let index = 0; index < length; index += 1) {
    const xDelta = x[index] - xAverage;
    const yDelta = y[index] - yAverage;

    numerator += xDelta * yDelta;
    xVariance += xDelta ** 2;
    yVariance += yDelta ** 2;
  }

  if (xVariance === 0 || yVariance === 0) {
    return 0;
  }

  return round(numerator / Math.sqrt(xVariance * yVariance));
};

export const getCorrelationGrade = (correlation: number): CorrelationGrade => {
  const { strong, moderate, weak } = loadSettings().correlationThresholds;

  if (correlation >= strong) return "Strong";
  if (correlation >= moderate) return "Moderate";
  if (correlation >= weak) return "Weak";
  return "Very Weak";
};
