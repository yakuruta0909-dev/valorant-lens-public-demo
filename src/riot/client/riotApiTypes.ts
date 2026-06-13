import type { RiotAccount, RiotRegion, RawRiotMatch } from "../types";

export type RiotApiMode = "mock" | "real";

export type RiotApiConfig = {
  apiKey: string;
  mode: RiotApiMode;
  region: RiotRegion;
};

export type RiotApiConfigInput = Partial<RiotApiConfig>;

export type RiotApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  retryAfterSeconds?: number;
  statusCode?: number;
};

export type RiotApiClientStatus = {
  apiConfigured: boolean;
  apiKeyExposedWarning: string;
  lastRequestResult: RiotApiLastRequestResult;
  mockMode: boolean;
  mode: RiotApiMode;
  publicDemoMode: boolean;
  productionRealModeBlocked: boolean;
  rateLimit: RiotApiRateLimitMock;
  region: RiotRegion;
  retryAfterSeconds?: number;
};

export type RiotApiRateLimitMock = {
  remaining: number;
  resetInSeconds: number;
};

export type RiotApiLastRequestResult = {
  endpoint: "none" | "getAccountByRiotId" | "getMatchList" | "getMatchDetail";
  message: string;
  success: boolean;
  timestamp: string | null;
};

export type RiotAccountLookupResponse = RiotAccount;

export type RiotMatchListResponse = {
  matchIds: string[];
  puuid: string;
};

export type RiotMatchDetailResponse = RawRiotMatch;
