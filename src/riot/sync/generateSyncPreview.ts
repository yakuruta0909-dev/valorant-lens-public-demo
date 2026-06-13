import { loadRiotAccountState } from "../account/accountStorage";
import { createRiotApiClient } from "../client/riotApiClient";
import type { Match } from "../../types";
import { buildIncrementalMatchList } from "./buildIncrementalMatchList";
import { buildConflictPreview } from "./buildConflictPreview";
import { loadConflictResolutionState } from "./conflictResolutionStorage";
import { loadIncrementalSyncState } from "./incrementalSyncStorage";
import { loadMatchSyncState } from "./matchSyncStorage";
import type { MatchSyncData } from "./matchSyncTypes";
import { loadSyncPreview, saveSyncPreview } from "./syncPreviewStorage";
import type { GenerateSyncPreviewResult } from "./syncPreviewTypes";

const createPreviewMatch = (matchId: string): Match => ({
  averageRating: 0,
  map: "",
  matchId,
  mode: "Competitive",
  playedAt: "",
});

const buildPreviewData = (matchIds: string[]): MatchSyncData => ({
  matches: matchIds.map(createPreviewMatch),
  playerStats: [],
  timelineEvents: [],
  weaponStats: [],
});

export const generateSyncPreview = async (): Promise<GenerateSyncPreviewResult> => {
  const account = loadRiotAccountState().account;

  if (!account) {
    return {
      error: "Connected account is required.",
      preview: loadSyncPreview(),
    };
  }

  if (!account.puuid.trim()) {
    return {
      error: "Connected account PUUID is required.",
      preview: loadSyncPreview(),
    };
  }

  const client = createRiotApiClient({
    region: account.region,
  });
  const matchListResult = await client.getMatchList(account.puuid);

  if (!matchListResult.success || !matchListResult.data) {
    return {
      error: matchListResult.error ?? "Match list preview failed.",
      preview: loadSyncPreview(),
    };
  }

  const generatedAt = new Date().toISOString();
  const incomingMatchIds = matchListResult.data.matchIds;
  const matchSyncState = loadMatchSyncState();
  const incrementalState = loadIncrementalSyncState();
  const incrementalMatchList = buildIncrementalMatchList({
    forceFullSync: incrementalState.forceFullSync,
    matchIds: incomingMatchIds,
    syncedMatchIds: matchSyncState.matchIds,
  });
  const conflictState = loadConflictResolutionState();
  const conflictPreview = buildConflictPreview({
    existingData: matchSyncState.data,
    generatedAt,
    incomingData: buildPreviewData(incrementalMatchList.targetMatchIds),
    resolutionMode: conflictState.resolutionMode,
  });
  const preview = saveSyncPreview({
    accountPuuid: account.puuid,
    addCount: conflictPreview.summary.addCount,
    duplicateCount: conflictPreview.summary.duplicateCount,
    generatedAt,
    incomingMatchIds,
    readyToSync: incrementalMatchList.targetMatchIds.length > 0,
    resolutionMode: conflictPreview.resolutionMode,
    skippedMatchIds: incrementalMatchList.skippedMatchIds,
    syncMode: incrementalMatchList.mode,
    targetMatchIds: incrementalMatchList.targetMatchIds,
    updateCount: conflictPreview.summary.updateCount,
  });

  return {
    preview,
  };
};
