import type { MetricDefinition } from "../types";

export const metricDefinitions: MetricDefinition[] = [
  { key: "rankMatches", label: "Rank Matches", color: "#ff4655", chartType: "bar", valueType: "count" },
  { key: "winRate", label: "Win Rate", color: "#22c55e", chartType: "line", valueType: "rate" },
  { key: "kd", label: "KD", color: "#60a5fa", chartType: "line", valueType: "ratio" },
  { key: "acs", label: "ACS", color: "#f59e0b", chartType: "line", valueType: "score" },
  { key: "hsRate", label: "HS Rate", color: "#e879f9", chartType: "line", valueType: "rate" },
  { key: "deathmatchCount", label: "Solo Practice Count", color: "#a3e635", chartType: "bar", valueType: "count" },
  {
    key: "teamDeathmatchCount",
    label: "Team Practice Count",
    color: "#38bdf8",
    chartType: "bar",
    valueType: "count",
  },
  { key: "practiceMatches", label: "Practice Total", color: "#fb7185", chartType: "bar", valueType: "count" },
  { key: "matchStrength", label: "Match Strength", color: "#c084fc", chartType: "line", valueType: "score" },
  {
    key: "performanceIndex",
    label: "Lens Score",
    color: "#f43f5e",
    chartType: "line",
    valueType: "score",
  },
];

export const defaultMetricKeys = [
  "acs",
  "kd",
  "hsRate",
  "practiceMatches",
  "performanceIndex",
] as const;
