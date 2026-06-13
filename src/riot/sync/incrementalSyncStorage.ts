import type { IncrementalSyncMode, IncrementalSyncState } from "./incrementalSyncTypes";

const INCREMENTAL_SYNC_STORAGE_KEY = "valorant-improvement-analyzer-riot-incremental-sync";

export const DEFAULT_INCREMENTAL_SYNC_STATE: IncrementalSyncState = {
  forceFullSync: false,
  lastMode: "incremental",
  lastRunAt: null,
  lastSkippedMatchIds: 0,
  lastTargetMatchIds: 0,
  lastTotalMatchIds: 0,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSyncMode = (value: unknown): value is IncrementalSyncMode =>
  value === "incremental" || value === "full";

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const sanitizeState = (value: unknown): IncrementalSyncState => {
  if (!isObject(value)) {
    return DEFAULT_INCREMENTAL_SYNC_STATE;
  }

  return {
    forceFullSync: typeof value.forceFullSync === "boolean" ? value.forceFullSync : false,
    lastMode: isSyncMode(value.lastMode) ? value.lastMode : "incremental",
    lastRunAt: typeof value.lastRunAt === "string" ? value.lastRunAt : null,
    lastSkippedMatchIds: typeof value.lastSkippedMatchIds === "number" ? value.lastSkippedMatchIds : 0,
    lastTargetMatchIds: typeof value.lastTargetMatchIds === "number" ? value.lastTargetMatchIds : 0,
    lastTotalMatchIds: typeof value.lastTotalMatchIds === "number" ? value.lastTotalMatchIds : 0,
  };
};

export const getIncrementalSyncStorageKey = () => INCREMENTAL_SYNC_STORAGE_KEY;

export const loadIncrementalSyncState = (): IncrementalSyncState => {
  if (!canUseLocalStorage()) {
    return DEFAULT_INCREMENTAL_SYNC_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(INCREMENTAL_SYNC_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_INCREMENTAL_SYNC_STATE;
    }

    return sanitizeState(JSON.parse(rawValue) as unknown);
  } catch {
    return DEFAULT_INCREMENTAL_SYNC_STATE;
  }
};

export const saveIncrementalSyncState = (state: IncrementalSyncState): IncrementalSyncState => {
  const nextState = sanitizeState(state);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(INCREMENTAL_SYNC_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
};

export const updateIncrementalSyncSummary = ({
  forceFullSync = false,
  lastMode,
  lastRunAt = new Date().toISOString(),
  lastSkippedMatchIds,
  lastTargetMatchIds,
  lastTotalMatchIds,
}: {
  forceFullSync?: boolean;
  lastMode: IncrementalSyncMode;
  lastRunAt?: string;
  lastSkippedMatchIds: number;
  lastTargetMatchIds: number;
  lastTotalMatchIds: number;
}) =>
  saveIncrementalSyncState({
    forceFullSync,
    lastMode,
    lastRunAt,
    lastSkippedMatchIds,
    lastTargetMatchIds,
    lastTotalMatchIds,
  });
