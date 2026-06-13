import type { RiskRewardCategory } from "./heatmapTypes";

export const calculateRiskRewardScore = ({
  deathCount,
  killCount,
}: {
  deathCount: number;
  killCount: number;
}) => (killCount + 1) / (deathCount + 1);

export const classifyRiskRewardScore = (score: number): RiskRewardCategory => {
  if (score >= 1.5) {
    return "reward";
  }

  if (score <= 0.75) {
    return "risk";
  }

  return "neutral";
};
