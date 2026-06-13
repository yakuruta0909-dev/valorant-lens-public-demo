export type MatchMode = "Competitive" | "Deathmatch" | "Team Deathmatch";

export type PeriodType = "week" | "month" | "year";

export type DataSourceType = "dummy" | "csv" | "riot";

export type Match = {
  matchId: string;
  playedAt: string;
  mode: MatchMode;
  map: string;
  averageRating: number;
};

export type PlayerMatchStats = {
  matchId: string;
  playerPuuid: string;
  agent: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
};

export type WeaponStat = {
  matchId: string;
  weapon: string;
  kills: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
};

export type PeriodStats = {
  periodKey: string;
  periodType: PeriodType;
  rankMatches: number;
  deathmatchCount: number;
  teamDeathmatchCount: number;
  practiceMatches: number;
  winRate: number;
  kd: number;
  acs: number;
  hsRate: number;
  matchStrength: number;
  matchDifficulty: MatchDifficulty;
  performanceIndex: number;
  performanceGrade: PerformanceGrade;
};

export type AnalysisScope = "overall" | "agent" | "map" | "agentMap";

export type AnalysisFilters = {
  periodType: PeriodType;
  scope: AnalysisScope;
  agent?: string;
  map?: string;
};

export type MetricKey =
  | "rankMatches"
  | "winRate"
  | "kd"
  | "acs"
  | "hsRate"
  | "deathmatchCount"
  | "teamDeathmatchCount"
  | "practiceMatches"
  | "matchStrength"
  | "performanceIndex";

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  color: string;
  chartType: "line" | "bar";
  valueType: "count" | "rate" | "ratio" | "score";
};

export type CompareMode = "agent" | "map" | "agentMap";

export type SortKey = "matches" | "winRate" | "kd" | "acs" | "hsRate" | "performanceIndex";

export type SortDirection = "asc" | "desc";

export type CompareMetric = "winRate" | "kd" | "acs" | "hsRate" | "performanceIndex";

export type ConfidenceGrade = "A" | "B" | "C" | "D";

export type MatchDifficulty = "Easy" | "Normal" | "Hard" | "Very Hard";

export type PerformanceGrade = "S" | "A" | "B" | "C" | "D";

export type CorrelationGrade = "Strong" | "Moderate" | "Weak" | "Very Weak";

export type PracticeMetricKey = "performanceIndex" | "acs" | "kd" | "hsRate";

export type PracticeSummary = {
  totalDeathmatch: number;
  totalTeamDeathmatch: number;
  totalPractice: number;
  averagePerformanceIndex: number;
  averageHsRate: number;
};

export type PracticeCorrelation = {
  key: PracticeMetricKey;
  label: string;
  value: number;
  grade: CorrelationGrade;
};

export type UserSettings = {
  dataSource: DataSourceType;
  defaultPeriod: PeriodType;
  defaultMetrics: MetricKey[];
  performanceWeights: {
    acs: number;
    kd: number;
    hsRate: number;
    win: number;
    difficulty: number;
  };
  correlationThresholds: {
    strong: number;
    moderate: number;
    weak: number;
  };
};

export type CompareRow = {
  id: string;
  label: string;
  agent?: string;
  map?: string;
  matches: number;
  winRate: number;
  kd: number;
  acs: number;
  hsRate: number;
  matchStrength: number;
  matchDifficulty: MatchDifficulty;
  performanceIndex: number;
  performanceGrade: PerformanceGrade;
  confidence: ConfidenceGrade;
};
