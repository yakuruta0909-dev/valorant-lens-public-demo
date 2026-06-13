import { getRiotApiConfig } from "./riotApiConfig";
import { appendRiotRequestLog } from "./riotRequestLogStorage";
import type { RiotRequestEndpoint, RiotRequestLog, RiotRequestStatus } from "./riotRequestLogTypes";

const createLogId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `riot-request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const logRiotRequest = ({
  durationMs,
  endpoint,
  errorMessage,
  mock,
  retryAfterSeconds,
  status,
  statusCode,
}: {
  durationMs: number;
  endpoint: RiotRequestEndpoint;
  errorMessage?: string;
  mock?: boolean;
  retryAfterSeconds?: number;
  status: RiotRequestStatus;
  statusCode?: number;
}): RiotRequestLog => {
  const log: RiotRequestLog = {
    durationMs,
    endpoint,
    errorMessage,
    id: createLogId(),
    mock: mock ?? getRiotApiConfig().mode === "mock",
    retryAfterSeconds,
    status,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  appendRiotRequestLog(log);
  return log;
};
