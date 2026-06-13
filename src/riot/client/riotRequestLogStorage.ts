import type { RiotRequestEndpoint, RiotRequestLog, RiotRequestLogSummary, RiotRequestStatus } from "./riotRequestLogTypes";

const RIOT_REQUEST_LOG_STORAGE_KEY = "valorant-improvement-analyzer-riot-request-logs";
const maxLogs = 50;
const endpoints: RiotRequestEndpoint[] = ["account", "matchList", "matchDetail"];
const statuses: RiotRequestStatus[] = ["success", "failed"];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeLog = (value: unknown): RiotRequestLog | null => {
  if (!isObject(value)) {
    return null;
  }

  const endpoint = value.endpoint;
  const status = value.status;

  if (
    typeof value.id !== "string" ||
    typeof value.timestamp !== "string" ||
    !endpoints.includes(endpoint as RiotRequestEndpoint) ||
    !statuses.includes(status as RiotRequestStatus) ||
    typeof value.durationMs !== "number" ||
    typeof value.mock !== "boolean"
  ) {
    return null;
  }

  return {
    durationMs: value.durationMs,
    endpoint: endpoint as RiotRequestEndpoint,
    errorMessage: typeof value.errorMessage === "string" ? value.errorMessage : undefined,
    id: value.id,
    mock: value.mock,
    retryAfterSeconds: typeof value.retryAfterSeconds === "number" ? value.retryAfterSeconds : undefined,
    status: status as RiotRequestStatus,
    statusCode: typeof value.statusCode === "number" ? value.statusCode : undefined,
    timestamp: value.timestamp,
  };
};

export const getRiotRequestLogStorageKey = () => RIOT_REQUEST_LOG_STORAGE_KEY;

export const loadRiotRequestLogs = (): RiotRequestLog[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(RIOT_REQUEST_LOG_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map(sanitizeLog).filter((log): log is RiotRequestLog => Boolean(log)).slice(0, maxLogs);
  } catch {
    return [];
  }
};

export const saveRiotRequestLogs = (logs: RiotRequestLog[]) => {
  const nextLogs = logs.slice(0, maxLogs);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(RIOT_REQUEST_LOG_STORAGE_KEY, JSON.stringify(nextLogs));
  }

  return nextLogs;
};

export const appendRiotRequestLog = (log: RiotRequestLog) => {
  return saveRiotRequestLogs([log, ...loadRiotRequestLogs()]);
};

export const clearRiotRequestLogs = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RIOT_REQUEST_LOG_STORAGE_KEY);
  }

  return [];
};

export const getRiotRequestLogSummary = (logs: RiotRequestLog[] = loadRiotRequestLogs()): RiotRequestLogSummary => {
  return {
    errorCount: logs.filter((log) => log.status === "failed").length,
    lastRequest: logs[0] ?? null,
    rateLimitedCount: logs.filter((log) => log.statusCode === 429).length,
    retryAfterSeconds: logs.find((log) => typeof log.retryAfterSeconds === "number")?.retryAfterSeconds,
    totalRequests: logs.length,
  };
};
