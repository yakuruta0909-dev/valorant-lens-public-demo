import type { CorrelationGrade, PracticeCorrelation } from "../types";

const getMetricName = (label: string) => label.replace("Practice vs ", "");
const gradeLabels: Record<CorrelationGrade, string> = {
  Strong: "high",
  Moderate: "moderate",
  Weak: "low",
  "Very Weak": "very low",
};

export const buildPracticeInsights = (correlations: PracticeCorrelation[]) => {
  if (correlations.length === 0) {
    return ["Practice data does not have enough entries for a stable metric relationship yet."];
  }

  const strongest = [...correlations].sort((a, b) => b.value - a.value)[0];
  const weakest = [...correlations].sort((a, b) => a.value - b.value)[0];
  const strongestMetric = getMetricName(strongest.label);
  const weakestMetric = getMetricName(weakest.label);

  return [
    `Highest observed practice relationship: ${strongestMetric} (${gradeLabels[strongest.grade]}).`,
    `Lowest observed practice relationship: ${weakestMetric} (${gradeLabels[weakest.grade]}).`,
  ];
};
