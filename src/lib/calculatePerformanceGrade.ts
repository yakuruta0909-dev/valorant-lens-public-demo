import type { PerformanceGrade } from "../types";

export const calculatePerformanceGrade = (performanceIndex: number): PerformanceGrade => {
  if (performanceIndex >= 120) return "S";
  if (performanceIndex >= 105) return "A";
  if (performanceIndex >= 90) return "B";
  if (performanceIndex >= 75) return "C";
  return "D";
};
