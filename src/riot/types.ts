import type { MatchMode } from "../types";

export type RiotRegion = "AP" | "NA" | "EU" | "KR";

export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: RiotRegion;
};

export type RiotSyncStatus = "not_connected" | "connected" | "syncing" | "failed";

export type RiotSyncState = "idle" | "syncing" | "success" | "failed";

export type RawRiotTeam = {
  teamId: string;
  won: boolean;
};

export type RawRiotPlayer = {
  puuid: string;
  agent: string;
  teamId?: string;
  win?: boolean;
  kills: number;
  deaths: number;
  assists: number;
  acs?: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
};

export type RawRiotWeapon = {
  matchId?: string;
  puuid?: string;
  weaponName: string;
  kills: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
};

export type RawRiotMatch = {
  matchId: string;
  playedAt: string;
  mode: MatchMode | string;
  map: string;
  averageRating?: number;
  players: RawRiotPlayer[];
  teams?: RawRiotTeam[];
  timeline?: MatchTimelineEvent[];
  weapons?: RawRiotWeapon[];
};

export type MatchTimelineEvent = {
  agent?: string;
  isPlayerEvent?: boolean;
  map?: string;
  matchId?: string;
  timestamp: number;
  eventType: string;
  positionX: number;
  positionY: number;
  killer?: string;
  victim?: string;
  team?: "ally" | "enemy";
  weapon?: string;
};
