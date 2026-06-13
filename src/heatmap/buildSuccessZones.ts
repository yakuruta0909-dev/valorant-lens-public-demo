import type { DensityGrid, SuccessZone, SuccessZoneSummary } from "./heatmapTypes";
import { calculateSuccessScore } from "./calculateSuccessScore";

export const buildSuccessZones = ({
  killDensityGrid,
  minKillCount,
}: {
  killDensityGrid: DensityGrid;
  minKillCount: number;
}): SuccessZone[] => {
  const threshold = Math.max(1, Math.floor(minKillCount));

  return killDensityGrid.cells
    .filter((cell) => cell.count >= threshold)
    .map((cell) => ({
      killCount: cell.count,
      successScore: calculateSuccessScore({
        killCount: cell.count,
        maxKillCount: killDensityGrid.maxDensity,
      }),
      xIndex: cell.xIndex,
      yIndex: cell.yIndex,
    }))
    .sort((left, right) => right.successScore - left.successScore || right.killCount - left.killCount);
};

export const summarizeSuccessZones = (successZones: SuccessZone[]): SuccessZoneSummary => {
  const successScoreTotal = successZones.reduce((total, zone) => total + zone.successScore, 0);

  return {
    averageSuccessScore: successZones.length === 0 ? 0 : successScoreTotal / successZones.length,
    highestSuccessScore: successZones[0]?.successScore ?? 0,
    successZoneCount: successZones.length,
  };
};
