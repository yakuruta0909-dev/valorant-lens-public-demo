import type { RiotApiClient } from "../client/riotApiClient";
import type { RiotApiResult, RiotMatchDetailResponse } from "../client/riotApiTypes";
import { loadCachedMatchDetail, saveCachedMatchDetail } from "./syncCacheStorage";

export type CachedMatchDetailResult = RiotApiResult<RiotMatchDetailResponse> & {
  cacheHit: boolean;
};

export const getCachedMatchDetail = async (
  client: RiotApiClient,
  matchId: string,
): Promise<CachedMatchDetailResult> => {
  const cachedDetail = loadCachedMatchDetail(matchId);

  if (cachedDetail) {
    return {
      cacheHit: true,
      data: cachedDetail.rawMatch,
      statusCode: 200,
      success: true,
    };
  }

  const detailResult = await client.getMatchDetail(matchId);

  if (detailResult.success && detailResult.data) {
    saveCachedMatchDetail(matchId, detailResult.data);
  }

  return {
    ...detailResult,
    cacheHit: false,
  };
};
