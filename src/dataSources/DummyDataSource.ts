import { matches, playerMatchStats } from "../data/dummyMatches";
import { weaponStats } from "../data/dummyWeaponStats";
import type { DataSource } from "./types";

export class DummyDataSource implements DataSource {
  getMatches() {
    return matches;
  }

  getPlayerStats() {
    return playerMatchStats;
  }

  getTimelineEvents() {
    return [];
  }

  getWeaponStats() {
    return weaponStats;
  }
}
