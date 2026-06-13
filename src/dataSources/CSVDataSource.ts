import { loadImportedMatches } from "../lib/importStorage";
import { loadImportedWeaponStats } from "../lib/weaponImportStorage";
import type { DataSource } from "./types";

export class CSVDataSource implements DataSource {
  getMatches() {
    return loadImportedMatches().matches;
  }

  getPlayerStats() {
    return loadImportedMatches().playerStats;
  }

  getTimelineEvents() {
    return [];
  }

  getWeaponStats() {
    return loadImportedWeaponStats().weaponStats;
  }
}
