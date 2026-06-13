import type { MetricDefinition } from "../types";

export const formatMetricValue = (metric: MetricDefinition, value: number) => {
  if (metric.valueType === "rate") {
    return `${value.toFixed(1)}%`;
  }

  if (metric.valueType === "ratio") {
    return value.toFixed(2);
  }

  return `${Math.round(value)}`;
};
