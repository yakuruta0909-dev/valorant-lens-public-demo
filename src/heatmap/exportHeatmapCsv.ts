import type { HeatmapMode, HeatmapPoint } from "./heatmapTypes";

const escapeCsvValue = (value: boolean | number | string | undefined) => {
  const normalizedValue = value === undefined ? "" : String(value);

  if (!/[",\n\r]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

export const buildHeatmapCsv = (points: HeatmapPoint[], heatmapMode: HeatmapMode = "all") => {
  const headers = ["heatmapMode", "eventType", "x", "y", "agent", "weapon", "team", "isPlayerEvent"];
  const rows = points.map((point) => [
    heatmapMode,
    point.eventType,
    Number(point.x.toFixed(2)),
    Number(point.y.toFixed(2)),
    point.agent,
    point.weapon,
    point.team,
    point.isPlayerEvent,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
};

export const downloadHeatmapCsv = (points: HeatmapPoint[], heatmapMode: HeatmapMode = "all") => {
  const blob = new Blob([buildHeatmapCsv(points, heatmapMode)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "heatmap_points.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};
