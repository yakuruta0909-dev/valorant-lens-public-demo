export type IncrementalSyncMode = "incremental" | "full";

export type IncrementalSyncSettings = {
  forceFullSync: boolean;
};

export type IncrementalSyncSummary = {
  lastMode: IncrementalSyncMode;
  lastRunAt: string | null;
  lastSkippedMatchIds: number;
  lastTargetMatchIds: number;
  lastTotalMatchIds: number;
};

export type IncrementalSyncState = IncrementalSyncSettings & IncrementalSyncSummary;

export type IncrementalMatchList = {
  mode: IncrementalSyncMode;
  skippedMatchIds: string[];
  targetMatchIds: string[];
  totalMatchIds: string[];
};
