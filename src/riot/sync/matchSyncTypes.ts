import type { MatchTimelineEvent } from "../../timeline/types";
import type { Match, PlayerMatchStats, WeaponStat } from "../../types";

export type MatchSyncSummary = {
  accountPuuid: string;
  syncedMatches: number;
  syncedDetails: number;
  success: boolean;
  lastSync: string;
};

export type MatchSyncHistoryEntry = MatchSyncSummary & {
  id: string;
};

export type MatchSyncData = {
  matches: Match[];
  playerStats: PlayerMatchStats[];
  timelineEvents: MatchTimelineEvent[];
  weaponStats: WeaponStat[];
};

export type MatchSyncStorageState = {
  data: MatchSyncData;
  matchIds: string[];
  syncHistory: MatchSyncHistoryEntry[];
  syncSummary: MatchSyncSummary | null;
};
