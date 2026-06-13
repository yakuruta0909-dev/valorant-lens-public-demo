import type { RawRiotMatch } from "../types";

export type CachedMatchDetail = {
  cachedAt: string;
  matchId: string;
  rawMatch: RawRiotMatch;
};

export type MatchCacheState = {
  matchDetails: CachedMatchDetail[];
};
