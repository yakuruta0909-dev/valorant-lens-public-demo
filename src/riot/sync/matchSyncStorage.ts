import type { MatchSyncData, MatchSyncHistoryEntry, MatchSyncStorageState, MatchSyncSummary } from "./matchSyncTypes";

const MATCH_SYNC_STORAGE_KEY = "valorant-improvement-analyzer-riot-match-sync";
const maxHistory = 10;

const emptyData: MatchSyncData = {
  matches: [],
  playerStats: [],
  timelineEvents: [],
  weaponStats: [],
};

export const DEFAULT_MATCH_SYNC_STATE: MatchSyncStorageState = {
  data: emptyData,
  matchIds: [],
  syncHistory: [],
  syncSummary: null,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeSummary = (value: unknown): MatchSyncSummary | null => {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.accountPuuid !== "string" ||
    typeof value.syncedMatches !== "number" ||
    typeof value.syncedDetails !== "number" ||
    typeof value.success !== "boolean" ||
    typeof value.lastSync !== "string"
  ) {
    return null;
  }

  return {
    accountPuuid: value.accountPuuid,
    lastSync: value.lastSync,
    success: value.success,
    syncedDetails: value.syncedDetails,
    syncedMatches: value.syncedMatches,
  };
};

const sanitizeHistoryEntry = (value: unknown): MatchSyncHistoryEntry | null => {
  if (!isObject(value) || typeof value.id !== "string") {
    return null;
  }

  const summary = sanitizeSummary(value);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    id: value.id,
  };
};

const sanitizeState = (value: unknown): MatchSyncStorageState => {
  if (!isObject(value)) {
    return DEFAULT_MATCH_SYNC_STATE;
  }

  const data = isObject(value.data)
    ? {
        matches: Array.isArray(value.data.matches) ? value.data.matches : [],
        playerStats: Array.isArray(value.data.playerStats) ? value.data.playerStats : [],
        timelineEvents: Array.isArray(value.data.timelineEvents) ? value.data.timelineEvents : [],
        weaponStats: Array.isArray(value.data.weaponStats) ? value.data.weaponStats : [],
      }
    : emptyData;

  return {
    data,
    matchIds: Array.isArray(value.matchIds) ? value.matchIds.filter((matchId): matchId is string => typeof matchId === "string") : [],
    syncHistory: Array.isArray(value.syncHistory)
      ? value.syncHistory.map(sanitizeHistoryEntry).filter((entry): entry is MatchSyncHistoryEntry => Boolean(entry)).slice(0, maxHistory)
      : [],
    syncSummary: sanitizeSummary(value.syncSummary),
  };
};

export const getMatchSyncStorageKey = () => MATCH_SYNC_STORAGE_KEY;

export const loadMatchSyncState = (): MatchSyncStorageState => {
  if (typeof window === "undefined") {
    return DEFAULT_MATCH_SYNC_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(MATCH_SYNC_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_MATCH_SYNC_STATE;
    }

    return sanitizeState(JSON.parse(rawValue) as unknown);
  } catch {
    return DEFAULT_MATCH_SYNC_STATE;
  }
};

export const saveMatchSyncState = (state: MatchSyncStorageState): MatchSyncStorageState => {
  const nextState: MatchSyncStorageState = {
    ...state,
    syncHistory: state.syncHistory.slice(0, maxHistory),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(MATCH_SYNC_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
};

export const clearMatchSyncState = (): MatchSyncStorageState => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(MATCH_SYNC_STORAGE_KEY);
  }

  return DEFAULT_MATCH_SYNC_STATE;
};
