import type { ConflictResolutionMode } from "./conflictResolutionTypes";
import type { SyncPreview } from "./syncPreviewTypes";

const SYNC_PREVIEW_STORAGE_KEY = "valorant-improvement-analyzer-riot-sync-preview";

export const DEFAULT_SYNC_PREVIEW: SyncPreview = {
  accountPuuid: "",
  addCount: 0,
  duplicateCount: 0,
  generatedAt: "",
  incomingMatchIds: [],
  readyToSync: false,
  resolutionMode: "merge",
  skippedMatchIds: [],
  syncMode: "incremental",
  targetMatchIds: [],
  updateCount: 0,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isResolutionMode = (value: unknown): value is ConflictResolutionMode =>
  value === "skip" || value === "overwrite" || value === "merge";

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const sanitizeSyncPreview = (value: unknown): SyncPreview => {
  if (!isObject(value)) {
    return DEFAULT_SYNC_PREVIEW;
  }

  return {
    accountPuuid: typeof value.accountPuuid === "string" ? value.accountPuuid : "",
    addCount: typeof value.addCount === "number" ? value.addCount : 0,
    duplicateCount: typeof value.duplicateCount === "number" ? value.duplicateCount : 0,
    generatedAt: typeof value.generatedAt === "string" ? value.generatedAt : "",
    incomingMatchIds: Array.isArray(value.incomingMatchIds)
      ? value.incomingMatchIds.filter((matchId): matchId is string => typeof matchId === "string")
      : [],
    readyToSync: typeof value.readyToSync === "boolean" ? value.readyToSync : false,
    resolutionMode: isResolutionMode(value.resolutionMode) ? value.resolutionMode : "merge",
    skippedMatchIds: Array.isArray(value.skippedMatchIds)
      ? value.skippedMatchIds.filter((matchId): matchId is string => typeof matchId === "string")
      : [],
    syncMode: value.syncMode === "full" ? "full" : "incremental",
    targetMatchIds: Array.isArray(value.targetMatchIds)
      ? value.targetMatchIds.filter((matchId): matchId is string => typeof matchId === "string")
      : [],
    updateCount: typeof value.updateCount === "number" ? value.updateCount : 0,
  };
};

export const getSyncPreviewStorageKey = () => SYNC_PREVIEW_STORAGE_KEY;

export const loadSyncPreview = (): SyncPreview => {
  if (!canUseLocalStorage()) {
    return DEFAULT_SYNC_PREVIEW;
  }

  try {
    const rawValue = window.localStorage.getItem(SYNC_PREVIEW_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_SYNC_PREVIEW;
    }

    return sanitizeSyncPreview(JSON.parse(rawValue) as unknown);
  } catch {
    return DEFAULT_SYNC_PREVIEW;
  }
};

export const saveSyncPreview = (preview: SyncPreview): SyncPreview => {
  const nextPreview = sanitizeSyncPreview(preview);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(SYNC_PREVIEW_STORAGE_KEY, JSON.stringify(nextPreview));
  }

  return nextPreview;
};
