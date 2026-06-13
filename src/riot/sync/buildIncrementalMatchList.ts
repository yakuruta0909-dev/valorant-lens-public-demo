import type { IncrementalMatchList } from "./incrementalSyncTypes";

export const buildIncrementalMatchList = ({
  forceFullSync,
  matchIds,
  syncedMatchIds,
}: {
  forceFullSync: boolean;
  matchIds: string[];
  syncedMatchIds: string[];
}): IncrementalMatchList => {
  const totalMatchIds = Array.from(new Set(matchIds));

  if (forceFullSync) {
    return {
      mode: "full",
      skippedMatchIds: [],
      targetMatchIds: totalMatchIds,
      totalMatchIds,
    };
  }

  const syncedMatchIdSet = new Set(syncedMatchIds);
  const targetMatchIds = totalMatchIds.filter((matchId) => !syncedMatchIdSet.has(matchId));

  return {
    mode: "incremental",
    skippedMatchIds: totalMatchIds.filter((matchId) => syncedMatchIdSet.has(matchId)),
    targetMatchIds,
    totalMatchIds,
  };
};
