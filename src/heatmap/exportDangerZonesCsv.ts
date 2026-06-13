import type { DangerZone } from "./heatmapTypes";

export const buildDangerZonesCsv = (dangerZones: DangerZone[]) => {
  const headers = ["xIndex", "yIndex", "deathCount", "dangerScore"];
  const rows = dangerZones.map((zone) => [
    zone.xIndex,
    zone.yIndex,
    zone.deathCount,
    Number(zone.dangerScore.toFixed(4)),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
};

export const downloadDangerZonesCsv = (dangerZones: DangerZone[]) => {
  const blob = new Blob([buildDangerZonesCsv(dangerZones)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "danger_zones.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};
