import {
  AlertTriangle,
  Clock,
  Database,
  Gauge,
  Play,
  Settings as SettingsIcon,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImportExportPanel } from "../components/ImportExportPanel";
import { MetricSelector } from "../components/MetricSelector";
import { SettingsSection } from "../components/SettingsSection";
import { ThresholdEditor } from "../components/ThresholdEditor";
import { WeightEditor } from "../components/WeightEditor";
import { metricDefinitions } from "../lib/metrics";
import {
  DEFAULT_SETTINGS,
  exportSettings,
  importSettings,
  loadSettings,
  resetSettings,
  saveSettings,
} from "../lib/settingsStorage";
import { VALORANT_MAPS } from "../maps/mapMetadata";
import {
  DEFAULT_MAP_CALIBRATION,
  getModifiedMapCalibrationCount,
  loadMapCalibration,
  resetMapCalibration,
  saveMapCalibration,
  validateMapCalibration,
} from "../maps/mapCalibrationStorage";
import type { MapCalibration } from "../maps/mapCalibrationTypes";
import { buildCalibrationPreview } from "../maps/buildCalibrationPreview";
import {
  deleteCalibrationPoint,
  loadCalibrationPoints,
  resetCalibrationPoints,
  saveCalibrationPoint,
  validateCalibrationPoint,
} from "../maps/calibrationPointStorage";
import type { CalibrationPoint, CalibrationPreviewPoint } from "../maps/calibrationPointTypes";
import {
  loadStoredMapAsset,
  resetStoredMapAsset,
  saveStoredMapAsset,
} from "../maps/mapAssetStorage";
import type { StoredMapAsset } from "../maps/mapAssetTypes";
import type { ValorantMap } from "../maps/mapTypes";
import { validateImageFile, validateStoredMapAsset } from "../maps/validateMapAsset";
import {
  loadRiotAccountState,
  saveRiotAccountProfile,
} from "../riot/account/accountStorage";
import { validateRiotAccountLookup } from "../riot/account/accountValidation";
import { createRiotApiClient, getRiotApiClientStatus } from "../riot/client/riotApiClient";
import {
  clearRiotRequestLogs,
  getRiotRequestLogSummary,
  loadRiotRequestLogs,
} from "../riot/client/riotRequestLogStorage";
import { MOCK_RIOT_ACCOUNT, MOCK_RIOT_SYNC_STATUS_LABEL } from "../riot/mock/mockAccount";
import { loadMatchSyncState } from "../riot/sync/matchSyncStorage";
import { loadMatchSyncReviewState } from "../riot/sync/matchSyncReviewStorage";
import { loadConflictResolutionState, saveConflictResolutionState } from "../riot/sync/conflictResolutionStorage";
import { generateSyncPreview } from "../riot/sync/generateSyncPreview";
import { retryFailedMatchDetails } from "../riot/sync/retryFailedMatchDetails";
import { runMatchSync } from "../riot/sync/runMatchSync";
import { runMockSync } from "../riot/sync/runMockSync";
import { loadRiotSyncState, saveRiotSyncState } from "../riot/sync/riotSyncStorage";
import { loadSyncPreview } from "../riot/sync/syncPreviewStorage";
import { clearMatchCache, getMatchCacheSummary } from "../riot/sync/syncCacheStorage";
import { loadIncrementalSyncState, saveIncrementalSyncState } from "../riot/sync/incrementalSyncStorage";
import type { ConflictPreviewRow, ConflictResolutionMode } from "../riot/sync/conflictResolutionTypes";
import type { RiotRegion } from "../riot/types";
import type { DataSourceType, MetricKey, PeriodType, UserSettings } from "../types";

const defaultMetricKeys: MetricKey[] = [
  "acs",
  "kd",
  "hsRate",
  "practiceMatches",
  "performanceIndex",
  "winRate",
  "matchStrength",
];

const periodOptions: Array<{ label: string; value: PeriodType }> = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

const dataSourceOptions: Array<{ label: string; value: DataSourceType }> = [
  { label: "Dummy Data", value: "dummy" },
  { label: "CSV Data", value: "csv" },
  { label: "Riot Data", value: "riot" },
];

const riotRegionOptions: RiotRegion[] = ["AP", "NA", "EU", "KR"];

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

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [exportValue, setExportValue] = useState(() => exportSettings());
  const [importValue, setImportValue] = useState("");
  const [riotAccountState, setRiotAccountState] = useState(() => loadRiotAccountState());
  const [riotAccountForm, setRiotAccountForm] = useState(() => {
    const storedAccount = loadRiotAccountState().account;

    return {
      gameName: storedAccount?.gameName ?? MOCK_RIOT_ACCOUNT.gameName,
      region: storedAccount?.region ?? MOCK_RIOT_ACCOUNT.region,
      tagLine: storedAccount?.tagLine ?? MOCK_RIOT_ACCOUNT.tagLine,
    };
  });
  const [riotAccountError, setRiotAccountError] = useState("");
  const [matchSyncError, setMatchSyncError] = useState("");
  const [syncPreviewError, setSyncPreviewError] = useState("");
  const [matchSyncState, setMatchSyncState] = useState(() => loadMatchSyncState());
  const [matchSyncReviewState, setMatchSyncReviewState] = useState(() => loadMatchSyncReviewState());
  const [conflictResolutionState, setConflictResolutionState] = useState(() => loadConflictResolutionState());
  const [syncPreview, setSyncPreview] = useState(() => loadSyncPreview());
  const [matchCacheSummary, setMatchCacheSummary] = useState(() => getMatchCacheSummary());
  const [incrementalSyncState, setIncrementalSyncState] = useState(() => loadIncrementalSyncState());
  const [riotRequestLogs, setRiotRequestLogs] = useState(() => loadRiotRequestLogs());
  const [riotSyncState, setRiotSyncState] = useState(() => loadRiotSyncState());
  const [status, setStatus] = useState("Saved");
  const riotApiStatus = useMemo(() => getRiotApiClientStatus(), []);
  const riotRequestSummary = useMemo(() => getRiotRequestLogSummary(riotRequestLogs), [riotRequestLogs]);
  const selectableMetrics = useMemo(
    () => metricDefinitions.filter((metric) => defaultMetricKeys.includes(metric.key)),
    [],
  );
  const publicDemoMode = riotApiStatus.publicDemoMode;
  const visibleDataSourceOptions = useMemo(
    () => (publicDemoMode ? dataSourceOptions.filter((option) => option.value !== "riot") : dataSourceOptions),
    [publicDemoMode],
  );

  useEffect(() => {
    if (!status) return;

    const timeout = window.setTimeout(() => setStatus(""), 1600);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const persistSettings = (nextSettings: UserSettings) => {
    const savedSettings = saveSettings(nextSettings);
    setSettings(savedSettings);
    setExportValue(JSON.stringify(savedSettings, null, 2));
    setStatus("Saved");
  };

  const updateDefaultPeriod = (defaultPeriod: PeriodType) => {
    persistSettings({ ...settings, defaultPeriod });
  };

  const updateDataSource = (dataSource: DataSourceType) => {
    persistSettings({ ...settings, dataSource });
  };

  const updateDefaultMetrics = (defaultMetrics: MetricKey[]) => {
    persistSettings({ ...settings, defaultMetrics });
  };

  const handleExport = () => {
    setExportValue(exportSettings());
    setStatus("Exported");
  };

  const handleImport = () => {
    try {
      const importedSettings = importSettings(importValue);
      setSettings(importedSettings);
      setExportValue(JSON.stringify(importedSettings, null, 2));
      setImportValue("");
      setStatus("Imported and saved");
    } catch {
      setStatus("Import failed");
    }
  };

  const handleReset = () => {
    const nextSettings = resetSettings();
    setSettings(nextSettings);
    setExportValue(JSON.stringify(nextSettings, null, 2));
    setImportValue("");
    setStatus("Reset to defaults");
  };

  const handleRunMockSync = () => {
    const syncingState = saveRiotSyncState({
      ...loadRiotSyncState(),
      errorMessage: undefined,
      status: "syncing",
    });
    setRiotSyncState(syncingState);
    setStatus("Syncing...");

    window.setTimeout(() => {
      const nextState = runMockSync();
      const nextSettings = loadSettings();

      setRiotSyncState(nextState);
      setSettings(nextSettings);
      setExportValue(JSON.stringify(nextSettings, null, 2));
      setStatus("Mock sync success");
    }, 500);
  };

  const handleLookupRiotAccount = async () => {
    if (publicDemoMode) {
      setRiotAccountError("Riot account connection is planned for Riot Sign On and disabled in this public demo.");
      setStatus("Connection disabled");
      return;
    }

    const validation = validateRiotAccountLookup(riotAccountForm);

    if (!validation.valid) {
      setRiotAccountError(validation.errors.join(" "));
      setStatus("Lookup failed");
      return;
    }

    const client = createRiotApiClient({
      region: riotAccountForm.region,
    });
    const result = await client.getAccountByRiotId(riotAccountForm.gameName, riotAccountForm.tagLine);
    setRiotRequestLogs(loadRiotRequestLogs());

    if (!result.success || !result.data) {
      setRiotAccountError(result.error ?? "Account lookup failed.");
      setStatus("Lookup failed");
      return;
    }

    const nextState = saveRiotAccountProfile({
      gameName: result.data.gameName,
      puuid: result.data.puuid,
      region: riotAccountForm.region,
      tagLine: result.data.tagLine,
    });
    setRiotAccountState(nextState);
    setRiotAccountError("");
    setStatus("Account connected");
  };

  const handleClearRiotRequestLogs = () => {
    setRiotRequestLogs(clearRiotRequestLogs());
    setStatus("Request logs cleared");
  };

  const handleRunMatchSync = async () => {
    setMatchSyncError("");
    setStatus("Match syncing...");

    const result = await runMatchSync();
    setMatchSyncState(result.state);
    setMatchSyncReviewState(loadMatchSyncReviewState());
    setConflictResolutionState(loadConflictResolutionState());
    setMatchCacheSummary(getMatchCacheSummary());
    setIncrementalSyncState(loadIncrementalSyncState());
    setRiotRequestLogs(loadRiotRequestLogs());

    if (result.error) {
      setMatchSyncError(result.error);
      setStatus("Match sync failed");
      return;
    }

    const nextSettings = saveSettings({ ...loadSettings(), dataSource: "riot" });
    setSettings(nextSettings);
    setExportValue(JSON.stringify(nextSettings, null, 2));
    setStatus("Match sync success");
  };

  const handleForceFullSyncChange = (forceFullSync: boolean) => {
    const nextState = saveIncrementalSyncState({
      ...incrementalSyncState,
      forceFullSync,
    });

    setIncrementalSyncState(nextState);
    setStatus("Incremental sync setting saved");
  };

  const handleClearMatchCache = () => {
    clearMatchCache();
    setMatchCacheSummary(getMatchCacheSummary());
    setStatus("Match cache cleared");
  };

  const handleGenerateSyncPreview = async () => {
    setSyncPreviewError("");
    setStatus("Generating preview...");

    const result = await generateSyncPreview();
    setSyncPreview(result.preview);
    setIncrementalSyncState(loadIncrementalSyncState());
    setRiotRequestLogs(loadRiotRequestLogs());

    if (result.error) {
      setSyncPreviewError(result.error);
      setStatus("Preview failed");
      return;
    }

    setStatus("Sync preview generated");
  };

  const handleRetryFailedMatchDetails = async () => {
    setMatchSyncError("");
    setStatus("Retrying failed details...");

    const result = await retryFailedMatchDetails();
    setMatchSyncState(loadMatchSyncState());
    setMatchSyncReviewState(loadMatchSyncReviewState());
    setConflictResolutionState(loadConflictResolutionState());
    setRiotRequestLogs(loadRiotRequestLogs());

    if (result.error) {
      setMatchSyncError(result.error);
      setStatus("Retry failed");
      return;
    }

    setStatus(result.failedMatches.length === 0 ? "Retry completed" : "Retry partially completed");
  };

  const handleConflictResolutionModeChange = (resolutionMode: ConflictResolutionMode) => {
    const nextState = saveConflictResolutionState({
      ...conflictResolutionState,
      resolutionMode,
    });

    setConflictResolutionState(nextState);
    setStatus("Conflict resolution saved");
  };

  const weightTotal = Object.values(settings.performanceWeights).reduce((sum, value) => sum + value, 0);
  const weightsValid = Math.abs(weightTotal - 1) < 0.001;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-5 w-5 text-valorant-red" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-black text-white">User Settings</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">Stored in local demo storage only</p>
          </div>
        </div>
        <div
          className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-black ${
            status === "Import failed"
              ? "border-valorant-red/40 bg-valorant-red/10 text-valorant-red"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          } ${status ? "opacity-100" : "opacity-0"}`}
        >
          {status || "Saved"}
        </div>
      </div>

      <SettingsSection description="Choose the first view shown by analyzer pages." title="General">
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">
              Current Data Source
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleDataSourceOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm font-bold transition ${
                    settings.dataSource === option.value
                      ? "border-valorant-red bg-valorant-red text-white"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <input
                    checked={settings.dataSource === option.value}
                    className="h-4 w-4 accent-valorant-red"
                    name="dataSource"
                    type="radio"
                    onChange={() => updateDataSource(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {publicDemoMode && (
              <p className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-white/60">
                Public demo data sources are limited to mock/local placeholder data.
              </p>
            )}
            {!publicDemoMode && settings.dataSource === "riot" && (
              <p className="mt-3 rounded-md border border-valorant-red/30 bg-valorant-red/10 p-3 text-sm font-bold text-valorant-red">
                Riot Data is using mock sync data. No API communication is performed.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Default Period</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {periodOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm font-bold transition ${
                    settings.defaultPeriod === option.value
                      ? "border-valorant-red bg-valorant-red text-white"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <input
                    checked={settings.defaultPeriod === option.value}
                    className="h-4 w-4 accent-valorant-red"
                    name="defaultPeriod"
                    type="radio"
                    onChange={() => updateDefaultPeriod(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Default Metrics</h3>
            <MetricSelector
              metrics={selectableMetrics}
              value={settings.defaultMetrics}
              onChange={updateDefaultMetrics}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        description={
          publicDemoMode
            ? "Planned Riot Sign On account connection. Disabled in the public mock demo."
            : "Mock account lookup flow for local development. No production Riot account connection is performed."
        }
        title="Riot Integration"
      >
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">
                Game Name
              </span>
              <input
                disabled={publicDemoMode}
                className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
                value={riotAccountForm.gameName}
                onChange={(event) =>
                  setRiotAccountForm((current) => ({ ...current, gameName: event.target.value }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Tag</span>
              <input
                disabled={publicDemoMode}
                className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
                value={riotAccountForm.tagLine}
                onChange={(event) =>
                  setRiotAccountForm((current) => ({ ...current, tagLine: event.target.value }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Region</span>
              <select
                disabled={publicDemoMode}
                className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
                value={riotAccountForm.region}
                onChange={(event) =>
                  setRiotAccountForm((current) => ({ ...current, region: event.target.value as RiotRegion }))
                }
              >
                {riotRegionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-valorant-red/60 bg-valorant-red px-4 text-sm font-black text-white transition hover:bg-valorant-red/80 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-white/35"
              disabled={publicDemoMode}
              type="button"
              onClick={handleLookupRiotAccount}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {publicDemoMode ? "Connect Riot Account (RSO Planned)" : "Lookup Account"}
            </button>

            {riotAccountError && (
              <div className="rounded-md border border-valorant-red/40 bg-valorant-red/10 p-3 text-sm font-bold text-valorant-red">
                {riotAccountError}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard
                icon={ShieldCheck}
                label="Status"
                value={riotAccountState.account ? "Connected" : MOCK_RIOT_SYNC_STATUS_LABEL}
              />
              <InfoCard
                icon={Database}
                label="Connected Account"
                value={
                  riotAccountState.account
                    ? `${riotAccountState.account.gameName}#${riotAccountState.account.tagLine}`
                    : "Not Connected"
                }
              />
              <InfoCard icon={Database} label="PUUID" value={riotAccountState.account?.puuid ?? "-"} />
              <InfoCard icon={Gauge} label="Region" value={riotAccountState.account?.region ?? riotAccountForm.region} />
              <InfoCard icon={Clock} label="Last Lookup" value={formatSyncDate(riotAccountState.lastLookup)} />
            </div>
          </div>
        </div>
        <p className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white/60">
          Public demo account connection is disabled. Lens Score is for post-match self review; live overlays,
          in-match assistance, MMR/ELO calculations, hidden rating estimates, true rank estimates, and rank prediction
          are out of scope.
        </p>
      </SettingsSection>

      <SettingsSection
        description={
          publicDemoMode
            ? "Public demo status. The app uses mock/local data only."
            : "Riot API client foundation. Real mode is local dev verification only."
        }
        title={publicDemoMode ? "Public Demo Riot Status" : "Riot API Status"}
      >
        {publicDemoMode ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={ShieldCheck} label="Demo Mode" value="Mock Only" />
            <InfoCard icon={Gauge} label="Riot Client" value="Public Demo Disabled" />
            <InfoCard icon={Database} label="Credentials" value="Not Used" />
            <InfoCard icon={Database} label="Region" value={riotApiStatus.region} />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <InfoCard icon={Gauge} label="API Mode" value={riotApiStatus.mode} />
            <InfoCard icon={ShieldCheck} label="API Configured" value={riotApiStatus.apiConfigured ? "Yes" : "No"} />
            <InfoCard icon={Database} label="Region" value={riotApiStatus.region} />
            <InfoCard icon={Gauge} label="Mock Mode" value={riotApiStatus.mockMode ? "Enabled" : "Disabled"} />
            <InfoCard
              icon={AlertTriangle}
              label="Real Mode Guard"
              value={riotApiStatus.productionRealModeBlocked ? "Blocked" : "Ready"}
            />
            <InfoCard icon={Clock} label="Last Request" value={riotApiStatus.lastRequestResult.endpoint} />
            <InfoCard icon={AlertTriangle} label="Last Error" value={riotRequestSummary.lastRequest?.errorMessage ?? "-"} />
            <InfoCard
              icon={Clock}
              label="Retry After"
              value={
                typeof riotRequestSummary.retryAfterSeconds === "number"
                  ? `${riotRequestSummary.retryAfterSeconds}s`
                  : "-"
              }
            />
          </div>
        )}
        <p className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white/60">
          {publicDemoMode
            ? "No production Riot API calls are available from the public demo. Future account connection is planned through Riot Sign On."
            : riotApiStatus.lastRequestResult.message}
        </p>
        {!publicDemoMode && (
          <p className="mt-3 rounded-md border border-valorant-red/30 bg-valorant-red/10 p-3 text-sm font-semibold text-valorant-red">
            {riotApiStatus.apiKeyExposedWarning}
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        description="Mock match sync flow. Match list and details are local mock responses."
        title="Mock Match Sync"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={ShieldCheck}
            label="Sync Status"
            value={matchSyncState.syncSummary?.success ? "Success" : "Not Synced"}
          />
          <InfoCard icon={Clock} label="Last Sync" value={formatSyncDate(matchSyncState.syncSummary?.lastSync ?? null)} />
          <InfoCard icon={Database} label="Synced Matches" value={String(matchSyncState.syncSummary?.syncedMatches ?? 0)} />
          <InfoCard icon={Database} label="Synced Details" value={String(matchSyncState.syncSummary?.syncedDetails ?? 0)} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard icon={Clock} label="Preview Generated At" value={formatSyncDate(syncPreview.generatedAt || null)} />
          <InfoCard icon={Database} label="Incoming Matches" value={String(syncPreview.incomingMatchIds.length)} />
          <InfoCard icon={Database} label="Target Matches" value={String(syncPreview.targetMatchIds.length)} />
          <InfoCard icon={Database} label="Skipped Existing" value={String(syncPreview.skippedMatchIds.length)} />
          <InfoCard icon={Gauge} label="Sync Mode" value={syncPreview.syncMode} />
          <InfoCard icon={Database} label="Preview Add Count" value={String(syncPreview.addCount)} />
          <InfoCard icon={Gauge} label="Preview Update Count" value={String(syncPreview.updateCount)} />
          <InfoCard icon={AlertTriangle} label="Preview Duplicate Count" value={String(syncPreview.duplicateCount)} />
          <InfoCard icon={Gauge} label="Preview Resolution Mode" value={syncPreview.resolutionMode} />
          <InfoCard icon={ShieldCheck} label="Ready To Sync" value={syncPreview.readyToSync ? "Yes" : "No"} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoCard icon={Database} label="Match Cache Count" value={String(matchCacheSummary.count)} />
          <InfoCard icon={Clock} label="Last Cached At" value={formatSyncDate(matchCacheSummary.lastCachedAt)} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard icon={Gauge} label="Last Sync Mode" value={incrementalSyncState.lastMode} />
          <InfoCard icon={Database} label="Last Target Matches" value={String(incrementalSyncState.lastTargetMatchIds)} />
          <InfoCard icon={Database} label="Last Skipped Existing" value={String(incrementalSyncState.lastSkippedMatchIds)} />
          <InfoCard icon={Database} label="Last Total Match IDs" value={String(incrementalSyncState.lastTotalMatchIds)} />
        </div>

        <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3">
          <span className="text-sm font-black text-white">Force Full Sync</span>
          <input
            checked={incrementalSyncState.forceFullSync}
            className="h-4 w-4 accent-valorant-red"
            type="checkbox"
            onChange={(event) => handleForceFullSyncChange(event.target.checked)}
          />
        </label>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InfoCard icon={Database} label="Add Count" value={String(conflictResolutionState.summary.addCount)} />
          <InfoCard icon={Gauge} label="Update Count" value={String(conflictResolutionState.summary.updateCount)} />
          <InfoCard icon={AlertTriangle} label="Duplicate Count" value={String(conflictResolutionState.summary.duplicateCount)} />
        </div>

        <div className="mt-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Resolution Mode</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["skip", "overwrite", "merge"] as ConflictResolutionMode[]).map((resolutionMode) => (
              <label
                key={resolutionMode}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm font-bold capitalize transition ${
                  conflictResolutionState.resolutionMode === resolutionMode
                    ? "border-valorant-red bg-valorant-red text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"
                }`}
              >
                <input
                  checked={conflictResolutionState.resolutionMode === resolutionMode}
                  className="h-4 w-4 accent-valorant-red"
                  name="conflictResolutionMode"
                  type="radio"
                  onChange={() => handleConflictResolutionModeChange(resolutionMode)}
                />
                {resolutionMode}
              </label>
            ))}
          </div>
        </div>

        <ConflictPreviewTable conflicts={conflictResolutionState.conflicts} />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10 sm:w-auto"
            type="button"
            onClick={handleGenerateSyncPreview}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Generate Mock Sync Preview
          </button>
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-valorant-red/60 bg-valorant-red px-4 text-sm font-black text-white transition hover:bg-valorant-red/80 sm:w-auto"
            type="button"
            onClick={handleRunMatchSync}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Run Mock Sync
          </button>
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10 sm:w-auto"
            type="button"
            onClick={handleClearMatchCache}
          >
            Clear Match Cache
          </button>
        </div>

        {matchSyncError && (
          <div className="mt-4 rounded-md border border-valorant-red/40 bg-valorant-red/10 p-3 text-sm font-bold text-valorant-red">
            {matchSyncError}
          </div>
        )}
        {syncPreviewError && (
          <div className="mt-4 rounded-md border border-valorant-red/40 bg-valorant-red/10 p-3 text-sm font-bold text-valorant-red">
            {syncPreviewError}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        description="Review partial mock match detail failures."
        title="Mock Match Sync Review"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <InfoCard icon={Database} label="Total Match IDs" value={String(matchSyncReviewState.review.totalMatchIds)} />
          <InfoCard icon={ShieldCheck} label="Success Count" value={String(matchSyncReviewState.review.successfulDetails)} />
          <InfoCard icon={AlertTriangle} label="Failed Count" value={String(matchSyncReviewState.review.failedDetails)} />
          <InfoCard
            icon={Gauge}
            label="Success Rate"
            value={`${(matchSyncReviewState.review.successRate * 100).toFixed(1)}%`}
          />
          <InfoCard
            icon={AlertTriangle}
            label="Partial Failure"
            value={matchSyncReviewState.review.partialFailure ? "Yes" : "No"}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10 disabled:cursor-not-allowed disabled:text-white/35"
            disabled={matchSyncReviewState.failedMatches.length === 0}
            type="button"
            onClick={handleRetryFailedMatchDetails}
          >
            Retry Failed Details
          </button>
        </div>

        <div className="mt-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Failed Match IDs</h3>
          {matchSyncReviewState.failedMatches.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/50">
              No failed match details
            </div>
          ) : (
            <div className="grid gap-2">
              {matchSyncReviewState.failedMatches.map((failedMatch) => (
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
      </SettingsSection>

      <SettingsSection
        description={
          publicDemoMode
            ? "Public demo request telemetry. External Riot API calls are disabled."
            : "Latest 50 mock Riot API client calls. This is local-only request telemetry."
        }
        title="Riot Request Log"
      >
        {publicDemoMode ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={ShieldCheck} label="External Requests" value="Disabled" />
            <InfoCard icon={Database} label="Demo Data" value="Mock / Local" />
            <InfoCard icon={Clock} label="Last Request" value={riotRequestSummary.lastRequest?.endpoint ?? "none"} />
            <InfoCard icon={AlertTriangle} label="Errors" value={String(riotRequestSummary.errorCount)} />
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard icon={Database} label="Total Requests" value={String(riotRequestSummary.totalRequests)} />
              <InfoCard icon={Clock} label="Last Request" value={riotRequestSummary.lastRequest?.endpoint ?? "none"} />
              <InfoCard icon={AlertTriangle} label="Error Count" value={String(riotRequestSummary.errorCount)} />
              <InfoCard icon={AlertTriangle} label="429 Count" value={String(riotRequestSummary.rateLimitedCount)} />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
                type="button"
                onClick={handleClearRiotRequestLogs}
              >
                Clear Logs
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {riotRequestLogs.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/50">
                  No Riot request logs yet
                </div>
              ) : (
                riotRequestLogs.slice(0, 50).map((log) => (
                  <div
                    key={log.id}
                    className="grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70 lg:grid-cols-[1fr_auto_auto_auto]"
                  >
                    <span className="font-bold text-white">{formatSyncDate(log.timestamp)}</span>
                    <span className="font-black text-white">{log.endpoint}</span>
                    <span className={log.status === "failed" ? "font-black text-valorant-red" : "font-black text-emerald-200"}>
                      {log.status.toUpperCase()} {log.statusCode ? `(${log.statusCode})` : ""}
                    </span>
                    <span>{log.durationMs}ms / {log.mock ? "Mock" : "Local Dev Real"}</span>
                    {log.errorMessage && <span className="text-valorant-red lg:col-span-4">{log.errorMessage}</span>}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        description="Mock-only sync controls for validating future Riot API UX without network calls."
        title="Riot Sync"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <InfoCard icon={ShieldCheck} label="Status" value={formatSyncStatus(riotSyncState.status)} />
          <InfoCard icon={Clock} label="Last Sync" value={formatSyncDate(riotSyncState.lastSync)} />
          <InfoCard icon={Database} label="Matches Synced" value={String(riotSyncState.summary.matches)} />
          <InfoCard icon={Database} label="Player Stats" value={String(riotSyncState.summary.playerStats)} />
          <InfoCard icon={Database} label="Weapon Records" value={String(riotSyncState.summary.weaponStats)} />
        </div>

        <div className="mt-4">
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-valorant-red/60 bg-valorant-red px-4 text-sm font-black text-white transition hover:bg-valorant-red/80 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-white/35 md:w-auto"
            disabled={riotSyncState.status === "syncing"}
            type="button"
            onClick={handleRunMockSync}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Run Mock Sync
          </button>
        </div>

        {riotSyncState.status === "failed" && (
          <div className="mt-4 rounded-md border border-valorant-red/40 bg-valorant-red/10 p-4 text-sm font-bold text-valorant-red">
            <p>Sync failed.</p>
            <p className="mt-1">{riotSyncState.errorMessage ?? "Mock network error."}</p>
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Adapter Verification</p>
            <p className="mt-2 text-xl font-black text-white">
              {riotSyncState.summary.verificationPassed ? "Passed" : "Failed"}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={ShieldCheck} label="Missing Fields" value={String(riotSyncState.summary.missingFields)} />
            <InfoCard icon={Gauge} label="Invalid Numbers" value={String(riotSyncState.summary.invalidNumbers)} />
          </div>
        </div>

      </SettingsSection>

      <SettingsSection
        description="Adjust the relative contribution of ACS, KD, HS Rate, Win, and Difficulty."
        title="Lens Score"
      >
        <WeightEditor
          value={settings.performanceWeights}
          onChange={(performanceWeights) => persistSettings({ ...settings, performanceWeights })}
        />
        {!weightsValid && (
          <p className="mt-3 text-sm font-bold text-valorant-red">Lens Score weights must total 1.00</p>
        )}
      </SettingsSection>

      <SettingsSection description="Tune the labels used by Practice Analysis metric relationship cards." title="Metric Relationships">
        <ThresholdEditor
          value={settings.correlationThresholds}
          onChange={(correlationThresholds) => persistSettings({ ...settings, correlationThresholds })}
        />
      </SettingsSection>

      {!publicDemoMode && <MapAssetSettingsSection onStatusChange={setStatus} />}

      <SettingsSection description="Reset or move local demo preferences between browsers." title="Local Demo Settings">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <InfoCard icon={Gauge} label="Default Preset" value={DEFAULT_SETTINGS.defaultPeriod} />
        </div>
        <ImportExportPanel
          exportValue={exportValue}
          importValue={importValue}
          onExport={handleExport}
          onImport={handleImport}
          onImportValueChange={setImportValue}
          onReset={handleReset}
        />
      </SettingsSection>
    </div>
  );
}

function MapAssetSettingsSection({ onStatusChange }: { onStatusChange: (status: string) => void }) {
  const [selectedMap, setSelectedMap] = useState<ValorantMap>("Ascent");
  const [asset, setAsset] = useState<StoredMapAsset | undefined>(() => loadStoredMapAsset("Ascent"));
  const [error, setError] = useState("");

  useEffect(() => {
    setAsset(loadStoredMapAsset(selectedMap));
    setError("");
  }, [selectedMap]);

  const updateTransform = (updates: Partial<Pick<StoredMapAsset, "flipX" | "flipY" | "rotateDeg">>) => {
    if (!asset) {
      setError("Choose an image before editing transform settings.");
      return;
    }

    const nextAsset = {
      ...asset,
      ...updates,
    };
    const validation = validateStoredMapAsset(nextAsset);

    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return;
    }

    saveStoredMapAsset(nextAsset);
    setAsset(nextAsset);
    setError("");
    onStatusChange("Map asset saved");
  };

  const handleFileChange = (file: File | undefined) => {
    const fileValidation = validateImageFile(file);

    if (!fileValidation.valid || !file) {
      setError(fileValidation.errors.join(" "));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const image = new Image();

      image.onload = () => {
        const nextAsset: StoredMapAsset = {
          dataUrl,
          flipX: asset?.flipX ?? false,
          flipY: asset?.flipY ?? false,
          height: image.naturalHeight,
          map: selectedMap,
          rotateDeg: asset?.rotateDeg ?? 0,
          width: image.naturalWidth,
        };
        const validation = validateStoredMapAsset(nextAsset);

        if (!validation.valid) {
          setError(validation.errors.join(" "));
          return;
        }

        saveStoredMapAsset(nextAsset);
        setAsset(nextAsset);
        setError("");
        onStatusChange("Map asset saved");
      };

      image.onerror = () => setError("Image preview could not be loaded.");
      image.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    resetStoredMapAsset(selectedMap);
    setAsset(undefined);
    setError("");
    onStatusChange("Map asset reset");
  };

  return (
    <SettingsSection
      description="Register local placeholder map images and transform settings for future heatmap calibration."
      title="Map Assets"
    >
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Map</span>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
              value={selectedMap}
              onChange={(event) => setSelectedMap(event.target.value as ValorantMap)}
            >
              {VALORANT_MAPS.map((map) => (
                <option key={map} value={map}>
                  {map}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Image File</span>
            <input
              accept="image/*"
              className="w-full rounded-md border border-white/10 bg-[#090b10] p-3 text-sm font-bold text-white file:mr-3 file:rounded file:border-0 file:bg-valorant-red file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
              type="file"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3">
              <span className="text-sm font-black text-white">Flip X</span>
              <input
                checked={asset?.flipX ?? false}
                className="h-4 w-4 accent-valorant-red"
                disabled={!asset}
                type="checkbox"
                onChange={(event) => updateTransform({ flipX: event.target.checked })}
              />
            </label>
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3">
              <span className="text-sm font-black text-white">Flip Y</span>
              <input
                checked={asset?.flipY ?? false}
                className="h-4 w-4 accent-valorant-red"
                disabled={!asset}
                type="checkbox"
                onChange={(event) => updateTransform({ flipY: event.target.checked })}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Rotate</span>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60 disabled:text-white/30"
              disabled={!asset}
              value={asset?.rotateDeg ?? 0}
              onChange={(event) => updateTransform({ rotateDeg: Number(event.target.value) as StoredMapAsset["rotateDeg"] })}
            >
              {[0, 90, 180, 270].map((value) => (
                <option key={value} value={value}>
                  {value} deg
                </option>
              ))}
            </select>
          </label>

          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
            type="button"
            onClick={handleReset}
          >
            Reset to Placeholder
          </button>

          {error && (
            <p className="rounded-md border border-valorant-red/40 bg-valorant-red/10 p-3 text-sm font-bold text-valorant-red">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white/50">Preview</h3>
            <span className="text-xs font-bold text-white/40">
              {asset ? `${asset.width} x ${asset.height}` : "placeholder"}
            </span>
          </div>
          {asset ? (
            <img
              alt={`${asset.map} preview`}
              className="aspect-square w-full rounded border border-white/10 object-contain"
              src={asset.dataUrl}
            />
          ) : (
            <div className="grid aspect-square w-full place-items-center rounded border border-white/10 bg-[#090b10] text-center">
              <div>
                <p className="text-3xl font-black text-white">{selectedMap}</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white/40">placeholder</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}

function MapCalibrationSettingsSection({ onStatusChange }: { onStatusChange: (status: string) => void }) {
  const [selectedMap, setSelectedMap] = useState<ValorantMap>("Ascent");
  const [calibration, setCalibration] = useState<MapCalibration>(() => loadMapCalibration("Ascent"));
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>(() => loadCalibrationPoints("Ascent"));
  const [modifiedCount, setModifiedCount] = useState(() => getModifiedMapCalibrationCount());
  const [error, setError] = useState("");

  useEffect(() => {
    setCalibration(loadMapCalibration(selectedMap));
    setCalibrationPoints(loadCalibrationPoints(selectedMap));
    setModifiedCount(getModifiedMapCalibrationCount());
    setError("");
  }, [selectedMap]);
  const calibrationPreview = useMemo(
    () =>
      buildCalibrationPreview({
        calibration,
        points: calibrationPoints,
      }),
    [calibration, calibrationPoints],
  );

  const updateCalibrationDraft = (updates: Partial<MapCalibration>) => {
    setCalibration((current) => ({
      ...current,
      ...updates,
    }));
  };

  const handleSave = () => {
    const validation = validateMapCalibration(calibration);

    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return;
    }

    saveMapCalibration(selectedMap, calibration);
    setModifiedCount(getModifiedMapCalibrationCount());
    setError("");
    onStatusChange("Calibration saved");
  };

  const handleReset = () => {
    resetMapCalibration(selectedMap);
    setCalibration(DEFAULT_MAP_CALIBRATION);
    setModifiedCount(getModifiedMapCalibrationCount());
    setError("");
    onStatusChange("Calibration reset");
  };

  const handleAddTestPoint = () => {
    const nextPoint: CalibrationPoint = {
      id: crypto.randomUUID(),
      label: `Point ${calibrationPoints.length + 1}`,
      map: selectedMap,
      x: 512,
      y: 512,
    };
    const validation = validateCalibrationPoint(nextPoint);

    if (!validation.valid) {
      setError(validation.errors.join(" "));
      return;
    }

    saveCalibrationPoint(nextPoint);
    setCalibrationPoints(loadCalibrationPoints(selectedMap));
    setError("");
    onStatusChange("Test point added");
  };

  const handleDeleteTestPoint = (pointId: string) => {
    deleteCalibrationPoint(pointId);
    setCalibrationPoints(loadCalibrationPoints(selectedMap));
    onStatusChange("Test point deleted");
  };

  const handleResetTestPoints = () => {
    resetCalibrationPoints(selectedMap);
    setCalibrationPoints([]);
    onStatusChange("Test points reset");
  };

  return (
    <SettingsSection
      description="Fine tune heatmap alignment after asset transform. Calibration is applied after flip and rotate."
      title="Map Alignment"
    >
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Map</span>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
              value={selectedMap}
              onChange={(event) => setSelectedMap(event.target.value as ValorantMap)}
            >
              {VALORANT_MAPS.map((map) => (
                <option key={map} value={map}>
                  {map}
                </option>
              ))}
            </select>
          </label>

          <NumberInput
            label="offsetX"
            value={calibration.offsetX}
            onChange={(offsetX) => updateCalibrationDraft({ offsetX })}
          />
          <NumberInput
            label="offsetY"
            value={calibration.offsetY}
            onChange={(offsetY) => updateCalibrationDraft({ offsetY })}
          />
          <NumberInput
            label="scale"
            step={0.01}
            value={calibration.scale}
            onChange={(scale) => updateCalibrationDraft({ scale })}
          />
          <NumberInput
            label="rotation"
            value={calibration.rotation}
            onChange={(rotation) => updateCalibrationDraft({ rotation })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-md border border-valorant-red/60 bg-valorant-red px-4 text-sm font-black text-white transition hover:bg-valorant-red/80"
              type="button"
              onClick={handleSave}
            >
              Save Calibration
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
              type="button"
              onClick={handleReset}
            >
              Reset Calibration
            </button>
          </div>

          {error && (
            <p className="rounded-md border border-valorant-red/40 bg-valorant-red/10 p-3 text-sm font-bold text-valorant-red">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-white/50">Current Calibration</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard icon={Gauge} label="offsetX" value={String(calibration.offsetX)} />
              <InfoCard icon={Gauge} label="offsetY" value={String(calibration.offsetY)} />
              <InfoCard icon={Gauge} label="scale" value={String(calibration.scale)} />
              <InfoCard icon={Gauge} label="rotation" value={String(calibration.rotation)} />
              <InfoCard icon={Database} label="Modified Maps Count" value={String(modifiedCount)} />
              <InfoCard icon={Database} label="Total Test Points" value={String(calibrationPreview.summary.totalTestPoints)} />
              <InfoCard icon={Gauge} label="Average Offset" value={calibrationPreview.summary.averageOffset.toFixed(2)} />
              <InfoCard icon={Gauge} label="Largest Offset" value={calibrationPreview.summary.largestOffset.toFixed(2)} />
            </div>
          </div>

          <CalibrationPreview calibration={calibration} map={selectedMap} />
        </div>
      </div>

      <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white/50">Calibration Test Points</h3>
            <p className="mt-1 text-sm font-semibold text-white/45">Compare before and after calibration coordinates.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-valorant-red/60 bg-valorant-red px-3 text-sm font-black text-white transition hover:bg-valorant-red/80"
              type="button"
              onClick={handleAddTestPoint}
            >
              Add Test Point
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
              type="button"
              onClick={handleResetTestPoints}
            >
              Reset Test Points
            </button>
          </div>
        </div>
        <CalibrationPointTable points={calibrationPreview.points} onDelete={handleDeleteTestPoint} />
      </div>
    </SettingsSection>
  );
}

function NumberInput({
  label,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ConflictPreviewTable({ conflicts }: { conflicts: ConflictPreviewRow[] }) {
  return (
    <div className="mt-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Preview Table</h3>
      <div className="overflow-x-auto rounded-md border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
              <th className="py-3 pl-4 pr-3 font-bold">Match ID</th>
              <th className="py-3 pr-3 font-bold">Action</th>
              <th className="py-3 pr-3 font-bold">Existing</th>
              <th className="py-3 pr-3 font-bold">Incoming Count</th>
              <th className="py-3 pr-4 font-bold">Reason</th>
            </tr>
          </thead>
          <tbody>
            {conflicts.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-white/45" colSpan={5}>
                  No conflict preview yet
                </td>
              </tr>
            ) : (
              conflicts.slice(0, 10).map((conflict) => (
                <tr key={`${conflict.matchId}-${conflict.action}`} className="border-b border-white/5 text-white/70 last:border-0">
                  <td className="py-3 pl-4 pr-3 font-black text-white">{conflict.matchId}</td>
                  <td className="py-3 pr-3 capitalize">{conflict.action}</td>
                  <td className="py-3 pr-3">{conflict.existing ? "Yes" : "No"}</td>
                  <td className="py-3 pr-3">{conflict.incomingCount}</td>
                  <td className="py-3 pr-4 text-white/55">{conflict.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalibrationPreview({ calibration, map }: { calibration: MapCalibration; map: ValorantMap }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md border border-white/10 bg-[#090b10]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-8 border border-valorant-red/30" />
      <div
        className="absolute left-1/2 top-1/2 grid h-20 w-20 place-items-center rounded border border-emerald-300/60 bg-emerald-300/10 text-xs font-black text-emerald-200"
        style={{
          transform: `translate(calc(-50% + ${calibration.offsetX}px), calc(-50% + ${calibration.offsetY}px)) scale(${calibration.scale}) rotate(${calibration.rotation}deg)`,
        }}
      >
        {map}
      </div>
    </div>
  );
}

function CalibrationPointTable({
  onDelete,
  points,
}: {
  onDelete: (pointId: string) => void;
  points: CalibrationPreviewPoint[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
            <th className="py-3 pr-4 font-bold">Label</th>
            <th className="py-3 pr-4 font-bold">Before</th>
            <th className="py-3 pr-4 font-bold">After</th>
            <th className="py-3 pr-4 font-bold">Delta X</th>
            <th className="py-3 pr-4 font-bold">Delta Y</th>
            <th className="py-3 pr-0 font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          {points.length === 0 ? (
            <tr>
              <td className="py-8 text-center text-white/45" colSpan={6}>
                No calibration test points yet
              </td>
            </tr>
          ) : (
            points.map((point) => (
              <tr key={point.id} className="border-b border-white/5 text-white/75 last:border-0">
                <td className="py-3 pr-4 font-black text-white">{point.label}</td>
                <td className="py-3 pr-4">
                  {point.beforeX.toFixed(1)}, {point.beforeY.toFixed(1)}
                </td>
                <td className="py-3 pr-4">
                  {point.afterX.toFixed(1)}, {point.afterY.toFixed(1)}
                </td>
                <td className="py-3 pr-4">{point.deltaX.toFixed(1)}</td>
                <td className="py-3 pr-4">{point.deltaY.toFixed(1)}</td>
                <td className="py-3 pr-0">
                  <button
                    className="rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
                    type="button"
                    onClick={() => onDelete(point.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/40">
        <Icon className="h-4 w-4 text-valorant-red" aria-hidden="true" />
        {label}
      </div>
      <p className="break-all text-sm font-semibold text-white/70">{value}</p>
    </div>
  );
}
