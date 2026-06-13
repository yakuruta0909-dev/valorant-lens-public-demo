import type { DuplicateMatchReport } from "./checkDuplicateMatches";
import type { WeaponConsistencyReport } from "./checkWeaponConsistency";

export type HealthGrade = "A" | "B" | "C" | "D" | "F";

export type InvalidDataReport = {
  invalidRows: number;
  negativeValues: number;
  unknownWeapon: number;
};

export type HealthScoreInput = {
  duplicateReport: DuplicateMatchReport;
  invalidDataReport: InvalidDataReport;
  weaponReport: WeaponConsistencyReport;
};

export type HealthScoreReport = {
  deductions: {
    duplicateMatches: number;
    invalidRows: number;
    missingWeaponRecords: number;
    negativeValues: number;
    orphanWeaponRecords: number;
    unknownWeapon: number;
  };
  grade: HealthGrade;
  score: number;
};

export const calculateHealthGrade = (score: number): HealthGrade => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
};

export const calculateHealthScore = ({
  duplicateReport,
  invalidDataReport,
  weaponReport,
}: HealthScoreInput): HealthScoreReport => {
  const deductions = {
    duplicateMatches: duplicateReport.duplicateRows * 5,
    invalidRows: invalidDataReport.invalidRows * 4,
    missingWeaponRecords: weaponReport.missingWeaponMatchIds.length * 2,
    negativeValues: invalidDataReport.negativeValues * 4 + weaponReport.negativeWeaponRecords * 4,
    orphanWeaponRecords: weaponReport.orphanWeaponRecords * 3,
    unknownWeapon: invalidDataReport.unknownWeapon * 4 + weaponReport.unknownWeaponRecords * 4,
  };
  const totalDeduction = Object.values(deductions).reduce((total, value) => total + value, 0);
  const score = Math.max(0, Math.min(100, 100 - totalDeduction));

  return {
    deductions,
    grade: calculateHealthGrade(score),
    score,
  };
};
