import { WEAPONS } from "../data/dummyWeaponStats";
import type {
  AnalysisFilters,
  Match,
  PeriodStats,
  PeriodType,
  PlayerMatchStats,
  WeaponStat,
} from "../types";
import { aggregatePeriodStats, filterMatchesByScope } from "./aggregateStats";
import { calculateCorrelation, getCorrelationGrade } from "./calculateCorrelation";
import { calculateWeaponHsRate } from "./calculateWeaponHsRate";

export const WEAPON_FILTER_OPTIONS = ["Overall", ...WEAPONS] as const;

export type WeaponName = (typeof WEAPONS)[number];
export type WeaponTrendKey = (typeof WEAPON_FILTER_OPTIONS)[number];

export type WeaponTrendRow = {
  periodKey: string;
} & Record<WeaponTrendKey, number>;

export type WeaponComparisonRow = {
  weapon: WeaponName;
  hsRate: number;
  kills: number;
  headshots: number;
  shots: number;
};

export type WeaponPracticeRow = PeriodStats & {
  weaponHsRate: number;
};

export type WeaponPracticeCorrelation = {
  label: string;
  value: number;
  grade: ReturnType<typeof getCorrelationGrade>;
};

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

const createEmptyTotals = () =>
  Object.fromEntries(
    WEAPON_FILTER_OPTIONS.map((weapon) => [
      weapon,
      {
        headshots: 0,
        shots: 0,
        kills: 0,
      },
    ]),
  ) as Record<WeaponTrendKey, { headshots: number; shots: number; kills: number }>;

const createEmptyTrendRow = (periodKey: string): WeaponTrendRow =>
  Object.assign(
    { periodKey },
    Object.fromEntries(WEAPON_FILTER_OPTIONS.map((weapon) => [weapon, 0])) as Record<WeaponTrendKey, number>,
  );

export const buildWeaponPeriodStats = (
  matches: Match[],
  playerMatchStats: PlayerMatchStats[],
  weaponStats: WeaponStat[],
  filters: AnalysisFilters,
): WeaponTrendRow[] => {
  const scopedMatches = filterMatchesByScope({
    matches,
    playerMatchStats,
    scope: filters.scope,
    agent: filters.agent,
    map: filters.map,
  }).filter(({ match }) => match.mode === "Competitive");
  const weaponStatsByMatchId = new Map<string, WeaponStat[]>();

  weaponStats.forEach((stat) => {
    weaponStatsByMatchId.set(stat.matchId, [...(weaponStatsByMatchId.get(stat.matchId) ?? []), stat]);
  });

  const buckets = new Map<string, Record<WeaponTrendKey, { headshots: number; shots: number; kills: number }>>();

  scopedMatches.forEach(({ match, stats }) => {
    const periodKey = getPeriodKey(match.playedAt, filters.periodType);
    const bucket = buckets.get(periodKey) ?? createEmptyTotals();
    const overallShots = stats.headshots + stats.bodyshots + stats.legshots;

    bucket.Overall.headshots += stats.headshots;
    bucket.Overall.shots += overallShots;
    bucket.Overall.kills += stats.kills;

    (weaponStatsByMatchId.get(match.matchId) ?? []).forEach((weaponStat) => {
      if (!WEAPONS.includes(weaponStat.weapon as WeaponName)) {
        return;
      }

      const weapon = weaponStat.weapon as WeaponName;
      bucket[weapon].headshots += weaponStat.headshots;
      bucket[weapon].shots += weaponStat.headshots + weaponStat.bodyshots + weaponStat.legshots;
      bucket[weapon].kills += weaponStat.kills;
    });

    buckets.set(periodKey, bucket);
  });

  return Array.from(buckets.entries())
    .sort(([periodA], [periodB]) => periodA.localeCompare(periodB))
    .map(([periodKey, totals]) => {
      const row = createEmptyTrendRow(periodKey);

      WEAPON_FILTER_OPTIONS.forEach((weapon) => {
        const total = totals[weapon];
        row[weapon] =
          total.shots > 0
            ? calculateWeaponHsRate({
                headshots: total.headshots,
                bodyshots: total.shots - total.headshots,
                legshots: 0,
              })
            : 0;
      });

      return row;
    });
};

export const buildWeaponComparisonRows = (
  matches: Match[],
  playerMatchStats: PlayerMatchStats[],
  weaponStats: WeaponStat[],
  filters: Omit<AnalysisFilters, "periodType">,
): WeaponComparisonRow[] => {
  const scopedMatchIds = new Set(
    filterMatchesByScope({
      matches,
      playerMatchStats,
      scope: filters.scope,
      agent: filters.agent,
      map: filters.map,
    })
      .filter(({ match }) => match.mode === "Competitive")
      .map(({ match }) => match.matchId),
  );
  const totals = Object.fromEntries(
    WEAPONS.map((weapon) => [
      weapon,
      {
        headshots: 0,
        shots: 0,
        kills: 0,
      },
    ]),
  ) as Record<WeaponName, { headshots: number; shots: number; kills: number }>;

  weaponStats.forEach((stat) => {
    if (!scopedMatchIds.has(stat.matchId) || !WEAPONS.includes(stat.weapon as WeaponName)) {
      return;
    }

    const weapon = stat.weapon as WeaponName;
    totals[weapon].headshots += stat.headshots;
    totals[weapon].shots += stat.headshots + stat.bodyshots + stat.legshots;
    totals[weapon].kills += stat.kills;
  });

  return WEAPONS.map((weapon) => {
    const total = totals[weapon];

    return {
      weapon,
      hsRate:
        total.shots > 0
          ? calculateWeaponHsRate({
              headshots: total.headshots,
              bodyshots: total.shots - total.headshots,
              legshots: 0,
            })
          : 0,
      kills: total.kills,
      headshots: total.headshots,
      shots: total.shots,
    };
  });
};

export const buildPracticeWeaponStats = (
  periodType: PeriodType,
  matches: Match[],
  playerMatchStats: PlayerMatchStats[],
  weaponStats: WeaponStat[],
  weapon: WeaponTrendKey,
): WeaponPracticeRow[] => {
  const periodStats = aggregatePeriodStats(matches, playerMatchStats, {
    periodType,
    scope: "overall",
  });
  const weaponPeriodStats = buildWeaponPeriodStats(matches, playerMatchStats, weaponStats, {
    periodType,
    scope: "overall",
  });
  const hsRateByPeriod = new Map(weaponPeriodStats.map((period) => [period.periodKey, period[weapon]]));

  return periodStats.map((period) => ({
    ...period,
    weaponHsRate: round(hsRateByPeriod.get(period.periodKey) ?? 0),
  }));
};

export const buildPracticeWeaponCorrelation = (
  periodStats: WeaponPracticeRow[],
  weapon: WeaponTrendKey,
): WeaponPracticeCorrelation => {
  const rankedPeriods = periodStats.filter((period) => period.rankMatches > 0);
  const value = calculateCorrelation(
    rankedPeriods.map((period) => period.practiceMatches),
    rankedPeriods.map((period) => period.weaponHsRate),
  );

  return {
    label: `Practice vs ${weapon} HS Rate`,
    value,
    grade: getCorrelationGrade(value),
  };
};
