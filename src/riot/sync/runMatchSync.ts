import { loadRiotAccountState } from "../account/accountStorage";
import { createRiotApiClient } from "../client/riotApiClient";
import { adaptRiotMatchBundle } from "../adapters/riotMatchAdapter";
import type { RawRiotMatch } from "../types";
import { applyConflictResolution } from "./applyConflictResolution";
import { buildIncrementalMatchList } from "./buildIncrementalMatchList";
import { buildConflictPreview } from "./buildConflictPreview";
import { buildMatchSyncReview } from "./buildMatchSyncReview";
import { loadConflictResolutionState, saveConflictResolutionState } from "./conflictResolutionStorage";
import { getCachedMatchDetail } from "./getCachedMatchDetail";
import { loadIncrementalSyncState, updateIncrementalSyncSummary } from "./incrementalSyncStorage";
import { saveMatchSyncReviewState } from "./matchSyncReviewStorage";
import type { FailedMatchDetail } from "./matchSyncReviewTypes";
import { loadMatchSyncState, saveMatchSyncState } from "./matchSyncStorage";
import type { MatchSyncStorageState, MatchSyncSummary } from "./matchSyncTypes";

export type MatchSyncRunResult = {
  error?: string;
  state: MatchSyncStorageState;
};

const createHistoryId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `match-sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const runMatchSync = async (): Promise<MatchSyncRunResult> => {
  const accountState = loadRiotAccountState();
  const account = accountState.account;

  if (!account) {
    return {
      error: "Connected account is required.",
      state: loadMatchSyncState(),
    };
  }

  if (!account.puuid.trim()) {
    return {
      error: "Connected account PUUID is required.",
      state: loadMatchSyncState(),
    };
  }

  const client = createRiotApiClient({
    region: account.region,
  });
  const accountResult = await client.getAccountByRiotId(account.gameName, account.tagLine);

  if (!accountResult.success || !accountResult.data?.puuid) {
    return {
      error: accountResult.error ?? "Account validation failed.",
      state: loadMatchSyncState(),
    };
  }

  const matchListResult = await client.getMatchList(accountResult.data.puuid);

  if (!matchListResult.success || !matchListResult.data) {
    return {
      error: matchListResult.error ?? "Match list sync failed.",
      state: loadMatchSyncState(),
    };
  }

  const rawMatches: RawRiotMatch[] = [];
  const failedMatches: FailedMatchDetail[] = [];
  const previousState = loadMatchSyncState();
  const incrementalState = loadIncrementalSyncState();
  const incrementalMatchList = buildIncrementalMatchList({
    forceFullSync: incrementalState.forceFullSync,
    matchIds: matchListResult.data.matchIds,
    syncedMatchIds: previousState.matchIds,
  });

  for (const matchId of incrementalMatchList.targetMatchIds) {
    const detailResult = await getCachedMatchDetail(client, matchId);

    if (detailResult.success && detailResult.data) {
      rawMatches.push(detailResult.data);
    } else {
      failedMatches.push({
        errorMessage: detailResult.error ?? "Match detail sync failed.",
        matchId,
        retryCount: 0,
        statusCode: detailResult.statusCode ?? 500,
      });
    }
  }

  const bundles = rawMatches.map(adaptRiotMatchBundle);
  const matches = bundles.map((bundle) => bundle.match);
  const playerStats = bundles.flatMap((bundle) =>
    bundle.playerStats.filter((stats) => stats.playerPuuid === accountResult.data?.puuid),
  );
  const weaponStats = bundles.flatMap((bundle) => bundle.weaponStats);
  const timelineEvents = rawMatches.flatMap((rawMatch) =>
    (rawMatch.timeline ?? []).map((event) => {
      const playerAgent = rawMatch.players.find((rawPlayer) => rawPlayer.puuid === accountResult.data?.puuid)?.agent;

      return {
        ...event,
        agent: event.agent ?? playerAgent,
        map: event.map ?? rawMatch.map,
        matchId: event.matchId ?? rawMatch.matchId,
      };
    }),
  );
  const syncedAt = new Date().toISOString();
  const syncSummary: MatchSyncSummary = {
    accountPuuid: accountResult.data.puuid,
    lastSync: syncedAt,
    success: rawMatches.length > 0 || incrementalMatchList.targetMatchIds.length === 0,
    syncedDetails: rawMatches.length,
    syncedMatches: matchListResult.data.matchIds.length,
  };
  const incomingData = {
    matches,
    playerStats,
    timelineEvents,
    weaponStats,
  };
  const conflictState = loadConflictResolutionState();
  const conflictPreview = buildConflictPreview({
    existingData: previousState.data,
    generatedAt: syncedAt,
    incomingData,
    resolutionMode: conflictState.resolutionMode,
  });
  const resolvedData = applyConflictResolution({
    existingData: previousState.data,
    incomingData,
    preview: conflictPreview,
  });
  saveConflictResolutionState({
    ...conflictPreview,
    appliedAt: syncedAt,
  });
  updateIncrementalSyncSummary({
    forceFullSync: false,
    lastMode: incrementalMatchList.mode,
    lastRunAt: syncedAt,
    lastSkippedMatchIds: incrementalMatchList.skippedMatchIds.length,
    lastTargetMatchIds: incrementalMatchList.targetMatchIds.length,
    lastTotalMatchIds: incrementalMatchList.totalMatchIds.length,
  });
  const nextState = saveMatchSyncState({
    data: resolvedData,
    matchIds: Array.from(new Set([...previousState.matchIds, ...matchListResult.data.matchIds])),
    syncHistory: [
      {
        ...syncSummary,
        id: createHistoryId(),
      },
      ...previousState.syncHistory,
    ],
    syncSummary,
  });
  const review = buildMatchSyncReview({
    failedMatches,
    successfulDetails: rawMatches.length,
    totalMatchIds: matchListResult.data.matchIds.length,
  });
  saveMatchSyncReviewState({
    failedMatches,
    lastReview: syncedAt,
    review,
  });

  return {
    error:
      rawMatches.length === 0 && incrementalMatchList.targetMatchIds.length > 0
        ? "All match details failed."
        : undefined,
    state: nextState,
  };
};
