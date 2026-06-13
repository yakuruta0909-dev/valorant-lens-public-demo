export type RiotRequestEndpoint = "account" | "matchList" | "matchDetail";

export type RiotRequestStatus = "success" | "failed";

export type RiotRequestLog = {
  id: string;
  timestamp: string;
  endpoint: RiotRequestEndpoint;
  status: RiotRequestStatus;
  statusCode?: number;
  durationMs: number;
  mock: boolean;
  errorMessage?: string;
  retryAfterSeconds?: number;
};

export type RiotRequestLogSummary = {
  lastRequest: RiotRequestLog | null;
  errorCount: number;
  rateLimitedCount: number;
  retryAfterSeconds?: number;
  totalRequests: number;
};
