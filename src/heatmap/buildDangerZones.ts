import type { DangerZone, DangerZoneSummary, DensityGrid } from "./heatmapTypes";
import { calculateDangerScore } from "./calculateDangerScore";

export const buildDangerZones = ({
  deathDensityGrid,
  minDeathCount,
}: {
  deathDensityGrid: DensityGrid;
  minDeathCount: number;
}): DangerZone[] => {
  const threshold = Math.max(1, Math.floor(minDeathCount));

  return deathDensityGrid.cells
    .filter((cell) => cell.count >= threshold)
    .map((cell) => ({
      dangerScore: calculateDangerScore({
        deathCount: cell.count,
        maxDeathCount: deathDensityGrid.maxDensity,
      }),
      deathCount: cell.count,
      xIndex: cell.xIndex,
      yIndex: cell.yIndex,
    }))
    .sort((left, right) => right.dangerScore - left.dangerScore || right.deathCount - left.deathCount);
};

export const summarizeDangerZones = (dangerZones: DangerZone[]): DangerZoneSummary => {
  const dangerScoreTotal = dangerZones.reduce((total, zone) => total + zone.dangerScore, 0);

  return {
    averageDangerScore: dangerZones.length === 0 ? 0 : dangerScoreTotal / dangerZones.length,
    dangerZoneCount: dangerZones.length,
    highestDangerScore: dangerZones[0]?.dangerScore ?? 0,
  };
};
