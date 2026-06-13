import { loadSettings } from "../lib/settingsStorage";
import { CSVDataSource } from "./CSVDataSource";
import { DummyDataSource } from "./DummyDataSource";
import { RiotDataSource } from "./RiotDataSource";
import type { DataSource } from "./types";

export const getCurrentDataSource = (): DataSource => {
  const { dataSource } = loadSettings();

  if (dataSource === "csv") {
    return new CSVDataSource();
  }

  if (dataSource === "riot") {
    return new RiotDataSource();
  }

  return new DummyDataSource();
};

export const getCurrentDataSourceData = () => {
  const dataSource = getCurrentDataSource();

  return {
    matches: dataSource.getMatches(),
    playerMatchStats: dataSource.getPlayerStats(),
    timelineEvents: dataSource.getTimelineEvents(),
    weaponStats: dataSource.getWeaponStats(),
  };
};
