import type { Match, PlayerMatchStats, WeaponStat } from "../types";
import { checkDuplicateMatches, type DuplicateMatchReport } from "./checkDuplicateMatches";
import { checkWeaponConsistency, type WeaponConsistencyReport } from "./checkWeaponConsistency";
import {
  calculateHealthScore,
  type HealthScoreReport,
  type InvalidDataReport,
} from "./calculateHealthScore";

export type DataQualityInput = {
  invalidDataReport?: InvalidDataReport;
  matches: Match[];
  playerMatchStats: PlayerMatchStats[];
  weaponStats: WeaponStat[];
};

export type DataQualityReport = {
  duplicateReport: DuplicateMatchReport;
  health: HealthScoreReport;
  invalidDataReport: InvalidDataReport;
  matchCount: number;
  playerStatsCount: number;
  weaponRecordCount: number;
  weaponReport: WeaponConsistencyReport;
};

const emptyInvalidDataReport: InvalidDataReport = {
  invalidRows: 0,
  negativeValues: 0,
  unknownWeapon: 0,
};

export const validateDataSource = ({
  invalidDataReport = emptyInvalidDataReport,
  matches,
  playerMatchStats,
  weaponStats,
}: DataQualityInput): DataQualityReport => {
  const duplicateReport = checkDuplicateMatches(matches);
  const weaponReport = checkWeaponConsistency(matches, weaponStats);
  const health = calculateHealthScore({
    duplicateReport,
    invalidDataReport,
    weaponReport,
  });

  return {
    duplicateReport,
    health,
    invalidDataReport,
    matchCount: matches.length,
    playerStatsCount: playerMatchStats.length,
    weaponRecordCount: weaponStats.length,
    weaponReport,
  };
};
