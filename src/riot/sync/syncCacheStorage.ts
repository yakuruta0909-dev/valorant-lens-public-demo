import type { RawRiotMatch } from "../types";
import type { CachedMatchDetail, MatchCacheState } from "./syncCacheTypes";

const MATCH_CACHE_STORAGE_KEY = "valorant-improvement-analyzer-riot-match-cache";

export const DEFAULT_MATCH_CACHE_STATE: MatchCacheState = {
  matchDetails: [],
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const sanitizeCachedMatchDetail = (value: unknown): CachedMatchDetail | null => {
  if (!isObject(value) || !isObject(value.rawMatch)) {
    return null;
  }

  if (
    typeof value.cachedAt !== "string" ||
    typeof value.matchId !== "string" ||
    typeof value.rawMatch.matchId !== "string"
  ) {
    return null;
  }

  return {
    cachedAt: value.cachedAt,
    matchId: value.matchId,
    rawMatch: value.rawMatch as RawRiotMatch,
  };
};

const sanitizeState = (value: unknown): MatchCacheState => {
  if (!isObject(value)) {
    return DEFAULT_MATCH_CACHE_STATE;
  }

  return {
    matchDetails: Array.isArray(value.matchDetails)
      ? value.matchDetails
          .map(sanitizeCachedMatchDetail)
          .filter((detail): detail is CachedMatchDetail => Boolean(detail))
      : [],
  };
};

export const getMatchCacheStorageKey = () => MATCH_CACHE_STORAGE_KEY;

export const loadMatchCache = (): MatchCacheState => {
  if (!canUseLocalStorage()) {
    return DEFAULT_MATCH_CACHE_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(MATCH_CACHE_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_MATCH_CACHE_STATE;
    }

    return sanitizeState(JSON.parse(rawValue) as unknown);
  } catch {
    return DEFAULT_MATCH_CACHE_STATE;
  }
};

export const saveMatchCache = (state: MatchCacheState): MatchCacheState => {
  const nextState = sanitizeState(state);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(MATCH_CACHE_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
};

export const loadCachedMatchDetail = (matchId: string): CachedMatchDetail | null =>
  loadMatchCache().matchDetails.find((detail) => detail.matchId === matchId) ?? null;

export const saveCachedMatchDetail = (matchId: string, rawMatch: RawRiotMatch): CachedMatchDetail => {
  const currentState = loadMatchCache();
  const cachedDetail: CachedMatchDetail = {
    cachedAt: new Date().toISOString(),
    matchId,
    rawMatch,
  };

  saveMatchCache({
    matchDetails: [
      cachedDetail,
      ...currentState.matchDetails.filter((detail) => detail.matchId !== matchId),
    ],
  });

  return cachedDetail;
};

export const clearMatchCache = (): MatchCacheState => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(MATCH_CACHE_STORAGE_KEY);
  }

  return DEFAULT_MATCH_CACHE_STATE;
};

export const getMatchCacheSummary = () => {
  const matchDetails = loadMatchCache().matchDetails;
  const lastCachedAt = matchDetails.reduce<string | null>((latest, detail) => {
    if (!latest || detail.cachedAt > latest) {
      return detail.cachedAt;
    }

    return latest;
  }, null);

  return {
    count: matchDetails.length,
    lastCachedAt,
  };
};
