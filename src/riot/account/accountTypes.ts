import type { RiotRegion } from "../types";

export type RiotAccountProfile = {
  gameName: string;
  tagLine: string;
  puuid: string;
  region: RiotRegion;
};

export type RiotAccountStorageState = {
  account: RiotAccountProfile | null;
  lastLookup: string | null;
};
