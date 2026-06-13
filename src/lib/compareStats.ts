import type { CompareMode, CompareRow, ConfidenceGrade, Match, PlayerMatchStats } from "../types";
import { calculateMatchDifficulty } from "./calculateMatchDifficulty";
import { calculatePerformanceGrade } from "./calculatePerformanceGrade";
import { calculatePerformanceIndex } from "./performanceIndex";

type CompareBucket = {
  agent?: string;
  map?: string;
  wins: number;
  matches: number;
  kills: number;
  deaths: number;
  acsTotal: number;
  headshots: number;
  shots: number;
  matchStrengthTotal: number;
};

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const getConfidenceGrade = (matches: number): ConfidenceGrade => {
  if (matches >= 30) return "A";
  if (matches >= 15) return "B";
  if (matches >= 5) return "C";
  return "D";
};

const getGroupKey = (mode: CompareMode, match: Match, stats: PlayerMatchStats) => {
  if (mode === "agent") return stats.agent;
  if (mode === "map") return match.map;
  return `${stats.agent}__${match.map}`;
};

const createBucket = (mode: CompareMode, match: Match, stats: PlayerMatchStats): CompareBucket => {
  if (mode === "agent") {
    return {
      agent: stats.agent,
      wins: 0,
      matches: 0,
      kills: 0,
      deaths: 0,
      acsTotal: 0,
      headshots: 0,
      shots: 0,
      matchStrengthTotal: 0,
    };
  }

  if (mode === "map") {
    return {
      map: match.map,
      wins: 0,
      matches: 0,
      kills: 0,
      deaths: 0,
      acsTotal: 0,
      headshots: 0,
      shots: 0,
      matchStrengthTotal: 0,
    };
  }

  return {
    agent: stats.agent,
    map: match.map,
    wins: 0,
    matches: 0,
    kills: 0,
    deaths: 0,
    acsTotal: 0,
    headshots: 0,
    shots: 0,
    matchStrengthTotal: 0,
  };
};

const buildLabel = (mode: CompareMode, bucket: CompareBucket) => {
  if (mode === "agent") return bucket.agent ?? "Unknown Agent";
  if (mode === "map") return bucket.map ?? "Unknown Map";
  return `${bucket.agent ?? "Unknown Agent"} / ${bucket.map ?? "Unknown Map"}`;
};

export const buildCompareRows = (
  mode: CompareMode,
  matches: Match[],
  playerMatchStats: PlayerMatchStats[],
): CompareRow[] => {
  const statsByMatchId = new Map(playerMatchStats.map((stats) => [stats.matchId, stats]));
  const buckets = new Map<string, CompareBucket>();

  matches.forEach((match) => {
    const stats = statsByMatchId.get(match.matchId);

    if (!stats || match.mode !== "Competitive") {
      return;
    }

    const groupKey = getGroupKey(mode, match, stats);
    const bucket = buckets.get(groupKey) ?? createBucket(mode, match, stats);

    bucket.matches += 1;
    bucket.wins += stats.win ? 1 : 0;
    bucket.kills += stats.kills;
    bucket.deaths += stats.deaths;
    bucket.acsTotal += stats.acs;
    bucket.headshots += stats.headshots;
    bucket.shots += stats.headshots + stats.bodyshots + stats.legshots;
    bucket.matchStrengthTotal += match.averageRating;

    buckets.set(groupKey, bucket);
  });

  return Array.from(buckets.entries()).map(([id, bucket]) => {
    const winRate = bucket.matches > 0 ? round((bucket.wins / bucket.matches) * 100) : 0;
    const kd = bucket.deaths > 0 ? round(bucket.kills / bucket.deaths, 2) : 0;
    const acs = bucket.matches > 0 ? round(bucket.acsTotal / bucket.matches) : 0;
    const hsRate = bucket.shots > 0 ? round((bucket.headshots / bucket.shots) * 100) : 0;
    const matchStrength = bucket.matches > 0 ? Math.round(bucket.matchStrengthTotal / bucket.matches) : 0;
    const performanceIndex = calculatePerformanceIndex({ acs, kd, winRate, hsRate, matchStrength });

    return {
      id,
      label: buildLabel(mode, bucket),
      agent: bucket.agent,
      map: bucket.map,
      matches: bucket.matches,
      winRate,
      kd,
      acs,
      hsRate,
      matchStrength,
      matchDifficulty: calculateMatchDifficulty(matchStrength),
      performanceIndex,
      performanceGrade: calculatePerformanceGrade(performanceIndex),
      confidence: getConfidenceGrade(bucket.matches),
    };
  });
};
