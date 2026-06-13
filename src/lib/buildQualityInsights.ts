import type { HealthScoreReport } from "./calculateHealthScore";
import type { DataQualityReport } from "./validateDataSource";

export const buildQualityInsights = (qualityReport: DataQualityReport): string[] => {
  const insights: string[] = [];
  const { duplicateReport, health, invalidDataReport, weaponReport } = qualityReport;

  if (health.score >= 90) {
    insights.push("Most imported matches contain valid weapon records.");
  } else if (health.score >= 70) {
    insights.push("The data is usable, but several quality issues should be checked before using review views.");
  } else {
    insights.push("Data quality is low enough to distort displayed summaries.");
  }

  if (duplicateReport.duplicateMatchIds.length > 0) {
    insights.push("Duplicate match IDs may double count displayed match totals.");
  }

  if (weaponReport.missingWeaponMatchIds.length > 0) {
    insights.push("Some competitive matches are missing weapon records.");
  }

  if (weaponReport.orphanWeaponRecords > 0) {
    insights.push("Several weapon records are missing corresponding matches.");
  }

  if (invalidDataReport.invalidRows > 0) {
    insights.push("Recent import validation found invalid rows.");
  }

  return insights;
};

export const getHealthGradeLabel = (health: HealthScoreReport) => `${health.grade} (${health.score}/100)`;
