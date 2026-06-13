import type { MatchDifficulty } from "../types";
import { DIFFICULTY_SCORES } from "../constants/performanceWeights";

export const calculateMatchDifficulty = (averageRating: number): MatchDifficulty => {
  if (averageRating >= 3000) return "Very Hard";
  if (averageRating >= 2400) return "Hard";
  if (averageRating >= 1800) return "Normal";
  return "Easy";
};

export const getDifficultyScore = (averageRating: number) => {
  return DIFFICULTY_SCORES[calculateMatchDifficulty(averageRating)];
};
