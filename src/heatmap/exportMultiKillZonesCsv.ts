import type { MultiKillZone } from "./heatmapTypes";

export const buildMultiKillZonesCsv = (multiKillZones: MultiKillZone[]) => {
  const headers = ["xIndex", "yIndex", "multiKillCount", "score"];
  const rows = multiKillZones.map((zone) => [
    zone.xIndex,
    zone.yIndex,
    zone.multiKillCount,
    Number(zone.score.toFixed(4)),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
};

export const downloadMultiKillZonesCsv = (multiKillZones: MultiKillZone[]) => {
  const blob = new Blob([buildMultiKillZonesCsv(multiKillZones)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "multi_kill_zones.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};
