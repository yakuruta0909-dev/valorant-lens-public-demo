import type { RiskRewardZone } from "./heatmapTypes";

export const buildRiskRewardCsv = (zones: RiskRewardZone[]) => {
  const headers = ["xIndex", "yIndex", "killCount", "deathCount", "score", "category"];
  const rows = zones.map((zone) => [
    zone.xIndex,
    zone.yIndex,
    zone.killCount,
    zone.deathCount,
    Number(zone.score.toFixed(4)),
    zone.category,
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
};

export const downloadRiskRewardCsv = (zones: RiskRewardZone[]) => {
  const blob = new Blob([buildRiskRewardCsv(zones)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "risk_reward_zones.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};
