import { loadRiotAccountState } from "../account/accountStorage";
import { adaptRiotMatchBundle } from "../adapters/riotMatchAdapter";
import { createRiotApiClient } from "../client/riotApiClient";
import type { RawRiotMatch } from "../types";
import { applyConflictResolution } from "./applyConflictResolution";
import { buildConflictPreview } from "./buildConflictPreview";
import { buildMatchSyncReview } from "./buildMatchSyncReview";
import { loadConflictResolutionState, saveConflictResolutionState } from "./conflictResolutionStorage";
import { loadMatchSyncReviewState, saveMatchSyncReviewState } from "./matchSyncReviewStorage";
import type { FailedMatchDetail } from "./matchSyncReviewTypes";
import { loadMatchSyncState, saveMatchSyncState } from "./matchSyncStorage";
import type { MatchSyncHistoryEntry, MatchSyncSummary } from "./matchSyncTypes";

export type RetryFailedMatchDetailsResult = {
  error?: string;
  failedMatches: FailedMatchDetail[];
};

const createHistoryId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `match-sync-retry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const retryFailedMatchDetails = async (): Promise<RetryFailedMatchDetailsResult> => {
  const account = loadRiotAccountState().account;
  const reviewState = loadMatchSyncReviewState();
  const failedMatches = reviewState.failedMatches;

  if (!account) {
    return {
      error: "Connected account is required.",
      failedMatches,
    };
  }

  if (!account.puuid.trim()) {
    return {
      error: "Connected account PUUID is required.",
      failedMatches,
    };
  }

  if (failedMatches.length === 0) {
    return {
      failedMatches: [],
    };
  }

  const client = createRiotApiClient({
    region: account.region,
  });
  const retriedMatches: RawRiotMatch[] = [];
  const nextFailedMatches: FailedMatchDetail[] = [];

  for (const failedMatch of failedMatches) {
    const detailResult = await client.getMatchDetail(failedMatch.matchId);

    if (detailResult.success && detailResult.data) {
      retriedMatches.push(detailResult.data);
    } else {
      nextFailedMatches.push({
        ...failedMatch,
        errorMessage: detailResult.error ?? failedMatch.errorMessage,
        retryCount: failedMatch.retryCount + 1,
        statusCode: detailResult.statusCode ?? failedMatch.statusCode,
      });
    }
  }

  const currentState = loadMatchSyncState();
  const bundles = retriedMatches.map(adaptRiotMatchBundle);
  const retryMatches = bundles.map((bundle) => bundle.match);
  const retryPlayerStats = bundles.flatMap((bundle) =>
    bundle.playerStats.filter((stats) => stats.playerPuuid === account.puuid),
  );
  const retryWeaponStats = bundles.flatMap((bundle) => bundle.weaponStats);
  const retryTimelineEvents = retriedMatches.flatMap((rawMatch) =>
    (rawMatch.timeline ?? []).map((event) => {
      const playerAgent = rawMatch.players.find((rawPlayer) => rawPlayer.puuid === account.puuid)?.agent;

      return {
        ...event,
        agent: event.agent ?? playerAgent,
        map: event.map ?? rawMatch.map,
        matchId: event.matchId ?? rawMatch.matchId,
      };
    }),
  );
  const incomingData = {
    matches: retryMatches,
    playerStats: retryPlayerStats,
    timelineEvents: retryTimelineEvents,
    weaponStats: retryWeaponStats,
  };
  const syncedAt = new Date().toISOString();
  const conflictState = loadConflictResolutionState();
  const conflictPreview = buildConflictPreview({
    existingData: currentState.data,
    generatedAt: syncedAt,
    incomingData,
    resolutionMode: conflictState.resolutionMode,
  });
  const nextData = applyConflictResolution({
    existingData: currentState.data,
    incomingData,
    preview: conflictPreview,
  });
  saveConflictResolutionState({
    ...conflictPreview,
    appliedAt: syncedAt,
  });
  const syncSummary: MatchSyncSummary = {
    accountPuuid: account.puuid,
    lastSync: syncedAt,
    success: nextData.matches.length > 0,
    syncedDetails: nextData.matches.length,
    syncedMatches: currentState.matchIds.length,
  };
  const historyEntry: MatchSyncHistoryEntry = {
    ...syncSummary,
    id: createHistoryId(),
  };

  saveMatchSyncState({
    data: nextData,
    matchIds: Array.from(new Set([...currentState.matchIds, ...retryMatches.map((match) => match.matchId)])),
    syncHistory: [historyEntry, ...currentState.syncHistory],
    syncSummary,
  });

  const review = buildMatchSyncReview({
    failedMatches: nextFailedMatches,
    successfulDetails: nextData.matches.length,
    totalMatchIds: currentState.matchIds.length,
  });
  saveMatchSyncReviewState({
    failedMatches: nextFailedMatches,
    lastReview: syncedAt,
    review,
  });

  return {
    failedMatches: nextFailedMatches,
  };
};
