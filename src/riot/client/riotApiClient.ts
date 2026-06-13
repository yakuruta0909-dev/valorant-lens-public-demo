import { MOCK_RIOT_ACCOUNT } from "../mock/mockAccount";
import { mockRiotMatches } from "../mock/mockMatches";
import type { RawRiotMatch } from "../types";
import {
  DEFAULT_RIOT_API_CONFIG,
  getRiotApiConfig,
  isRiotApiConfigured,
  isPublicDemoMode,
  isRealModeAllowed,
  RIOT_API_KEY_EXPOSED_WARNING,
  RIOT_API_RATE_LIMIT_MOCK,
} from "./riotApiConfig";
import { formatRiotApiError, RiotApiErrorCode } from "./riotApiErrors";
import { logRiotRequest } from "./logRiotRequest";
import type {
  RiotAccountLookupResponse,
  RiotApiClientStatus,
  RiotApiConfig,
  RiotApiConfigInput,
  RiotApiLastRequestResult,
  RiotApiResult,
  RiotMatchDetailResponse,
  RiotMatchListResponse,
} from "./riotApiTypes";
import type { RiotRequestEndpoint, RiotRequestStatus } from "./riotRequestLogTypes";

const noRequestResult: RiotApiLastRequestResult = {
  endpoint: "none",
  message: "No Riot API request executed. Mock client is ready.",
  success: true,
  timestamp: null,
};

export class RiotApiClient {
  private lastRequestResult: RiotApiLastRequestResult = noRequestResult;
  private readonly config: RiotApiConfig;

  constructor(config: RiotApiConfigInput = DEFAULT_RIOT_API_CONFIG) {
    const envConfig = getRiotApiConfig();

    this.config = {
      apiKey: config.apiKey ?? envConfig.apiKey,
      mode: isPublicDemoMode() ? "mock" : config.mode ?? envConfig.mode,
      region: config.region ?? envConfig.region,
    };
  }

  getStatus(): RiotApiClientStatus {
    return {
      apiConfigured: isRiotApiConfigured(this.config),
      apiKeyExposedWarning: RIOT_API_KEY_EXPOSED_WARNING,
      lastRequestResult: this.lastRequestResult,
      mockMode: this.config.mode === "mock",
      mode: this.config.mode,
      publicDemoMode: isPublicDemoMode(),
      productionRealModeBlocked: this.config.mode === "real" && !isRealModeAllowed(this.config),
      rateLimit: RIOT_API_RATE_LIMIT_MOCK,
      region: this.config.region,
    };
  }

  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotApiResult<RiotAccountLookupResponse>> {
    if (this.config.mode === "real") {
      return this.getRealAccountByRiotId(gameName, tagLine);
    }

    const startedAt = Date.now();
    this.recordRequest({
      durationMs: Date.now() - startedAt,
      endpoint: "account",
      lastRequestEndpoint: "getAccountByRiotId",
      message: "Mock account response returned.",
      status: "success",
      statusCode: 200,
    });

    return {
      data: {
        ...MOCK_RIOT_ACCOUNT,
        gameName: gameName || MOCK_RIOT_ACCOUNT.gameName,
        tagLine: tagLine || MOCK_RIOT_ACCOUNT.tagLine,
      },
      statusCode: 200,
      success: true,
    };
  }

  async getMatchList(puuid: string): Promise<RiotApiResult<RiotMatchListResponse>> {
    if (this.config.mode === "real") {
      return this.getRealMatchList(puuid);
    }

    const startedAt = Date.now();
    this.recordRequest({
      durationMs: Date.now() - startedAt,
      endpoint: "matchList",
      lastRequestEndpoint: "getMatchList",
      message: "Mock match list response returned.",
      status: "success",
      statusCode: 200,
    });

    return {
      data: {
        matchIds: mockRiotMatches.map((match) => match.matchId),
        puuid,
      },
      statusCode: 200,
      success: true,
    };
  }

  async getMatchDetail(matchId: string): Promise<RiotApiResult<RiotMatchDetailResponse>> {
    if (this.config.mode === "real") {
      return this.getRealMatchDetail(matchId);
    }

    const startedAt = Date.now();
    const match = mockRiotMatches.find((rawMatch) => rawMatch.matchId === matchId);

    if (!match) {
      const error = formatRiotApiError(RiotApiErrorCode.NotFound);
      this.recordRequest({
        durationMs: Date.now() - startedAt,
        endpoint: "matchDetail",
        errorMessage: error,
        lastRequestEndpoint: "getMatchDetail",
        message: error,
        status: "failed",
        statusCode: RiotApiErrorCode.NotFound,
      });

      return {
        error,
        statusCode: RiotApiErrorCode.NotFound,
        success: false,
      };
    }

    this.recordRequest({
      durationMs: Date.now() - startedAt,
      endpoint: "matchDetail",
      lastRequestEndpoint: "getMatchDetail",
      message: "Mock match detail response returned.",
      status: "success",
      statusCode: 200,
    });

    return {
      data: match,
      statusCode: 200,
      success: true,
    };
  }

  private async getRealAccountByRiotId(
    gameName: string,
    tagLine: string,
  ): Promise<RiotApiResult<RiotAccountLookupResponse>> {
    const encodedGameName = encodeURIComponent(gameName);
    const encodedTagLine = encodeURIComponent(tagLine);
    const result = await this.fetchRiotJson<RiotAccountLookupResponse>({
      endpoint: "account",
      lastRequestEndpoint: "getAccountByRiotId",
      url: `https://${this.config.region.toLowerCase()}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`,
    });

    if (!result.success || !result.data) {
      return result;
    }

    return {
      ...result,
      data: {
        ...result.data,
        region: this.config.region,
      },
    };
  }

  private async getRealMatchList(puuid: string): Promise<RiotApiResult<RiotMatchListResponse>> {
    const encodedPuuid = encodeURIComponent(puuid);
    const rawResult = await this.fetchRiotJson<{ puuid?: string; history?: Array<{ matchId?: string }> }>({
      endpoint: "matchList",
      lastRequestEndpoint: "getMatchList",
      url: `https://${this.config.region.toLowerCase()}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${encodedPuuid}`,
    });

    if (!rawResult.success || !rawResult.data) {
      return {
        error: rawResult.error,
        retryAfterSeconds: rawResult.retryAfterSeconds,
        statusCode: rawResult.statusCode,
        success: false,
      };
    }

    return {
      ...rawResult,
      data: {
        matchIds: Array.isArray(rawResult.data.history)
          ? rawResult.data.history
              .map((entry) => entry.matchId)
              .filter((matchId): matchId is string => typeof matchId === "string")
          : [],
        puuid: rawResult.data.puuid ?? puuid,
      },
    };
  }

  private async getRealMatchDetail(matchId: string): Promise<RiotApiResult<RiotMatchDetailResponse>> {
    const encodedMatchId = encodeURIComponent(matchId);

    return this.fetchRiotJson<RiotMatchDetailResponse>({
      endpoint: "matchDetail",
      lastRequestEndpoint: "getMatchDetail",
      url: `https://${this.config.region.toLowerCase()}.api.riotgames.com/val/match/v1/matches/${encodedMatchId}`,
    });
  }

  private async fetchRiotJson<T>({
    endpoint,
    lastRequestEndpoint,
    url,
  }: {
    endpoint: RiotRequestEndpoint;
    lastRequestEndpoint: RiotApiLastRequestResult["endpoint"];
    url: string;
  }): Promise<RiotApiResult<T>> {
    const startedAt = Date.now();
    const guardResult = this.getRealModeGuardResult<T>();

    if (guardResult) {
      this.recordRequest({
        durationMs: Date.now() - startedAt,
        endpoint,
        errorMessage: guardResult.error,
        lastRequestEndpoint,
        message: guardResult.error ?? "Riot API real mode is not available.",
        status: "failed",
        statusCode: guardResult.statusCode,
      });
      return guardResult;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "X-Riot-Token": this.config.apiKey,
        },
      });
      const retryAfterSeconds = this.parseRetryAfter(response.headers.get("Retry-After"));

      if (!response.ok) {
        const statusCode = this.toKnownStatusCode(response.status);
        const error = statusCode
          ? formatRiotApiError(statusCode)
          : `${response.status}: Riot API request failed.`;

        this.recordRequest({
          durationMs: Date.now() - startedAt,
          endpoint,
          errorMessage: error,
          lastRequestEndpoint,
          message: error,
          retryAfterSeconds,
          status: "failed",
          statusCode: response.status,
        });

        return {
          error,
          retryAfterSeconds,
          statusCode: response.status,
          success: false,
        };
      }

      const data = (await response.json()) as T;
      this.recordRequest({
        durationMs: Date.now() - startedAt,
        endpoint,
        lastRequestEndpoint,
        message: "Riot API real response returned.",
        retryAfterSeconds,
        status: "success",
        statusCode: response.status,
      });

      return {
        data,
        retryAfterSeconds,
        statusCode: response.status,
        success: true,
      };
    } catch {
      const error = "Riot API network request failed.";
      this.recordRequest({
        durationMs: Date.now() - startedAt,
        endpoint,
        errorMessage: error,
        lastRequestEndpoint,
        message: error,
        status: "failed",
        statusCode: RiotApiErrorCode.ServiceUnavailable,
      });

      return {
        error,
        statusCode: RiotApiErrorCode.ServiceUnavailable,
        success: false,
      };
    }
  }

  private getRealModeGuardResult<T>(): RiotApiResult<T> | null {
    if (!isRiotApiConfigured(this.config)) {
      return {
        error: "Riot API key is not configured. Real mode is disabled.",
        statusCode: RiotApiErrorCode.Unauthorized,
        success: false,
      };
    }

    if (!isRealModeAllowed(this.config)) {
      return {
        error: "Riot API real mode is blocked outside local dev verification.",
        statusCode: RiotApiErrorCode.Forbidden,
        success: false,
      };
    }

    return null;
  }

  private parseRetryAfter(value: string | null): number | undefined {
    if (!value) {
      return undefined;
    }

    const retryAfterSeconds = Number(value);
    return Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined;
  }

  private toKnownStatusCode(statusCode: number): RiotApiErrorCode | null {
    if (
      statusCode === RiotApiErrorCode.Unauthorized ||
      statusCode === RiotApiErrorCode.Forbidden ||
      statusCode === RiotApiErrorCode.NotFound ||
      statusCode === RiotApiErrorCode.RateLimited ||
      statusCode === RiotApiErrorCode.InternalServerError ||
      statusCode === RiotApiErrorCode.ServiceUnavailable
    ) {
      return statusCode;
    }

    return null;
  }

  private recordRequest({
    durationMs,
    endpoint,
    errorMessage,
    lastRequestEndpoint,
    message,
    retryAfterSeconds,
    status,
    statusCode,
  }: {
    durationMs: number;
    endpoint: RiotRequestEndpoint;
    errorMessage?: string;
    lastRequestEndpoint: RiotApiLastRequestResult["endpoint"];
    message: string;
    status: RiotRequestStatus;
    statusCode?: number;
    retryAfterSeconds?: number;
  }) {
    this.lastRequestResult = {
      endpoint: lastRequestEndpoint,
      message,
      success: status === "success",
      timestamp: new Date().toISOString(),
    };
    logRiotRequest({
      durationMs,
      endpoint,
      errorMessage,
      mock: this.config.mode === "mock",
      retryAfterSeconds,
      status,
      statusCode,
    });
  }
}

export const createRiotApiClient = (config: RiotApiConfigInput = DEFAULT_RIOT_API_CONFIG) =>
  new RiotApiClient(config);

export const getRiotApiClientStatus = (config: RiotApiConfigInput = DEFAULT_RIOT_API_CONFIG): RiotApiClientStatus =>
  createRiotApiClient(config).getStatus();

export const getMockRiotMatchDetail = (): RawRiotMatch | undefined => mockRiotMatches[0];
