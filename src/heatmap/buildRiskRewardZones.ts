import type { DensityGrid, RiskRewardSummary, RiskRewardZone } from "./heatmapTypes";
import { calculateRiskRewardScore, classifyRiskRewardScore } from "./calculateRiskRewardScore";

const buildCellCountMap = (densityGrid: DensityGrid) =>
  new Map(densityGrid.cells.map((cell) => [`${cell.xIndex}:${cell.yIndex}`, cell.count]));

const parseCellKey = (key: string) => {
  const [xIndex, yIndex] = key.split(":").map(Number);

  return { xIndex, yIndex };
};

export const buildRiskRewardZones = ({
  deathDensityGrid,
  killDensityGrid,
}: {
  deathDensityGrid: DensityGrid;
  killDensityGrid: DensityGrid;
}): RiskRewardZone[] => {
  const killCounts = buildCellCountMap(killDensityGrid);
  const deathCounts = buildCellCountMap(deathDensityGrid);
  const cellKeys = new Set([...killCounts.keys(), ...deathCounts.keys()]);

  return Array.from(cellKeys)
    .map((key) => {
      const { xIndex, yIndex } = parseCellKey(key);
      const killCount = killCounts.get(key) ?? 0;
      const deathCount = deathCounts.get(key) ?? 0;
      const score = calculateRiskRewardScore({ deathCount, killCount });

      return {
        category: classifyRiskRewardScore(score),
        deathCount,
        killCount,
        score,
        xIndex,
        yIndex,
      };
    })
    .sort((left, right) => right.score - left.score || right.killCount - left.killCount);
};

export const summarizeRiskRewardZones = (zones: RiskRewardZone[]): RiskRewardSummary => {
  const averageScore = zones.length === 0 ? 0 : zones.reduce((total, zone) => total + zone.score, 0) / zones.length;
  const sortedByScore = [...zones].sort((left, right) => right.score - left.score);

  return {
    averageScore,
    bestZone: sortedByScore[0],
    rewardZoneCount: zones.filter((zone) => zone.category === "reward").length,
    riskZoneCount: zones.filter((zone) => zone.category === "risk").length,
    worstZone: sortedByScore[sortedByScore.length - 1],
  };
};
