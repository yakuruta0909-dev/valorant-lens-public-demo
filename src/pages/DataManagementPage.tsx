import { Crosshair, Database, Download, FileX2, Shield, Swords, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { PracticeSummaryCard } from "../components/PracticeSummaryCard";
import { WEAPONS } from "../data/dummyWeaponStats";
import { getCurrentDataSourceData } from "../dataSources/getCurrentDataSource";
import { clearInvalidDataReport } from "../lib/dataQualityStorage";
import { clearImportedMatches, loadImportedMatches } from "../lib/importStorage";
import { loadSettings, saveSettings } from "../lib/settingsStorage";
import {
  clearImportedWeaponStats,
  loadImportedWeaponStats,
} from "../lib/weaponImportStorage";
import { getRiotApiClientStatus } from "../riot/client/riotApiClient";
import {
  getRiotRequestLogSummary,
  loadRiotRequestLogs,
} from "../riot/client/riotRequestLogStorage";
import { loadRiotAccountState } from "../riot/account/accountStorage";
import { MOCK_RIOT_ACCOUNT } from "../riot/mock/mockAccount";
import { loadConflictResolutionState } from "../riot/sync/conflictResolutionStorage";
import { loadMatchSyncState } from "../riot/sync/matchSyncStorage";
import { loadMatchSyncReviewState } from "../riot/sync/matchSyncReviewStorage";
import { loadRiotSyncState } from "../riot/sync/riotSyncStorage";
import { loadSyncPreview } from "../riot/sync/syncPreviewStorage";
import { getMatchCacheSummary } from "../riot/sync/syncCacheStorage";
import { loadIncrementalSyncState } from "../riot/sync/incrementalSyncStorage";
import { clearTimelineEvents, loadTimelineEvents } from "../timeline/timelineStorage";
import type { MatchMode } from "../types";

const sourceLabels = {
  csv: "CSV Data",
  dummy: "Dummy Data",
  riot: "Riot Data",
} as const;

const formatSyncDate = (timestamp: string | null) => {
  if (!timestamp) {
    return "Never";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
};

const formatSyncStatus = (status: ReturnType<typeof loadRiotSyncState>["status"]) => {
  if (status === "syncing") return "Syncing...";
  if (status === "success") return "Success";
  if (status === "failed") return "Failed";
  return "Idle";
};

const matchSampleCsv = [
  "date,map,agent,mode,kills,deaths,assists,acs,hsRate,win,averageRating",
  "2026-06-01,Ascent,Omen,Competitive,18,12,8,240,26.5,true,2100",
  "2026-06-02,Bind,Jett,Deathmatch,34,22,0,0,31.0,false,0",
].join("\n");

const weaponSampleCsv = [
  "matchId,weapon,kills,headshots,bodyshots,legshots",
  "csv-2-2026-06-01,Vandal,20,10,25,5",
  "csv-2-2026-06-01,Sheriff,3,2,1,0",
].join("\n");

const downloadCsv = (fileName: string, csvText: string) => {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

export function DataManagementPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState("Data storage ready");
  const settings = useMemo(() => loadSettings(), [refreshKey]);
  const currentData = useMemo(() => getCurrentDataSourceData(), [refreshKey]);
  const importedData = useMemo(() => loadImportedMatches(), [refreshKey]);
  const importedWeaponData = useMemo(() => loadImportedWeaponStats(), [refreshKey]);
  const riotApiStatus = useMemo(() => getRiotApiClientStatus(), [refreshKey]);
  const riotAccountState = useMemo(() => loadRiotAccountState(), [refreshKey]);
  const conflictResolutionState = useMemo(() => loadConflictResolutionState(), [refreshKey]);
  const matchSyncState = useMemo(() => loadMatchSyncState(), [refreshKey]);
  const matchSyncReviewState = useMemo(() => loadMatchSyncReviewState(), [refreshKey]);
  const syncPreview = useMemo(() => loadSyncPreview(), [refreshKey]);
  const matchCacheSummary = useMemo(() => getMatchCacheSummary(), [refreshKey]);
  const incrementalSyncState = useMemo(() => loadIncrementalSyncState(), [refreshKey]);
  const riotRequestSummary = useMemo(() => getRiotRequestLogSummary(loadRiotRequestLogs()), [refreshKey]);
  const riotSyncState = useMemo(() => loadRiotSyncState(), [refreshKey]);
  const storedTimelineData = useMemo(() => loadTimelineEvents(), [refreshKey]);
  const publicDemoMode = riotApiStatus.publicDemoMode;
  const timelineSource = settings.dataSource === "riot" ? "Riot Mock" : "Not Available";
  const countByMode = (mode: MatchMode) => currentData.matches.filter((match) => match.mode === mode).length;
  const weaponCounts = WEAPONS.map((weapon) => ({
    weapon,
    records: currentData.weaponStats.filter((stat) => stat.weapon === weapon).length,
  }));

  const handleClearImportedData = () => {
    const confirmed = window.confirm("Clear imported matches and weapon stats from local demo storage?");

    if (!confirmed) {
      return;
    }

    clearImportedMatches();
    clearImportedWeaponStats();
    clearTimelineEvents();
    clearInvalidDataReport();
    saveSettings({ ...loadSettings(), dataSource: "dummy" });
    setRefreshKey((current) => current + 1);
    setStatus("Imported data cleared. Switched to Dummy Data.");
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-valorant-red" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-black text-white">Current Data Source</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">Unified Data Source Layer</p>
            </div>
          </div>
          <div className="rounded-md border border-valorant-red/50 bg-valorant-red/10 px-4 py-2 text-sm font-black text-white shadow-glow">
            {sourceLabels[settings.dataSource]}
          </div>
        </div>
        {settings.dataSource === "riot" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Account</p>
              <p className="mt-2 text-lg font-black text-white">
                {riotAccountState.account
                  ? `${riotAccountState.account.gameName}#${riotAccountState.account.tagLine}`
                  : `${MOCK_RIOT_ACCOUNT.gameName}#${MOCK_RIOT_ACCOUNT.tagLine}`}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Region</p>
              <p className="mt-2 text-lg font-black text-white">{riotAccountState.account?.region ?? MOCK_RIOT_ACCOUNT.region}</p>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PracticeSummaryCard icon={Database} label="Total Matches" value={currentData.matches.length} />
        <PracticeSummaryCard icon={Swords} label="Competitive" value={countByMode("Competitive")} />
        <PracticeSummaryCard icon={Target} label="Solo Practice" value={countByMode("Deathmatch")} />
        <PracticeSummaryCard icon={Shield} label="Team Practice" value={countByMode("Team Deathmatch")} />
      </div>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Timeline Source Summary</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            Timeline events in local mock data storage
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Timeline Records</p>
            <p className="mt-2 text-2xl font-black text-white">{currentData.timelineEvents.length}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Timeline Source</p>
            <p className="mt-2 text-lg font-black text-white">{timelineSource}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Stored Timeline Records</p>
            <p className="mt-2 text-2xl font-black text-white">{storedTimelineData.timelineEvents.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Riot Sync State</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">Mock sync status stored in local demo storage</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Last Riot Sync</p>
            <p className="mt-2 text-lg font-black text-white">{formatSyncDate(riotSyncState.lastSync)}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Sync Status</p>
            <p
              className={`mt-2 text-lg font-black ${
                riotSyncState.status === "failed" ? "text-valorant-red" : "text-white"
              }`}
            >
              {formatSyncStatus(riotSyncState.status)}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Synced Matches</p>
            <p className="mt-2 text-lg font-black text-white">{riotSyncState.summary.matches}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Verification</p>
            <p className="mt-2 text-lg font-black text-white">
              {riotSyncState.summary.verificationPassed ? "Passed" : "Failed"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Match Sync Summary</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            Connected Account mock sync stored in local demo storage
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Status</p>
            <p className="mt-2 text-lg font-black text-white">
              {matchSyncState.syncSummary?.success ? "Success" : "Not Synced"}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Last Sync</p>
            <p className="mt-2 text-lg font-black text-white">
              {formatSyncDate(matchSyncState.syncSummary?.lastSync ?? null)}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Synced Matches</p>
            <p className="mt-2 text-lg font-black text-white">{matchSyncState.syncSummary?.syncedMatches ?? 0}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Synced Details</p>
            <p className="mt-2 text-lg font-black text-white">{matchSyncState.syncSummary?.syncedDetails ?? 0}</p>
          </div>
        </div>

      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Incremental Sync Summary</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            Mock sync checkpoint in local demo storage
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Last Run</p>
            <p className="mt-2 text-lg font-black text-white">{formatSyncDate(incrementalSyncState.lastRunAt)}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Mode</p>
            <p className="mt-2 text-lg font-black capitalize text-white">{incrementalSyncState.lastMode}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Target</p>
            <p className="mt-2 text-lg font-black text-white">{incrementalSyncState.lastTargetMatchIds}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Skipped</p>
            <p className="mt-2 text-lg font-black text-white">{incrementalSyncState.lastSkippedMatchIds}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Total Match IDs</p>
            <p className="mt-2 text-lg font-black text-white">{incrementalSyncState.lastTotalMatchIds}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Match Cache Summary</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            Mock match cache in local demo storage
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Cache Count</p>
            <p className="mt-2 text-lg font-black text-white">{matchCacheSummary.count}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Last Cached At</p>
            <p className="mt-2 text-lg font-black text-white">{formatSyncDate(matchCacheSummary.lastCachedAt)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Sync Preview Summary</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            Pre-sync review generated from match list only
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Generated At</p>
            <p className="mt-2 text-lg font-black text-white">{formatSyncDate(syncPreview.generatedAt || null)}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Incoming Matches</p>
            <p className="mt-2 text-lg font-black text-white">{syncPreview.incomingMatchIds.length}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Add</p>
            <p className="mt-2 text-lg font-black text-white">{syncPreview.addCount}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Update</p>
            <p className="mt-2 text-lg font-black text-white">{syncPreview.updateCount}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Duplicate</p>
            <p className="mt-2 text-lg font-black text-white">{syncPreview.duplicateCount}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Resolution Mode</p>
            <p className="mt-2 text-lg font-black capitalize text-white">{syncPreview.resolutionMode}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Conflict Summary</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            Latest Riot match sync conflict preview
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Resolution Mode</p>
            <p className="mt-2 text-lg font-black capitalize text-white">{conflictResolutionState.resolutionMode}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Add Count</p>
            <p className="mt-2 text-lg font-black text-white">{conflictResolutionState.summary.addCount}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Update Count</p>
            <p className="mt-2 text-lg font-black text-white">{conflictResolutionState.summary.updateCount}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Duplicate Count</p>
            <p className="mt-2 text-lg font-black text-white">{conflictResolutionState.summary.duplicateCount}</p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Recent Conflicts</h3>
          {conflictResolutionState.conflicts.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/50">
              No conflict preview yet
            </div>
          ) : (
            <div className="grid gap-2">
              {conflictResolutionState.conflicts.slice(0, 10).map((conflict) => (
                <div
                  key={`${conflict.matchId}-${conflict.action}`}
                  className="grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70 md:grid-cols-[1fr_auto_auto_auto]"
                >
                  <span className="font-black text-white">{conflict.matchId}</span>
                  <span className="font-black capitalize text-white">{conflict.action}</span>
                  <span>Existing: {conflict.existing ? "Yes" : "No"}</span>
                  <span>Incoming: {conflict.incomingCount}</span>
                  <span className="text-white/50 md:col-span-4">{conflict.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Match Sync Review</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">Partial failure review for match detail sync</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Total Match IDs</p>
            <p className="mt-2 text-lg font-black text-white">{matchSyncReviewState.review.totalMatchIds}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Success Count</p>
            <p className="mt-2 text-lg font-black text-white">{matchSyncReviewState.review.successfulDetails}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Failed Count</p>
            <p className="mt-2 text-lg font-black text-white">{matchSyncReviewState.review.failedDetails}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Success Rate</p>
            <p className="mt-2 text-lg font-black text-white">
              {(matchSyncReviewState.review.successRate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Partial Failure</p>
            <p className="mt-2 text-lg font-black text-white">
              {matchSyncReviewState.review.partialFailure ? "Yes" : "No"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Recent Failed Matches</h3>
          {matchSyncReviewState.failedMatches.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/50">
              No failed match details
            </div>
          ) : (
            <div className="grid gap-2">
              {matchSyncReviewState.failedMatches.slice(0, 10).map((failedMatch) => (
                <div
                  key={failedMatch.matchId}
                  className="grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70 md:grid-cols-[1fr_auto_auto]"
                >
                  <span className="font-black text-white">{failedMatch.matchId}</span>
                  <span className="font-black text-valorant-red">{failedMatch.statusCode}</span>
                  <span>Retries: {failedMatch.retryCount}</span>
                  <span className="text-valorant-red md:col-span-3">{failedMatch.errorMessage}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">
            {publicDemoMode ? "Public Demo Riot Status" : "Riot Client Status"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            {publicDemoMode
              ? "Public demo uses mock/local data only. Riot account connection is planned for a future RSO flow."
              : "Default mode is mock. Real mode is local dev verification only."}
          </p>
        </div>
        {publicDemoMode ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Demo Mode</p>
              <p className="mt-2 text-lg font-black text-white">Mock Only</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">External Requests</p>
              <p className="mt-2 text-lg font-black text-white">Disabled</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Credentials</p>
              <p className="mt-2 text-lg font-black text-white">Not Used</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Last Request</p>
              <p className="mt-2 text-lg font-black text-white">{riotRequestSummary.lastRequest?.endpoint ?? "none"}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Riot Client Mode</p>
                <p className="mt-2 text-lg font-black capitalize text-white">{riotApiStatus.mode}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">API Configured</p>
                <p className="mt-2 text-lg font-black text-white">{riotApiStatus.apiConfigured ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Region</p>
                <p className="mt-2 text-lg font-black text-white">{riotApiStatus.region}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Mock Mode</p>
                <p className="mt-2 text-lg font-black text-white">{riotApiStatus.mockMode ? "Enabled" : "Disabled"}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Real Mode Guard</p>
                <p className="mt-2 text-lg font-black text-white">
                  {riotApiStatus.productionRealModeBlocked ? "Blocked" : "Ready"}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Last Request Result</p>
                <p className={riotApiStatus.lastRequestResult.success ? "mt-2 text-lg font-black text-white" : "mt-2 text-lg font-black text-valorant-red"}>
                  {riotRequestSummary.lastRequest?.status ?? "none"}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Last Request</p>
                <p className="mt-2 text-lg font-black text-white">{riotRequestSummary.lastRequest?.endpoint ?? "none"}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Error Count</p>
                <p className="mt-2 text-lg font-black text-white">{riotRequestSummary.errorCount}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">429 Count</p>
                <p className="mt-2 text-lg font-black text-white">{riotRequestSummary.rateLimitedCount}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Rate Limit Mock</p>
                <p className="mt-2 text-lg font-black text-white">
                  {riotApiStatus.rateLimit.remaining} / {riotApiStatus.rateLimit.resetInSeconds}s
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Retry After</p>
                <p className="mt-2 text-lg font-black text-white">
                  {typeof riotRequestSummary.retryAfterSeconds === "number"
                    ? `${riotRequestSummary.retryAfterSeconds}s`
                    : "-"}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">
                {riotRequestSummary.lastRequest?.id ?? riotApiStatus.lastRequestResult.endpoint}
              </p>
              <p className="mt-2 text-sm font-semibold text-white/60">
                {riotRequestSummary.lastRequest?.errorMessage ?? riotApiStatus.lastRequestResult.message}
              </p>
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Weapon Summary</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">Weapon records in the current data source</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {weaponCounts.map((row) => (
            <div key={row.weapon} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-bold text-white/60">{row.weapon}</p>
              <p className="mt-2 text-2xl font-black text-white">{row.records}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Storage Usage</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">
              Imported Match Data / Weapon Data
              <br />
              Quality Report
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-white/70">
            {status}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PracticeSummaryCard icon={Database} label="Imported Matches" value={importedData.matches.length} />
          <PracticeSummaryCard
            icon={Crosshair}
            label="Imported Weapon Records"
            value={importedWeaponData.weaponStats.length}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <h2 className="text-lg font-black text-white">Sample CSV Download</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">Download templates for Match and Weapon CSV</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
              type="button"
              onClick={() => downloadCsv("sample_matches.csv", matchSampleCsv)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Match CSV
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
              type="button"
              onClick={() => downloadCsv("sample_weapon_stats.csv", weaponSampleCsv)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Weapon CSV
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-valorant-red/30 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <h2 className="text-lg font-black text-white">Clear Data</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">Remove imported matches and weapon stats</p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-valorant-red/60 bg-valorant-red px-4 text-sm font-black text-white transition hover:bg-valorant-red/80"
            type="button"
            onClick={handleClearImportedData}
          >
            <FileX2 className="h-4 w-4" aria-hidden="true" />
            Clear Imported Data
          </button>
        </section>
      </div>
    </div>
  );
}
