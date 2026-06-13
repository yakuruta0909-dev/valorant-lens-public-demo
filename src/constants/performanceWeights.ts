import type { MatchDifficulty } from "../types";

export const PERFORMANCE_WEIGHTS = {
  acs: 0.4,
  kd: 0.25,
  hsRate: 0.15,
  win: 0.1,
  difficulty: 0.1,
} as const;

export const PERFORMANCE_BASELINES = {
  acs: 250,
  kd: 1,
  hsRate: 25,
} as const;

export const DIFFICULTY_SCORES: Record<MatchDifficulty, number> = {
  Easy: 85,
  Normal: 100,
  Hard: 115,
  "Very Hard": 130,
} as const;
