import type { RiotSyncState } from "../types";

const RIOT_SYNC_STORAGE_KEY = "valorant-improvement-analyzer-riot-sync";

export type RiotSyncSummary = {
  invalidNumbers: number;
  matches: number;
  missingFields: number;
  playerStats: number;
  timelineEvents: number;
  verificationPassed: boolean;
  weaponStats: number;
};

export type RiotSyncStorageState = {
  errorMessage?: string;
  lastSync: string | null;
  status: RiotSyncState;
  summary: RiotSyncSummary;
};

const emptySummary: RiotSyncSummary = {
  invalidNumbers: 0,
  matches: 0,
  missingFields: 0,
  playerStats: 0,
  timelineEvents: 0,
  verificationPassed: false,
  weaponStats: 0,
};

export const DEFAULT_RIOT_SYNC_STATE: RiotSyncStorageState = {
  lastSync: null,
  status: "idle",
  summary: emptySummary,
};

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isSyncState = (value: unknown): value is RiotSyncState => {
  return value === "idle" || value === "syncing" || value === "success" || value === "failed";
};

const sanitizeSummary = (value: unknown): RiotSyncSummary => {
  if (!isRecord(value)) {
    return emptySummary;
  }

  return {
    invalidNumbers: typeof value.invalidNumbers === "number" ? value.invalidNumbers : 0,
    matches: typeof value.matches === "number" ? value.matches : 0,
    missingFields: typeof value.missingFields === "number" ? value.missingFields : 0,
    playerStats: typeof value.playerStats === "number" ? value.playerStats : 0,
    timelineEvents: typeof value.timelineEvents === "number" ? value.timelineEvents : 0,
    verificationPassed:
      typeof value.verificationPassed === "boolean" ? value.verificationPassed : false,
    weaponStats: typeof value.weaponStats === "number" ? value.weaponStats : 0,
  };
};

const sanitizeState = (value: unknown): RiotSyncStorageState => {
  if (!isRecord(value)) {
    return DEFAULT_RIOT_SYNC_STATE;
  }

  return {
    errorMessage: typeof value.errorMessage === "string" ? value.errorMessage : undefined,
    lastSync: typeof value.lastSync === "string" ? value.lastSync : null,
    status: isSyncState(value.status) ? value.status : "idle",
    summary: sanitizeSummary(value.summary),
  };
};

export const loadRiotSyncState = (): RiotSyncStorageState => {
  if (!canUseLocalStorage()) {
    return DEFAULT_RIOT_SYNC_STATE;
  }

  const rawData = window.localStorage.getItem(RIOT_SYNC_STORAGE_KEY);

  if (!rawData) {
    return DEFAULT_RIOT_SYNC_STATE;
  }

  try {
    return sanitizeState(JSON.parse(rawData));
  } catch {
    return DEFAULT_RIOT_SYNC_STATE;
  }
};

export const saveRiotSyncState = (state: RiotSyncStorageState) => {
  const sanitizedState = sanitizeState(state);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(RIOT_SYNC_STORAGE_KEY, JSON.stringify(sanitizedState));
  }

  return sanitizedState;
};

export const getRiotSyncStorageKey = () => RIOT_SYNC_STORAGE_KEY;
