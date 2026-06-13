import type {
  AnalysisFilters,
  Match,
  MetricKey,
  PeriodStats,
  PeriodType,
  PlayerMatchStats,
} from "../types";
import { calculateMatchDifficulty } from "./calculateMatchDifficulty";
import { calculatePerformanceGrade } from "./calculatePerformanceGrade";
import { calculatePerformanceIndex } from "./performanceIndex";

type ScopeFilters = Pick<AnalysisFilters, "agent" | "map" | "scope">;

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const getWeekNumber = (date: Date) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getPeriodKey = (playedAt: string, periodType: PeriodType) => {
  const date = new Date(`${playedAt}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (periodType === "year") {
    return `${year}`;
  }

  if (periodType === "month") {
    return `${year}-${month}`;
  }

  return `${year}-W${String(getWeekNumber(date)).padStart(2, "0")}`;
};

const createEmptyPeriod = (periodKey: string, periodType: PeriodType): PeriodStats => ({
  periodKey,
  periodType,
  rankMatches: 0,
  deathmatchCount: 0,
  teamDeathmatchCount: 0,
  practiceMatches: 0,
  winRate: 0,
  kd: 0,
  acs: 0,
  hsRate: 0,
  matchStrength: 0,
  matchDifficulty: "Easy",
  performanceIndex: 0,
  performanceGrade: "D",
});

const passesScope = (match: Match, stats: PlayerMatchStats, filters: ScopeFilters) => {
  if (filters.scope === "agent") {
    return !filters.agent || stats.agent === filters.agent;
  }

  if (filters.scope === "map") {
    return !filters.map || match.map === filters.map;
  }

  if (filters.scope === "agentMap") {
    const agentMatches = !filters.agent || stats.agent === filters.agent;
    const mapMatches = !filters.map || match.map === filters.map;
    return agentMatches && mapMatches;
  }

  return true;
};

export const filterMatchesByScope = ({
  agent,
  map,
  matches,
  playerMatchStats,
  scope,
}: ScopeFilters & {
  matches: Match[];
  playerMatchStats: PlayerMatchStats[];
}) => {
  const statsByMatchId = new Map(playerMatchStats.map((stats) => [stats.matchId, stats]));

  return matches.flatMap((match) => {
    const stats = statsByMatchId.get(match.matchId);

    if (!stats || !passesScope(match, stats, { scope, agent, map })) {
      return [];
    }

    return [{ match, stats }];
  });
};

export const aggregatePeriodStats = (
  matches: Match[],
  playerMatchStats: PlayerMatchStats[],
  filters: AnalysisFilters,
): PeriodStats[] => {
  const scopedMatches = filterMatchesByScope({
    matches,
    playerMatchStats,
    scope: filters.scope,
    agent: filters.agent,
    map: filters.map,
  });
  const buckets = new Map<
    string,
    PeriodStats & {
      wins: number;
      kills: number;
      deaths: number;
      acsTotal: number;
      shots: number;
      headshots: number;
      matchStrengthTotal: number;
    }
  >();

  scopedMatches.forEach(({ match, stats }) => {
    const periodKey = getPeriodKey(match.playedAt, filters.periodType);
    const bucket =
      buckets.get(periodKey) ??
      ({
        ...createEmptyPeriod(periodKey, filters.periodType),
        wins: 0,
        kills: 0,
        deaths: 0,
        acsTotal: 0,
        shots: 0,
        headshots: 0,
        matchStrengthTotal: 0,
      } satisfies PeriodStats & {
        wins: number;
        kills: number;
        deaths: number;
        acsTotal: number;
        shots: number;
        headshots: number;
        matchStrengthTotal: number;
      });

    if (match.mode === "Competitive") {
      bucket.rankMatches += 1;
      bucket.wins += stats.win ? 1 : 0;
      bucket.kills += stats.kills;
      bucket.deaths += stats.deaths;
      bucket.acsTotal += stats.acs;
      bucket.headshots += stats.headshots;
      bucket.shots += stats.headshots + stats.bodyshots + stats.legshots;
      bucket.matchStrengthTotal += match.averageRating;
    }

    if (match.mode === "Deathmatch") {
      bucket.deathmatchCount += 1;
    }

    if (match.mode === "Team Deathmatch") {
      bucket.teamDeathmatchCount += 1;
    }

    bucket.practiceMatches = bucket.deathmatchCount + bucket.teamDeathmatchCount;
    buckets.set(periodKey, bucket);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
    .map((bucket) => {
      const winRate = bucket.rankMatches > 0 ? round((bucket.wins / bucket.rankMatches) * 100) : 0;
      const kd = bucket.deaths > 0 ? round(bucket.kills / bucket.deaths, 2) : 0;
      const acs = bucket.rankMatches > 0 ? round(bucket.acsTotal / bucket.rankMatches) : 0;
      const hsRate = bucket.shots > 0 ? round((bucket.headshots / bucket.shots) * 100) : 0;
      const matchStrength =
        bucket.rankMatches > 0 ? Math.round(bucket.matchStrengthTotal / bucket.rankMatches) : 0;
      const performanceIndex =
        bucket.rankMatches > 0
          ? calculatePerformanceIndex({ acs, kd, winRate, hsRate, matchStrength })
          : 0;

      return {
        periodKey: bucket.periodKey,
        periodType: bucket.periodType,
        rankMatches: bucket.rankMatches,
        deathmatchCount: bucket.deathmatchCount,
        teamDeathmatchCount: bucket.teamDeathmatchCount,
        practiceMatches: bucket.practiceMatches,
        winRate,
        kd,
        acs,
        hsRate,
        matchStrength,
        matchDifficulty: calculateMatchDifficulty(matchStrength),
        performanceIndex,
        performanceGrade: calculatePerformanceGrade(performanceIndex),
      };
    });
};

export const getLatestMetricValue = (stats: PeriodStats[], key: MetricKey) => {
  const latest = [...stats].reverse().find((period) => period[key] > 0);
  return latest?.[key] ?? 0;
};
