import { WEAPONS } from "../data/dummyWeaponStats";
import type { Match, WeaponStat } from "../types";

export type WeaponConsistencyReport = {
  invalidWeaponRecords: number;
  missingWeaponMatchIds: string[];
  negativeWeaponRecords: number;
  orphanWeaponRecords: number;
  orphanWeaponRecordIds: string[];
  unknownWeaponRecords: number;
};

const hasNegativeValue = (stat: WeaponStat) =>
  stat.kills < 0 || stat.headshots < 0 || stat.bodyshots < 0 || stat.legshots < 0;

export const checkWeaponConsistency = (
  matches: Match[],
  weaponStats: WeaponStat[],
): WeaponConsistencyReport => {
  const matchIds = new Set(matches.map((match) => match.matchId));
  const competitiveMatchIds = new Set(
    matches.filter((match) => match.mode === "Competitive").map((match) => match.matchId),
  );
  const weaponMatchIds = new Set(weaponStats.map((stat) => stat.matchId));
  const missingWeaponMatchIds = Array.from(competitiveMatchIds)
    .filter((matchId) => !weaponMatchIds.has(matchId))
    .sort();
  const orphanWeaponRecordIds = weaponStats
    .filter((stat) => !matchIds.has(stat.matchId))
    .map((stat) => `${stat.matchId}:${stat.weapon}`)
    .sort();
  const unknownWeaponRecords = weaponStats.filter(
    (stat) => !WEAPONS.includes(stat.weapon as (typeof WEAPONS)[number]),
  ).length;
  const negativeWeaponRecords = weaponStats.filter(hasNegativeValue).length;

  return {
    invalidWeaponRecords: unknownWeaponRecords + negativeWeaponRecords,
    missingWeaponMatchIds,
    negativeWeaponRecords,
    orphanWeaponRecordIds,
    orphanWeaponRecords: orphanWeaponRecordIds.length,
    unknownWeaponRecords,
  };
};
