import type { DensityGrid, HeatmapPoint, KillDeathSummary } from "./heatmapTypes";

export const calculateKillDeathSummary = ({
  deathDensityGrid,
  deathPoints,
  killDensityGrid,
  killPoints,
}: {
  deathDensityGrid: DensityGrid;
  deathPoints: HeatmapPoint[];
  killDensityGrid: DensityGrid;
  killPoints: HeatmapPoint[];
}): KillDeathSummary => {
  const killDeathRatio = deathPoints.length === 0 ? killPoints.length : killPoints.length / deathPoints.length;
  const mostDenseEventType =
    killDensityGrid.maxDensity === 0 && deathDensityGrid.maxDensity === 0
      ? "None"
      : killDensityGrid.maxDensity === deathDensityGrid.maxDensity
        ? "Tie"
        : killDensityGrid.maxDensity > deathDensityGrid.maxDensity
          ? "Kill"
          : "Death";

  return {
    deathDensityMax: deathDensityGrid.maxDensity,
    killDeathRatio,
    killDensityMax: killDensityGrid.maxDensity,
    mostDenseEventType,
  };
};
