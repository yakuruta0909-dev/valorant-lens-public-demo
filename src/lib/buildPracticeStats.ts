import type {
  Match,
  PeriodStats,
  PeriodType,
  PlayerMatchStats,
  PracticeCorrelation,
  PracticeMetricKey,
  PracticeSummary,
} from "../types";
import { aggregatePeriodStats } from "./aggregateStats";
import { calculateCorrelation, getCorrelationGrade } from "./calculateCorrelation";

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const practiceMetricLabels: Record<PracticeMetricKey, string> = {
  performanceIndex: "Practice vs Lens Score",
  acs: "Practice vs ACS",
  kd: "Practice vs KD",
  hsRate: "Practice vs HS Rate",
};

export const buildPracticePeriodStats = (
  periodType: PeriodType,
  matches: Match[],
  playerMatchStats: PlayerMatchStats[],
) => {
  return aggregatePeriodStats(matches, playerMatchStats, {
    periodType,
    scope: "overall",
  });
};

export const buildPracticeSummary = (periodStats: PeriodStats[]): PracticeSummary => {
  const totalDeathmatch = periodStats.reduce((total, period) => total + period.deathmatchCount, 0);
  const totalTeamDeathmatch = periodStats.reduce((total, period) => total + period.teamDeathmatchCount, 0);
  const totalPractice = totalDeathmatch + totalTeamDeathmatch;
  const rankedPeriods = periodStats.filter((period) => period.rankMatches > 0);
  const totalRankMatches = rankedPeriods.reduce((total, period) => total + period.rankMatches, 0);

  const averagePerformanceIndex =
    totalRankMatches > 0
      ? round(
          rankedPeriods.reduce((total, period) => total + period.performanceIndex * period.rankMatches, 0) /
            totalRankMatches,
        )
      : 0;
  const averageHsRate =
    totalRankMatches > 0
      ? round(
          rankedPeriods.reduce((total, period) => total + period.hsRate * period.rankMatches, 0) /
            totalRankMatches,
        )
      : 0;

  return {
    totalDeathmatch,
    totalTeamDeathmatch,
    totalPractice,
    averagePerformanceIndex,
    averageHsRate,
  };
};

export const buildPracticeCorrelations = (periodStats: PeriodStats[]): PracticeCorrelation[] => {
  const rankedPeriods = periodStats.filter((period) => period.rankMatches > 0);
  const practiceValues = rankedPeriods.map((period) => period.practiceMatches);
  const metricKeys: PracticeMetricKey[] = ["performanceIndex", "acs", "kd", "hsRate"];

  return metricKeys.map((key) => {
    const value = calculateCorrelation(
      practiceValues,
      rankedPeriods.map((period) => period[key]),
    );

    return {
      key,
      label: practiceMetricLabels[key],
      value,
      grade: getCorrelationGrade(value),
    };
  });
};
