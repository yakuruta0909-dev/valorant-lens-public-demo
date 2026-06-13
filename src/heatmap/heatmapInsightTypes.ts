export type HeatmapInsight = {
  type: "danger" | "success" | "risk" | "reward" | "neutral";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
};
