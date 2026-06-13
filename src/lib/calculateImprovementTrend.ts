import type { AnalysisScope, Match, PlayerMatchStats } from "../types";
import { filterMatchesByScope } from "./aggregateStats";
import { calculatePerformanceIndex } from "./performanceIndex";

export type ImprovementTrend = {
  recent20PI: number;
  overallPI: number;
  delta: number;
  status: "Improving" | "Declining";
};

type ImprovementTrendInput = {
  agent?: string;
  map?: string;
  matches: Match[];
  playerMatchStats: PlayerMatchStats[];
  scope: AnalysisScope;
};

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
};

const getSingleMatchPerformanceIndex = (match: Match, stats: PlayerMatchStats) => {
  const shots = stats.headshots + stats.bodyshots + stats.legshots;
  const hsRate = shots > 0 ? (stats.headshots / shots) * 100 : 0;
  const kd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;

  return calculatePerformanceIndex({
    acs: stats.acs,
    kd,
    hsRate,
    matchStrength: match.averageRating,
    win: stats.win,
  });
};

export const calculateImprovementTrend = ({
  agent,
  map,
  matches,
  playerMatchStats,
  scope,
}: ImprovementTrendInput): ImprovementTrend => {
  const performanceIndexes = filterMatchesByScope({
    matches,
    playerMatchStats,
    scope,
    agent,
    map,
  })
    .filter(({ match }) => match.mode === "Competitive")
    .sort((a, b) => a.match.playedAt.localeCompare(b.match.playedAt))
    .map(({ match, stats }) => getSingleMatchPerformanceIndex(match, stats));

  const recent20PI = round(average(performanceIndexes.slice(-20)));
  const overallPI = round(average(performanceIndexes));
  const delta = round(recent20PI - overallPI);

  return {
    recent20PI,
    overallPI,
    delta,
    status: delta >= 0 ? "Improving" : "Declining",
  };
};
