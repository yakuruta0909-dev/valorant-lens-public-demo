import { buildDensityGrid } from "./buildDensityGrid";
import type { HeatmapMode, HeatmapPoint, KillDeathHeatmap } from "./heatmapTypes";

const filterPointsByMode = ({
  deathPoints,
  heatmapMode,
  killPoints,
  points,
}: {
  deathPoints: HeatmapPoint[];
  heatmapMode: HeatmapMode;
  killPoints: HeatmapPoint[];
  points: HeatmapPoint[];
}) => {
  if (heatmapMode === "kill") {
    return killPoints;
  }

  if (heatmapMode === "death") {
    return deathPoints;
  }

  if (heatmapMode === "compare") {
    return [...killPoints, ...deathPoints];
  }

  return points;
};

export const buildKillDeathHeatmap = ({
  canvasSize,
  gridSize,
  heatmapMode,
  points,
}: {
  canvasSize: number;
  gridSize: number;
  heatmapMode: HeatmapMode;
  points: HeatmapPoint[];
}): KillDeathHeatmap => {
  const killPoints = points.filter((point) => point.eventType === "kill");
  const deathPoints = points.filter((point) => point.eventType === "death");
  const visiblePoints = filterPointsByMode({ deathPoints, heatmapMode, killPoints, points });

  return {
    allPoints: points,
    deathDensityGrid: buildDensityGrid({ canvasSize, gridSize, points: deathPoints }),
    deathPoints,
    killDensityGrid: buildDensityGrid({ canvasSize, gridSize, points: killPoints }),
    killPoints,
    visibleDensityGrid: buildDensityGrid({ canvasSize, gridSize, points: visiblePoints }),
    visiblePoints,
  };
};
