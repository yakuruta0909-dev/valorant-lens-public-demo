import type { DataSourceType, Match, PlayerMatchStats, WeaponStat } from "../types";
import type { MatchTimelineEvent } from "../timeline/types";

export type { DataSourceType };

export interface DataSource {
  getMatches(): Match[];
  getPlayerStats(): PlayerMatchStats[];
  getTimelineEvents(): MatchTimelineEvent[];
  getWeaponStats(): WeaponStat[];
}
