export enum RiotApiErrorCode {
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  RateLimited = 429,
  InternalServerError = 500,
  ServiceUnavailable = 503,
}

export const RIOT_API_ERROR_MESSAGES: Record<RiotApiErrorCode, string> = {
  [RiotApiErrorCode.Unauthorized]: "Unauthorized request.",
  [RiotApiErrorCode.Forbidden]: "Forbidden request.",
  [RiotApiErrorCode.NotFound]: "Requested Riot resource was not found.",
  [RiotApiErrorCode.RateLimited]: "Riot API rate limit reached.",
  [RiotApiErrorCode.InternalServerError]: "Riot API internal server error.",
  [RiotApiErrorCode.ServiceUnavailable]: "Riot API service unavailable.",
};

export const formatRiotApiError = (code: RiotApiErrorCode) => `${code}: ${RIOT_API_ERROR_MESSAGES[code]}`;
