import type { TimelineEventType } from "../timeline/types";

export type HeatmapTeamFilter = "All" | "ally" | "enemy";

export type HeatmapOwnershipFilter = "All" | "playerOnly";

export type HeatmapEventTypeFilter = "All" | TimelineEventType;

export type HeatmapFilters = {
  agent: string;
  eventType: HeatmapEventTypeFilter;
  map: string;
  ownership: HeatmapOwnershipFilter;
  team: HeatmapTeamFilter;
  weapon: string;
};

export type HeatmapPoint = {
  x: number;
  y: number;
  agent?: string;
  eventType: string;
  weapon?: string;
  team?: "ally" | "enemy";
  isPlayerEvent?: boolean;
};

export type HeatmapPointSummary = {
  allyEvents: number;
  deathPoints: number;
  enemyEvents: number;
  killPoints: number;
  playerEvents: number;
  totalPoints: number;
};

export type HeatmapDisplayMode = "points" | "density" | "combined";

export type HeatmapMode = "all" | "kill" | "death" | "compare";

export type DensityCell = {
  xIndex: number;
  yIndex: number;
  count: number;
  intensity: number;
};

export type DensityGrid = {
  activeCells: number;
  cellSize: number;
  cells: DensityCell[];
  gridSize: number;
  maxDensity: number;
};

export type KillDeathHeatmap = {
  allPoints: HeatmapPoint[];
  deathDensityGrid: DensityGrid;
  deathPoints: HeatmapPoint[];
  killDensityGrid: DensityGrid;
  killPoints: HeatmapPoint[];
  visibleDensityGrid: DensityGrid;
  visiblePoints: HeatmapPoint[];
};

export type KillDeathSummary = {
  deathDensityMax: number;
  killDeathRatio: number;
  killDensityMax: number;
  mostDenseEventType: "Kill" | "Death" | "Tie" | "None";
};

export type DangerZone = {
  xIndex: number;
  yIndex: number;
  deathCount: number;
  dangerScore: number;
};

export type DangerZoneSummary = {
  averageDangerScore: number;
  dangerZoneCount: number;
  highestDangerScore: number;
};

export type SuccessZone = {
  xIndex: number;
  yIndex: number;
  killCount: number;
  successScore: number;
};

export type SuccessZoneSummary = {
  averageSuccessScore: number;
  highestSuccessScore: number;
  successZoneCount: number;
};

export type RiskRewardCategory = "reward" | "neutral" | "risk";

export type RiskRewardZone = {
  xIndex: number;
  yIndex: number;
  killCount: number;
  deathCount: number;
  score: number;
  category: RiskRewardCategory;
};

export type RiskRewardSummary = {
  averageScore: number;
  bestZone?: RiskRewardZone;
  rewardZoneCount: number;
  riskZoneCount: number;
  worstZone?: RiskRewardZone;
};

export type MultiKillZone = {
  xIndex: number;
  yIndex: number;
  multiKillCount: number;
  score: number;
};

export type MultiKillZoneSummary = {
  averageScore: number;
  highestScore: number;
  multiKillZoneCount: number;
};
