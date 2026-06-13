import type { SuccessZone } from "./heatmapTypes";

export const buildSuccessZonesCsv = (successZones: SuccessZone[]) => {
  const headers = ["xIndex", "yIndex", "killCount", "successScore"];
  const rows = successZones.map((zone) => [
    zone.xIndex,
    zone.yIndex,
    zone.killCount,
    Number(zone.successScore.toFixed(4)),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
};

export const downloadSuccessZonesCsv = (successZones: SuccessZone[]) => {
  const blob = new Blob([buildSuccessZonesCsv(successZones)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "success_zones.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};
