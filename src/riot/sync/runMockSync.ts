import { saveInvalidDataReport } from "../../lib/dataQualityStorage";
import { loadSettings, saveSettings } from "../../lib/settingsStorage";
import { validateDataSource } from "../../lib/validateDataSource";
import { saveTimelineEvents } from "../../timeline/timelineStorage";
import { runRiotMockSync } from "./riotMockSync";
import { loadRiotSyncState, saveRiotSyncState, type RiotSyncStorageState } from "./riotSyncStorage";

const countMissingFields = (messages: string[]) =>
  messages.filter((message) => message.toLowerCase().includes("missing")).length;

const countInvalidNumbers = (messages: string[]) =>
  messages.filter((message) => message.toLowerCase().includes("invalid numbers")).length;

export const runMockSync = (): RiotSyncStorageState => {
  const timestamp = new Date().toISOString();
  const syncResult = runRiotMockSync();
  const verificationMessages = syncResult.verification.issues.map((issue) => issue.message);
  const missingFields = countMissingFields(verificationMessages);
  const invalidNumbers = countInvalidNumbers(verificationMessages);
  const invalidDataReport = {
    invalidRows: syncResult.verification.issues.length,
    negativeValues: 0,
    unknownWeapon: 0,
  };

  validateDataSource({
    invalidDataReport,
    matches: syncResult.matches,
    playerMatchStats: syncResult.playerStats,
    weaponStats: syncResult.weaponStats,
  });
  saveTimelineEvents(syncResult.timelineEvents);
  saveInvalidDataReport(invalidDataReport);
  saveSettings({ ...loadSettings(), dataSource: "riot" });

  const nextState = saveRiotSyncState({
    ...loadRiotSyncState(),
    errorMessage: undefined,
    lastSync: timestamp,
    status: "success",
    summary: {
      invalidNumbers,
      matches: syncResult.matches.length,
      missingFields,
      playerStats: syncResult.playerStats.length,
      timelineEvents: syncResult.timelineEvents.length,
      verificationPassed: syncResult.verification.valid,
      weaponStats: syncResult.weaponStats.length,
    },
  });
  return nextState;
};
