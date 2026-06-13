import type { DangerZone, RiskRewardZone, SuccessZone } from "./heatmapTypes";
import type { HeatmapInsight } from "./heatmapInsightTypes";

const formatCell = ({ xIndex, yIndex }: { xIndex: number; yIndex: number }) => `cell ${xIndex}, ${yIndex}`;

const getScoreSeverity = (score: number): HeatmapInsight["severity"] => {
  if (score >= 0.85) {
    return "high";
  }

  if (score >= 0.5) {
    return "medium";
  }

  return "low";
};

export const buildHeatmapInsights = ({
  dangerZones,
  riskRewardZones,
  successZones,
}: {
  dangerZones: DangerZone[];
  riskRewardZones: RiskRewardZone[];
  successZones: SuccessZone[];
}): HeatmapInsight[] => {
  const insights: HeatmapInsight[] = [];

  dangerZones.slice(0, 3).forEach((zone) => {
    insights.push({
      description: `Death concentration recorded at ${formatCell(zone)} in the current filtered data.`,
      severity: getScoreSeverity(zone.dangerScore),
      title: "Death-Dense Cell",
      type: "danger",
    });
  });

  successZones.slice(0, 3).forEach((zone) => {
    insights.push({
      description: `Kill concentration recorded at ${formatCell(zone)} in the current filtered data.`,
      severity: getScoreSeverity(zone.successScore),
      title: "Kill-Dense Cell",
      type: "success",
    });
  });

  riskRewardZones
    .filter((zone) => zone.category === "risk")
    .slice(0, 2)
    .forEach((zone) => {
      insights.push({
        description: `This cell has more deaths than kills in the current filtered data.`,
        severity: zone.score <= 0.5 ? "high" : "medium",
        title: `Death-Lean Balance Cell (${formatCell(zone)})`,
        type: "risk",
      });
    });

  riskRewardZones
    .filter((zone) => zone.category === "reward")
    .slice(0, 2)
    .forEach((zone) => {
      insights.push({
        description: `This cell has more kills than deaths in the current filtered data.`,
        severity: zone.score >= 2 ? "high" : "medium",
        title: `Kill-Lean Balance Cell (${formatCell(zone)})`,
        type: "reward",
      });
    });

  if (insights.length === 0) {
    return [
      {
        description: "Not enough heatmap data is available to show area notes.",
        severity: "low",
        title: "Not Enough Data",
        type: "neutral",
      },
    ];
  }

  return insights.slice(0, 6);
};
