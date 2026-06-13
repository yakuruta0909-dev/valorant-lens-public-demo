import type { MatchTimelineEvent } from "../../timeline/types";
import type { PlayerMatchStats, WeaponStat } from "../../types";
import type { ApplyConflictResolutionInput } from "./conflictResolutionTypes";
import type { MatchSyncData } from "./matchSyncTypes";

const uniqueBy = <T,>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
};

const playerStatsKey = (stats: PlayerMatchStats) => `${stats.matchId}:${stats.playerPuuid}`;

const weaponStatsKey = (stats: WeaponStat) => `${stats.matchId}:${stats.weapon}`;

const timelineEventKey = (event: MatchTimelineEvent) =>
  [
    event.matchId ?? "unknown",
    event.timestamp,
    event.eventType,
    event.killer ?? "",
    event.victim ?? "",
    event.weapon ?? "",
    event.positionX,
    event.positionY,
  ].join(":");

const filterDataByMatchIds = (data: MatchSyncData, matchIds: Set<string>): MatchSyncData => ({
  matches: data.matches.filter((match) => matchIds.has(match.matchId)),
  playerStats: data.playerStats.filter((stats) => matchIds.has(stats.matchId)),
  timelineEvents: data.timelineEvents.filter((event) => event.matchId && matchIds.has(event.matchId)),
  weaponStats: data.weaponStats.filter((stats) => matchIds.has(stats.matchId)),
});

const removeDataByMatchIds = (data: MatchSyncData, matchIds: Set<string>): MatchSyncData => ({
  matches: data.matches.filter((match) => !matchIds.has(match.matchId)),
  playerStats: data.playerStats.filter((stats) => !matchIds.has(stats.matchId)),
  timelineEvents: data.timelineEvents.filter((event) => !event.matchId || !matchIds.has(event.matchId)),
  weaponStats: data.weaponStats.filter((stats) => !matchIds.has(stats.matchId)),
});

const normalizeIncomingData = (incomingData: MatchSyncData): MatchSyncData => {
  const matchesById = new Map(incomingData.matches.map((match) => [match.matchId, match]));
  const matchIds = new Set(matchesById.keys());
  const filteredData = filterDataByMatchIds(
    {
      ...incomingData,
      matches: Array.from(matchesById.values()),
    },
    matchIds,
  );

  return {
    matches: filteredData.matches,
    playerStats: uniqueBy(filteredData.playerStats, playerStatsKey),
    timelineEvents: uniqueBy(filteredData.timelineEvents, timelineEventKey),
    weaponStats: uniqueBy(filteredData.weaponStats, weaponStatsKey),
  };
};

const mergeData = (existingData: MatchSyncData, incomingData: MatchSyncData): MatchSyncData => ({
  matches: uniqueBy([...existingData.matches, ...incomingData.matches], (match) => match.matchId),
  playerStats: uniqueBy([...existingData.playerStats, ...incomingData.playerStats], playerStatsKey),
  timelineEvents: uniqueBy([...existingData.timelineEvents, ...incomingData.timelineEvents], timelineEventKey),
  weaponStats: uniqueBy([...existingData.weaponStats, ...incomingData.weaponStats], weaponStatsKey),
});

export const applyConflictResolution = ({
  existingData,
  incomingData,
  preview,
}: ApplyConflictResolutionInput): MatchSyncData => {
  const normalizedIncomingData = normalizeIncomingData(incomingData);
  const incomingMatchIds = new Set(normalizedIncomingData.matches.map((match) => match.matchId));

  if (preview.resolutionMode === "overwrite") {
    return mergeData(removeDataByMatchIds(existingData, incomingMatchIds), normalizedIncomingData);
  }

  if (preview.resolutionMode === "skip") {
    const addMatchIds = new Set(
      preview.conflicts
        .filter((conflict) => conflict.action === "add")
        .map((conflict) => conflict.matchId),
    );
    return mergeData(existingData, filterDataByMatchIds(normalizedIncomingData, addMatchIds));
  }

  return mergeData(existingData, normalizedIncomingData);
};
