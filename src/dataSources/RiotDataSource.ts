import type { Match, PlayerMatchStats, WeaponStat } from "../types";
import { loadMatchSyncState } from "../riot/sync/matchSyncStorage";
import { runRiotMockSync, type RiotMockSyncResult } from "../riot/sync/riotMockSync";
import type { MatchTimelineEvent } from "../timeline/types";
import type { DataSource } from "./types";

export class RiotDataSource implements DataSource {
  private syncResult: Pick<RiotMockSyncResult, "matches" | "playerStats" | "timelineEvents" | "weaponStats">;

  constructor() {
    const matchSyncState = loadMatchSyncState();

    this.syncResult =
      matchSyncState.syncSummary?.success && matchSyncState.data.matches.length > 0
        ? matchSyncState.data
        : runRiotMockSync();
  }

  getMatches(): Match[] {
    return this.syncResult.matches;
  }

  getPlayerStats(): PlayerMatchStats[] {
    return this.syncResult.playerStats;
  }

  getTimelineEvents(): MatchTimelineEvent[] {
    return this.syncResult.timelineEvents;
  }

  getWeaponStats(): WeaponStat[] {
    return this.syncResult.weaponStats;
  }
}
