import { PERFORMANCE_BASELINES, PERFORMANCE_WEIGHTS } from "../constants/performanceWeights";
import { getDifficultyScore } from "./calculateMatchDifficulty";
import { loadSettings } from "./settingsStorage";

type PerformanceIndexInput = {
  acs: number;
  kd: number;
  hsRate: number;
  matchStrength: number;
  win?: boolean;
  winRate?: number;
};

export type PerformanceIndexBreakdown = {
  acsScore: number;
  kdScore: number;
  hsScore: number;
  winScore: number;
  difficultyScore: number;
  performanceIndex: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getWinScore = ({ win, winRate }: Pick<PerformanceIndexInput, "win" | "winRate">) => {
  if (typeof win === "boolean") {
    return win ? 115 : 85;
  }

  return clamp(70 + (winRate ?? 0) * 0.6, 70, 130);
};

export const calculatePerformanceIndexBreakdown = ({
  acs,
  kd,
  hsRate,
  matchStrength,
  win,
  winRate,
}: PerformanceIndexInput): PerformanceIndexBreakdown => {
  const weights = loadSettings().performanceWeights;
  const acsScore = clamp((acs / PERFORMANCE_BASELINES.acs) * 100, 0, 150);
  const kdScore = clamp((kd / PERFORMANCE_BASELINES.kd) * 100, 0, 160);
  const hsScore = clamp((hsRate / PERFORMANCE_BASELINES.hsRate) * 100, 0, 150);
  const winScore = getWinScore({ win, winRate });
  const difficultyScore = getDifficultyScore(matchStrength);

  const performanceIndex = Math.round(
    (weights.acs ?? PERFORMANCE_WEIGHTS.acs) * acsScore +
      (weights.kd ?? PERFORMANCE_WEIGHTS.kd) * kdScore +
      (weights.hsRate ?? PERFORMANCE_WEIGHTS.hsRate) * hsScore +
      (weights.win ?? PERFORMANCE_WEIGHTS.win) * winScore +
      (weights.difficulty ?? PERFORMANCE_WEIGHTS.difficulty) * difficultyScore,
  );

  return {
    acsScore,
    kdScore,
    hsScore,
    winScore,
    difficultyScore,
    performanceIndex,
  };
};

export const calculatePerformanceIndex = (input: PerformanceIndexInput) => {
  return calculatePerformanceIndexBreakdown(input).performanceIndex;
};
