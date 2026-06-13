import type { CompareMetric, CompareMode, CompareRow } from "../types";

export type CompareChartDatum = {
  label: string;
  value: number;
  confidence: string;
};

export const buildCompareChartData = (
  rows: CompareRow[],
  mode: CompareMode,
  metric: CompareMetric,
): CompareChartDatum[] => {
  const limit = mode === "agentMap" ? 10 : rows.length;

  return [...rows]
    .sort((a, b) => b[metric] - a[metric] || b.matches - a.matches || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((row) => ({
      label: row.label,
      value: row[metric],
      confidence: row.confidence,
    }));
};
