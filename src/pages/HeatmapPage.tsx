import { Activity, Crosshair, Download, ShieldCheck, Target, TriangleAlert, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PracticeSummaryCard } from "../components/PracticeSummaryCard";
import { getCurrentDataSourceData } from "../dataSources/getCurrentDataSource";
import { buildDangerZones, summarizeDangerZones } from "../heatmap/buildDangerZones";
import { buildHeatmapPoints, buildHeatmapPointSummary } from "../heatmap/buildHeatmapPoints";
import { buildHeatmapInsights } from "../heatmap/buildHeatmapInsights";
import { buildKillDeathHeatmap } from "../heatmap/buildKillDeathHeatmap";
import { buildMultiKillZones, summarizeMultiKillZones } from "../heatmap/buildMultiKillZones";
import { buildRiskRewardZones, summarizeRiskRewardZones } from "../heatmap/buildRiskRewardZones";
import { buildSuccessZones, summarizeSuccessZones } from "../heatmap/buildSuccessZones";
import { calculateKillDeathSummary } from "../heatmap/calculateKillDeathSummary";
import { downloadDangerZonesCsv } from "../heatmap/exportDangerZonesCsv";
import { downloadHeatmapCsv } from "../heatmap/exportHeatmapCsv";
import { downloadMultiKillZonesCsv } from "../heatmap/exportMultiKillZonesCsv";
import { downloadRiskRewardCsv } from "../heatmap/exportRiskRewardCsv";
import { downloadSuccessZonesCsv } from "../heatmap/exportSuccessZonesCsv";
import { filterHeatmapTimelineEvents } from "../heatmap/filterHeatmapPoints";
import type { HeatmapInsight } from "../heatmap/heatmapInsightTypes";
import type {
  DangerZone,
  HeatmapDisplayMode,
  HeatmapFilters,
  HeatmapMode,
  HeatmapPoint,
  KillDeathHeatmap,
  MultiKillZone,
  RiskRewardZone,
  SuccessZone,
} from "../heatmap/heatmapTypes";
import { renderDensityLayer } from "../heatmap/renderDensityLayer";
import { getMapAsset } from "../maps/mapAssetRegistry";
import type { MapAsset } from "../maps/mapAssetTypes";
import { DEFAULT_MAP_CALIBRATION, loadMapCalibration } from "../maps/mapCalibrationStorage";
import { buildCalibrationPreview } from "../maps/buildCalibrationPreview";
import { loadCalibrationPoints } from "../maps/calibrationPointStorage";
import type { CalibrationPreviewPoint } from "../maps/calibrationPointTypes";
import { VALORANT_MAPS } from "../maps/mapMetadata";
import { isValorantMap } from "../maps/mapMetadata";
import { getRiotApiClientStatus } from "../riot/client/riotApiClient";
import { loadTimelineEvents } from "../timeline/timelineStorage";

const eventTypeOptions = ["All", "kill", "death", "assist", "plant", "defuse"];
const weaponOptions = ["All", "Vandal", "Phantom", "Sheriff", "Guardian", "Operator", "Marshal"];
const agentOptions = ["All", "Jett", "Raze", "Reyna", "Sova", "Omen", "Cypher", "Killjoy", "Skye", "Phoenix"];
const mapOptions = ["All", ...VALORANT_MAPS];
const teamOptions = [
  { label: "All", value: "All" },
  { label: "Ally", value: "ally" },
  { label: "Enemy", value: "enemy" },
];
const ownershipOptions = [
  { label: "All", value: "All" },
  { label: "Player Only", value: "playerOnly" },
];
const displayModeOptions: Array<{ label: string; value: HeatmapDisplayMode }> = [
  { label: "Points", value: "points" },
  { label: "Density", value: "density" },
  { label: "Points + Density", value: "combined" },
];
const heatmapModeOptions: Array<{ label: string; value: HeatmapMode }> = [
  { label: "All Events", value: "all" },
  { label: "Kill Heatmap", value: "kill" },
  { label: "Death Heatmap", value: "death" },
  { label: "Kill + Death Compare", value: "compare" },
];

const canvasSize = 1024;

export function HeatmapPage() {
  const publicDemoMode = useMemo(() => getRiotApiClientStatus().publicDemoMode, []);
  const currentData = useMemo(() => getCurrentDataSourceData(), []);
  const storedTimelineData = useMemo(() => loadTimelineEvents(), []);
  const timelineEvents =
    currentData.timelineEvents.length > 0 ? currentData.timelineEvents : storedTimelineData.timelineEvents;
  const matchMapById = useMemo(
    () => new Map(currentData.matches.map((match) => [match.matchId, match.map])),
    [currentData.matches],
  );
  const [filters, setFilters] = useState<HeatmapFilters>({
    agent: "All",
    eventType: "All",
    map: "All",
    ownership: "All",
    team: "All",
    weapon: "All",
  });
  const [displayMode, setDisplayMode] = useState<HeatmapDisplayMode>("combined");
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("all");
  const [gridSize, setGridSize] = useState(16);
  const [showBackgroundLayer, setShowBackgroundLayer] = useState(true);
  const [showCalibrationLabels, setShowCalibrationLabels] = useState(true);
  const [showCalibrationPoints, setShowCalibrationPoints] = useState(true);
  const [showDensityLayer, setShowDensityLayer] = useState(true);
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showMultiKillZones, setShowMultiKillZones] = useState(true);
  const [showPointLayer, setShowPointLayer] = useState(true);
  const [showRiskRewardZones, setShowRiskRewardZones] = useState(true);
  const [showSuccessZones, setShowSuccessZones] = useState(true);
  const [dangerMinDeathCount, setDangerMinDeathCount] = useState(1);
  const [successMinKillCount, setSuccessMinKillCount] = useState(1);
  const [opacity, setOpacity] = useState(0.55);
  const filteredTimelineEvents = useMemo(
    () => filterHeatmapTimelineEvents(timelineEvents, filters, matchMapById),
    [filters, matchMapById, timelineEvents],
  );
  const points = useMemo(
    () => buildHeatmapPoints(filteredTimelineEvents, matchMapById),
    [filteredTimelineEvents, matchMapById],
  );
  const heatmap = useMemo(
    () => buildKillDeathHeatmap({ canvasSize, gridSize, heatmapMode, points }),
    [gridSize, heatmapMode, points],
  );
  const summary = useMemo(() => buildHeatmapPointSummary(heatmap.visiblePoints), [heatmap.visiblePoints]);
  const killDeathSummary = useMemo(
    () =>
      calculateKillDeathSummary({
        deathDensityGrid: heatmap.deathDensityGrid,
        deathPoints: heatmap.deathPoints,
        killDensityGrid: heatmap.killDensityGrid,
        killPoints: heatmap.killPoints,
      }),
    [heatmap],
  );
  const dangerZones = useMemo(
    () =>
      buildDangerZones({
        deathDensityGrid: heatmap.deathDensityGrid,
        minDeathCount: dangerMinDeathCount,
      }),
    [dangerMinDeathCount, heatmap.deathDensityGrid],
  );
  const dangerSummary = useMemo(() => summarizeDangerZones(dangerZones), [dangerZones]);
  const successZones = useMemo(
    () =>
      buildSuccessZones({
        killDensityGrid: heatmap.killDensityGrid,
        minKillCount: successMinKillCount,
      }),
    [heatmap.killDensityGrid, successMinKillCount],
  );
  const successSummary = useMemo(() => summarizeSuccessZones(successZones), [successZones]);
  const riskRewardZones = useMemo(
    () =>
      buildRiskRewardZones({
        deathDensityGrid: heatmap.deathDensityGrid,
        killDensityGrid: heatmap.killDensityGrid,
      }),
    [heatmap.deathDensityGrid, heatmap.killDensityGrid],
  );
  const riskRewardSummary = useMemo(() => summarizeRiskRewardZones(riskRewardZones), [riskRewardZones]);
  const multiKillZones = useMemo(
    () =>
      buildMultiKillZones({
        canvasSize,
        gridSize,
        matchMapById,
        timelineEvents: filteredTimelineEvents,
      }),
    [filteredTimelineEvents, gridSize, matchMapById],
  );
  const multiKillSummary = useMemo(() => summarizeMultiKillZones(multiKillZones), [multiKillZones]);
  const insights = useMemo(
    () => buildHeatmapInsights({ dangerZones, riskRewardZones: publicDemoMode ? [] : riskRewardZones, successZones }),
    [dangerZones, publicDemoMode, riskRewardZones, successZones],
  );
  const selectedMapAsset = useMemo(
    () => (filters.map === "All" ? undefined : getMapAsset(filters.map)),
    [filters.map],
  );
  const selectedMapCalibration = useMemo(
    () => (isValorantMap(filters.map) ? loadMapCalibration(filters.map) : DEFAULT_MAP_CALIBRATION),
    [filters.map],
  );
  const calibrationPreview = useMemo(
    () =>
      isValorantMap(filters.map)
        ? buildCalibrationPreview({
            calibration: selectedMapCalibration,
            points: loadCalibrationPoints(filters.map),
          })
        : buildCalibrationPreview({
            calibration: DEFAULT_MAP_CALIBRATION,
            points: [],
          }),
    [filters.map, selectedMapCalibration],
  );
  const invalidCoordinates = filteredTimelineEvents.length - points.length;

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-5 flex items-center gap-3">
            <Crosshair className="h-5 w-5 text-valorant-red" aria-hidden="true" />
            <h2 className="text-base font-bold text-white">Point Plot Filters</h2>
          </div>

          <div className="space-y-5">
            <SelectField
              label="Agent"
              value={filters.agent}
              options={agentOptions}
              onChange={(agent) => setFilters((current) => ({ ...current, agent }))}
            />

            <SelectField
              label="Event Type"
              value={filters.eventType}
              options={eventTypeOptions}
              onChange={(eventType) =>
                setFilters((current) => ({ ...current, eventType: eventType as HeatmapFilters["eventType"] }))
              }
            />

            <SelectField
              label="Map"
              value={filters.map}
              options={mapOptions}
              onChange={(map) => setFilters((current) => ({ ...current, map }))}
            />

            <SelectField
              label="Weapon"
              value={filters.weapon}
              options={weaponOptions}
              onChange={(weapon) => setFilters((current) => ({ ...current, weapon }))}
            />

            <SelectField
              label="Team"
              value={filters.team}
              options={teamOptions.map((option) => option.value)}
              getLabel={(value) => teamOptions.find((option) => option.value === value)?.label ?? value}
              onChange={(team) => setFilters((current) => ({ ...current, team: team as HeatmapFilters["team"] }))}
            />

            <SelectField
              label="Ownership"
              value={filters.ownership}
              options={ownershipOptions.map((option) => option.value)}
              getLabel={(value) => ownershipOptions.find((option) => option.value === value)?.label ?? value}
              onChange={(ownership) =>
                setFilters((current) => ({ ...current, ownership: ownership as HeatmapFilters["ownership"] }))
              }
            />

            <SelectField
              label="Display Mode"
              value={displayMode}
              options={displayModeOptions.map((option) => option.value)}
              getLabel={(value) => displayModeOptions.find((option) => option.value === value)?.label ?? value}
              onChange={(mode) => setDisplayMode(mode as HeatmapDisplayMode)}
            />

            <SelectField
              label="Heatmap Mode"
              value={heatmapMode}
              options={heatmapModeOptions.map((option) => option.value)}
              getLabel={(value) => heatmapModeOptions.find((option) => option.value === value)?.label ?? value}
              onChange={(mode) => setHeatmapMode(mode as HeatmapMode)}
            />

            <NumberField
              label="Grid Size"
              max={64}
              min={4}
              step={1}
              value={gridSize}
              onChange={setGridSize}
            />

            <NumberField
              label="Density Opacity"
              max={1}
              min={0.1}
              step={0.05}
              value={opacity}
              onChange={setOpacity}
            />

            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Layer Controls</h3>
              <div className="grid gap-2">
                <ToggleField checked={showBackgroundLayer} label="Background" onChange={setShowBackgroundLayer} />
                {!publicDemoMode && (
                  <>
                    <ToggleField checked={showCalibrationPoints} label="Calibration Points" onChange={setShowCalibrationPoints} />
                    <ToggleField checked={showCalibrationLabels} label="Calibration Labels" onChange={setShowCalibrationLabels} />
                  </>
                )}
                <ToggleField checked={showDensityLayer} label="Density" onChange={setShowDensityLayer} />
                <ToggleField checked={showPointLayer} label="Points" onChange={setShowPointLayer} />
                <ToggleField checked={showDangerZones} label="Risk Zones" onChange={setShowDangerZones} />
                <ToggleField checked={showSuccessZones} label="Strong Zones" onChange={setShowSuccessZones} />
                {!publicDemoMode && (
                  <ToggleField checked={showRiskRewardZones} label="Kill/Death Balance" onChange={setShowRiskRewardZones} />
                )}
                <ToggleField checked={showMultiKillZones} label="Multi Kill Zones" onChange={setShowMultiKillZones} />
              </div>
            </div>

            <NumberField
              label="Risk Zone Min Death Count"
              max={10}
              min={1}
              step={1}
              value={dangerMinDeathCount}
              onChange={setDangerMinDeathCount}
            />

            <NumberField
              label="Strong Zone Min Kill Count"
              max={10}
              min={1}
              step={1}
              value={successMinKillCount}
              onChange={setSuccessMinKillCount}
            />

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-valorant-red/60 bg-valorant-red px-4 text-sm font-black text-white transition hover:bg-valorant-red/80 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-white/35"
              disabled={heatmap.visiblePoints.length === 0}
              type="button"
              onClick={() => downloadHeatmapCsv(heatmap.visiblePoints, heatmapMode)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10 disabled:cursor-not-allowed disabled:text-white/35"
              disabled={dangerZones.length === 0}
              type="button"
              onClick={() => downloadDangerZonesCsv(dangerZones)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Risk Zones
            </button>

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-emerald-400/50 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:text-white/35"
              disabled={successZones.length === 0}
              type="button"
              onClick={() => downloadSuccessZonesCsv(successZones)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Strong Zones
            </button>

            {!publicDemoMode && (
              <button
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-sky-300/50 hover:bg-sky-300/10 disabled:cursor-not-allowed disabled:text-white/35"
                disabled={riskRewardZones.length === 0}
                type="button"
                onClick={() => downloadRiskRewardCsv(riskRewardZones)}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export Kill/Death Balance
              </button>
            )}

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white transition hover:border-violet-300/50 hover:bg-violet-300/10 disabled:cursor-not-allowed disabled:text-white/35"
              disabled={multiKillZones.length === 0}
              type="button"
              onClick={() => downloadMultiKillZonesCsv(multiKillZones)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Multi Kill Zones
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <h2 className="mb-4 text-base font-bold text-white">Point Plot Source</h2>
          <div className="grid gap-3">
            <InfoRow label="Timeline Events" value={String(timelineEvents.length)} />
            <InfoRow label="Filtered Events" value={String(filteredTimelineEvents.length)} />
            <InfoRow label="Drawable Points" value={String(points.length)} />
            <InfoRow label="Visible Points" value={String(heatmap.visiblePoints.length)} />
            <InfoRow label="Invalid Coordinates" value={String(invalidCoordinates)} />
            <InfoRow label="Max Density" value={String(heatmap.visibleDensityGrid.maxDensity)} />
            <InfoRow label="Active Cells" value={String(heatmap.visibleDensityGrid.activeCells)} />
            <InfoRow label="Risk Zone Count" value={String(dangerZones.length)} />
            <InfoRow label="Highest Risk Score" value={dangerSummary.highestDangerScore.toFixed(2)} />
            <InfoRow label="Strong Zone Count" value={String(successZones.length)} />
            <InfoRow label="Highest Strong Score" value={successSummary.highestSuccessScore.toFixed(2)} />
            {!publicDemoMode && (
              <>
                <InfoRow label="Kill-Lean Cell Count" value={String(riskRewardSummary.rewardZoneCount)} />
                <InfoRow label="Death-Lean Cell Count" value={String(riskRewardSummary.riskZoneCount)} />
              </>
            )}
            <InfoRow label="Multi Kill Count" value={String(multiKillZones.length)} />
            <InfoRow label="Highest Multi Kill Score" value={multiKillSummary.highestScore.toFixed(2)} />
          </div>
        </section>

      </aside>

      <section className="min-w-0 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
          <PracticeSummaryCard icon={Users} label="Selected Agent" value={filters.agent} />
          <PracticeSummaryCard icon={Activity} label="Events" value={summary.totalPoints} />
          <PracticeSummaryCard icon={Activity} label="Total Points" value={summary.totalPoints} />
          <PracticeSummaryCard icon={Target} label="Kill Points" value={summary.killPoints} />
          <PracticeSummaryCard icon={TriangleAlert} label="Death Points" value={summary.deathPoints} />
          <PracticeSummaryCard icon={Crosshair} label="Player Events" value={summary.playerEvents} />
          <PracticeSummaryCard icon={ShieldCheck} label="Ally Events" value={summary.allyEvents} />
          <PracticeSummaryCard icon={Users} label="Enemy Events" value={summary.enemyEvents} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <StatCard label="Kill Density Max" value={String(killDeathSummary.killDensityMax)} />
          <StatCard label="Death Density Max" value={String(killDeathSummary.deathDensityMax)} />
          <StatCard label="Kill/Death Ratio" value={killDeathSummary.killDeathRatio.toFixed(2)} />
          <StatCard label="Most Dense Event Type" value={killDeathSummary.mostDenseEventType} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Risk Zones" value={String(dangerSummary.dangerZoneCount)} />
          <StatCard label="Highest Risk Score" value={dangerSummary.highestDangerScore.toFixed(2)} />
          <StatCard label="Average Risk Score" value={dangerSummary.averageDangerScore.toFixed(2)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Strong Zones" value={String(successSummary.successZoneCount)} />
          <StatCard label="Highest Strong Score" value={successSummary.highestSuccessScore.toFixed(2)} />
          <StatCard label="Average Strong Score" value={successSummary.averageSuccessScore.toFixed(2)} />
        </div>

        {!publicDemoMode && (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
            <StatCard label="Kill-Lean Cells" value={String(riskRewardSummary.rewardZoneCount)} />
            <StatCard label="Death-Lean Cells" value={String(riskRewardSummary.riskZoneCount)} />
            <StatCard label="Average Score" value={riskRewardSummary.averageScore.toFixed(2)} />
            <StatCard label="Highest Balance Cell" value={formatRiskRewardZone(riskRewardSummary.bestZone)} />
            <StatCard label="Lowest Balance Cell" value={formatRiskRewardZone(riskRewardSummary.worstZone)} />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Multi Kill Zones" value={String(multiKillSummary.multiKillZoneCount)} />
          <StatCard label="Highest Score" value={multiKillSummary.highestScore.toFixed(2)} />
          <StatCard label="Average Score" value={multiKillSummary.averageScore.toFixed(2)} />
        </div>

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">Heatmap Notes</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">Template-based post-match review notes</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {insights.map((insight, index) => (
              <InsightCard insight={insight} key={`${insight.type}-${insight.title}-${index}`} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Point Plot Viewer</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">
                Kill and death events can be separated or overlaid. No map image or Riot API is used.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.08em] text-white/45">
              <LegendDot color="#ff4655" label="Kill" />
              <LegendDot color="#f59e0b" label="Death" />
              <LegendDot color="#38bdf8" label="Assist" />
              <LegendDot color="#22c55e" label="Plant" />
              <LegendDot color="#a78bfa" label="Defuse" />
            </div>
          </div>

          <PointPlotCanvas
            displayMode={displayMode}
            calibrationPoints={calibrationPreview.points}
            dangerZones={dangerZones}
            heatmap={heatmap}
            heatmapMode={heatmapMode}
            multiKillZones={multiKillZones}
            opacity={opacity}
            selectedMapAsset={selectedMapAsset}
            showBackgroundLayer={showBackgroundLayer}
            showCalibrationLabels={!publicDemoMode && showCalibrationLabels}
            showCalibrationPoints={!publicDemoMode && showCalibrationPoints}
            showDangerZones={showDangerZones}
            showDensityLayer={showDensityLayer}
            showMultiKillZones={showMultiKillZones}
            showPointLayer={showPointLayer}
            showRiskRewardZones={!publicDemoMode && showRiskRewardZones}
            showSuccessZones={showSuccessZones}
            riskRewardZones={riskRewardZones}
            successZones={successZones}
          />
        </section>

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Top 10 Risk Zones</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">Highest death-density cells in the current view</p>
            </div>
            <p className="text-sm font-black text-valorant-red">{dangerZones.length} zones</p>
          </div>
          <DangerZoneTable dangerZones={dangerZones.slice(0, 10)} />
        </section>

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Top 10 Strong Zones</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">Highest kill-density cells in the current view</p>
            </div>
            <p className="text-sm font-black text-emerald-300">{successZones.length} zones</p>
          </div>
          <SuccessZoneTable successZones={successZones.slice(0, 10)} />
        </section>

        {!publicDemoMode && (
          <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Kill/Death Balance Cells</h2>
                <p className="mt-1 text-sm font-semibold text-white/50">Cells classified by kill count versus death count</p>
              </div>
              <p className="text-sm font-black text-sky-300">{riskRewardZones.length} zones</p>
            </div>
            <RiskRewardZoneTable zones={riskRewardZones} />
          </section>
        )}

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Top 10 Multi Kill Zones</h2>
              <p className="mt-1 text-sm font-semibold text-white/50">Cells where repeated kills cluster within a short time window</p>
            </div>
            <p className="text-sm font-black text-violet-300">{multiKillZones.length} zones</p>
          </div>
          <MultiKillZoneTable multiKillZones={multiKillZones.slice(0, 10)} />
        </section>
      </section>
    </div>
  );
}

function formatRiskRewardZone(zone: RiskRewardZone | undefined) {
  if (!zone) {
    return "-";
  }

  return `${zone.score.toFixed(2)} (${formatBalanceCategory(zone.category)})`;
}

function InsightCard({ insight }: { insight: HeatmapInsight }) {
  return (
    <article className={`rounded-md border p-4 ${getInsightClassName(insight)}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.14em]">{formatInsightType(insight.type)}</span>
        <span className="rounded border border-current px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em]">
          {insight.severity}
        </span>
      </div>
      <h3 className="text-base font-black text-white">{insight.title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/65">{insight.description}</p>
    </article>
  );
}

function getInsightClassName(insight: HeatmapInsight) {
  if (insight.type === "danger" || insight.type === "risk") {
    return "border-valorant-red/30 bg-valorant-red/10 text-valorant-red";
  }

  if (insight.type === "success" || insight.type === "reward") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/50";
}

function ToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3">
      <span className="text-sm font-black text-white">{label}</span>
      <input
        checked={checked}
        className="h-4 w-4 accent-valorant-red"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <p className="text-sm font-bold text-white/60">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">
        {label}
        <span className="text-white/70">{value}</span>
      </span>
      <input
        className="w-full accent-valorant-red"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectField({
  getLabel,
  label,
  onChange,
  options,
  value,
}: {
  getLabel?: (value: string) => string;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel ? getLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function PointPlotCanvas({
  calibrationPoints,
  dangerZones,
  displayMode,
  heatmap,
  heatmapMode,
  multiKillZones,
  opacity,
  riskRewardZones,
  selectedMapAsset,
  showBackgroundLayer,
  showCalibrationLabels,
  showCalibrationPoints,
  showDangerZones,
  showDensityLayer,
  showMultiKillZones,
  showPointLayer,
  showRiskRewardZones,
  showSuccessZones,
  successZones,
}: {
  calibrationPoints: CalibrationPreviewPoint[];
  dangerZones: DangerZone[];
  displayMode: HeatmapDisplayMode;
  heatmap: KillDeathHeatmap;
  heatmapMode: HeatmapMode;
  multiKillZones: MultiKillZone[];
  opacity: number;
  riskRewardZones: RiskRewardZone[];
  selectedMapAsset: MapAsset | undefined;
  showBackgroundLayer: boolean;
  showCalibrationLabels: boolean;
  showCalibrationPoints: boolean;
  showDangerZones: boolean;
  showDensityLayer: boolean;
  showMultiKillZones: boolean;
  showPointLayer: boolean;
  showRiskRewardZones: boolean;
  showSuccessZones: boolean;
  successZones: SuccessZone[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const renderScene = (backgroundImage?: HTMLImageElement) => {
      context.clearRect(0, 0, canvasSize, canvasSize);
      context.fillStyle = "#090b10";
      context.fillRect(0, 0, canvasSize, canvasSize);

      if (showBackgroundLayer) {
        if (backgroundImage) {
          renderImageBackground({ context, image: backgroundImage, label: selectedMapAsset?.map ?? "Map" });
        } else {
          renderPlaceholderBackground({
            context,
            label: selectedMapAsset?.map ?? "All Maps",
          });
        }
      }

      if (showDensityLayer && (displayMode === "density" || displayMode === "combined")) {
        if (heatmapMode === "compare") {
          renderDensityLayer({ color: "255, 70, 85", context, densityGrid: heatmap.killDensityGrid, opacity });
          renderDensityLayer({ color: "56, 189, 248", context, densityGrid: heatmap.deathDensityGrid, opacity });
        } else {
          renderDensityLayer({ context, densityGrid: heatmap.visibleDensityGrid, opacity });
        }
      }

      if (showCalibrationPoints) {
        renderCalibrationPoints({
          context,
          points: calibrationPoints,
          showLabels: showCalibrationLabels,
        });
      }

      if (showPointLayer && (displayMode === "points" || displayMode === "combined")) {
        heatmap.visiblePoints.forEach((point) => {
          context.beginPath();
          context.fillStyle = getPointColor(point.eventType);
          context.arc(point.x, point.y, point.isPlayerEvent ? 7 : 5, 0, Math.PI * 2);
          context.fill();
          context.lineWidth = 2;
          context.strokeStyle = point.team === "enemy" ? "rgba(245, 158, 11, 0.75)" : "rgba(255, 255, 255, 0.45)";
          context.stroke();
        });
      }

      if (showDangerZones) {
        renderDangerZones({ context, dangerZones, heatmap });
      }

      if (showSuccessZones) {
        renderSuccessZones({ context, heatmap, successZones });
      }

      if (showRiskRewardZones) {
        renderRiskRewardZones({ context, heatmap, zones: riskRewardZones });
      }

      if (showMultiKillZones) {
        renderMultiKillZones({ context, heatmap, multiKillZones });
      }
    };

    if (showBackgroundLayer && selectedMapAsset?.backgroundType === "image" && selectedMapAsset.dataUrl) {
      const image = new Image();
      image.onload = () => renderScene(image);
      image.onerror = () => renderScene();
      image.src = selectedMapAsset.dataUrl;
      return;
    }

    renderScene();
  }, [
    calibrationPoints,
    dangerZones,
    displayMode,
    heatmap,
    heatmapMode,
    multiKillZones,
    opacity,
    riskRewardZones,
    selectedMapAsset,
    showBackgroundLayer,
    showCalibrationLabels,
    showCalibrationPoints,
    showDangerZones,
    showDensityLayer,
    showMultiKillZones,
    showPointLayer,
    showRiskRewardZones,
    showSuccessZones,
    successZones,
  ]);

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-[#090b10]">
      <canvas
        ref={canvasRef}
        aria-label="Point plot canvas"
        className="block aspect-square w-full"
        height={canvasSize}
        width={canvasSize}
      />
    </div>
  );
}

function renderImageBackground({
  context,
  image,
  label,
}: {
  context: CanvasRenderingContext2D;
  image: HTMLImageElement;
  label: string;
}) {
  context.save();
  context.drawImage(image, 0, 0, canvasSize, canvasSize);
  context.fillStyle = "rgba(0, 0, 0, 0.22)";
  context.fillRect(0, 0, canvasSize, canvasSize);
  context.fillStyle = "rgba(255, 255, 255, 0.75)";
  context.font = "900 28px sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText(label, 28, 28);
  context.restore();
}

function renderPlaceholderBackground({
  context,
  label,
}: {
  context: CanvasRenderingContext2D;
  label: string;
}) {
  context.save();
  context.fillStyle = "#0c1018";
  context.fillRect(0, 0, canvasSize, canvasSize);

  context.strokeStyle = "rgba(255, 255, 255, 0.055)";
  context.lineWidth = 1;

  for (let position = 0; position <= canvasSize; position += 128) {
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvasSize);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvasSize, position);
    context.stroke();
  }

  context.strokeStyle = "rgba(255, 70, 85, 0.18)";
  context.lineWidth = 3;
  context.strokeRect(36, 36, canvasSize - 72, canvasSize - 72);

  context.fillStyle = "rgba(255, 255, 255, 0.12)";
  context.font = "900 72px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, canvasSize / 2, canvasSize / 2);

  context.fillStyle = "rgba(255, 70, 85, 0.5)";
  context.font = "700 24px sans-serif";
  context.fillText("placeholder map background", canvasSize / 2, canvasSize / 2 + 62);
  context.restore();
}

function renderCalibrationPoints({
  context,
  points,
  showLabels,
}: {
  context: CanvasRenderingContext2D;
  points: CalibrationPreviewPoint[];
  showLabels: boolean;
}) {
  points.forEach((point) => {
    context.save();
    context.strokeStyle = "rgba(255, 255, 255, 0.45)";
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(point.beforeX, point.beforeY);
    context.lineTo(point.afterX, point.afterY);
    context.stroke();

    context.setLineDash([]);
    context.fillStyle = "rgba(148, 163, 184, 0.9)";
    context.beginPath();
    context.arc(point.beforeX, point.beforeY, 6, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(52, 211, 153, 0.95)";
    context.beginPath();
    context.arc(point.afterX, point.afterY, 8, 0, Math.PI * 2);
    context.fill();

    if (showLabels) {
      context.fillStyle = "rgba(255, 255, 255, 0.88)";
      context.font = "800 18px sans-serif";
      context.textAlign = "left";
      context.fillText(point.label, point.afterX + 12, point.afterY - 12);
    }

    context.restore();
  });
}

function renderMultiKillZones({
  context,
  heatmap,
  multiKillZones,
}: {
  context: CanvasRenderingContext2D;
  heatmap: KillDeathHeatmap;
  multiKillZones: MultiKillZone[];
}) {
  const cellSize = heatmap.killDensityGrid.cellSize;

  multiKillZones.forEach((zone) => {
    const alpha = Math.max(0.35, zone.score);

    context.save();
    context.lineWidth = 3;
    context.setLineDash([4, 6]);
    context.strokeStyle = `rgba(196, 181, 253, ${alpha.toFixed(3)})`;
    context.strokeRect(zone.xIndex * cellSize + 24, zone.yIndex * cellSize + 24, cellSize - 48, cellSize - 48);
    context.lineWidth = 2;
    context.setLineDash([]);
    context.strokeStyle = `rgba(250, 204, 21, ${alpha.toFixed(3)})`;
    context.strokeRect(zone.xIndex * cellSize + 28, zone.yIndex * cellSize + 28, cellSize - 56, cellSize - 56);
    context.restore();
  });
}

function renderRiskRewardZones({
  context,
  heatmap,
  zones,
}: {
  context: CanvasRenderingContext2D;
  heatmap: KillDeathHeatmap;
  zones: RiskRewardZone[];
}) {
  const cellSize = heatmap.visibleDensityGrid.cellSize;

  zones.forEach((zone) => {
    const color = zone.category === "reward" ? "52, 211, 153" : zone.category === "risk" ? "255, 70, 85" : "148, 163, 184";
    const alpha = zone.category === "neutral" ? 0.45 : 0.8;

    context.save();
    context.lineWidth = 2;
    context.setLineDash([10, 8]);
    context.strokeStyle = `rgba(${color}, ${alpha})`;
    context.strokeRect(zone.xIndex * cellSize + 20, zone.yIndex * cellSize + 20, cellSize - 40, cellSize - 40);
    context.restore();
  });
}

function renderSuccessZones({
  context,
  heatmap,
  successZones,
}: {
  context: CanvasRenderingContext2D;
  heatmap: KillDeathHeatmap;
  successZones: SuccessZone[];
}) {
  const cellSize = heatmap.killDensityGrid.cellSize;

  successZones.forEach((zone) => {
    const alpha = Math.max(0.35, zone.successScore);

    context.save();
    context.lineWidth = 4;
    context.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    context.strokeRect(zone.xIndex * cellSize + 10, zone.yIndex * cellSize + 10, cellSize - 20, cellSize - 20);
    context.lineWidth = 2;
    context.strokeStyle = `rgba(52, 211, 153, ${alpha.toFixed(3)})`;
    context.strokeRect(zone.xIndex * cellSize + 14, zone.yIndex * cellSize + 14, cellSize - 28, cellSize - 28);
    context.restore();
  });
}

function renderDangerZones({
  context,
  dangerZones,
  heatmap,
}: {
  context: CanvasRenderingContext2D;
  dangerZones: DangerZone[];
  heatmap: KillDeathHeatmap;
}) {
  const cellSize = heatmap.deathDensityGrid.cellSize;

  dangerZones.forEach((zone) => {
    const alpha = Math.max(0.35, zone.dangerScore);

    context.save();
    context.lineWidth = 4;
    context.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    context.strokeRect(zone.xIndex * cellSize + 2, zone.yIndex * cellSize + 2, cellSize - 4, cellSize - 4);
    context.lineWidth = 2;
    context.strokeStyle = `rgba(255, 70, 85, ${alpha.toFixed(3)})`;
    context.strokeRect(zone.xIndex * cellSize + 6, zone.yIndex * cellSize + 6, cellSize - 12, cellSize - 12);
    context.restore();
  });
}

function DangerZoneTable({ dangerZones }: { dangerZones: DangerZone[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
            <th className="py-3 pr-4 font-bold">Rank</th>
            <th className="py-3 pr-4 font-bold">X Index</th>
            <th className="py-3 pr-4 font-bold">Y Index</th>
            <th className="py-3 pr-4 font-bold">Death Count</th>
            <th className="py-3 pr-0 font-bold">Risk Score</th>
          </tr>
        </thead>
        <tbody>
          {dangerZones.length === 0 ? (
            <tr>
              <td className="py-8 text-center text-white/45" colSpan={5}>
                No risk zones match the current threshold
              </td>
            </tr>
          ) : (
            dangerZones.map((zone, index) => (
              <tr key={`${zone.xIndex}-${zone.yIndex}`} className="border-b border-white/5 text-white/75 last:border-0">
                <td className="py-3 pr-4 font-black text-white">{index + 1}</td>
                <td className="py-3 pr-4">{zone.xIndex}</td>
                <td className="py-3 pr-4">{zone.yIndex}</td>
                <td className="py-3 pr-4">{zone.deathCount}</td>
                <td className="py-3 pr-0 font-black text-valorant-red">{zone.dangerScore.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SuccessZoneTable({ successZones }: { successZones: SuccessZone[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
            <th className="py-3 pr-4 font-bold">Rank</th>
            <th className="py-3 pr-4 font-bold">X Index</th>
            <th className="py-3 pr-4 font-bold">Y Index</th>
            <th className="py-3 pr-4 font-bold">Kill Count</th>
            <th className="py-3 pr-0 font-bold">Strong Score</th>
          </tr>
        </thead>
        <tbody>
          {successZones.length === 0 ? (
            <tr>
              <td className="py-8 text-center text-white/45" colSpan={5}>
                No strong zones match the current threshold
              </td>
            </tr>
          ) : (
            successZones.map((zone, index) => (
              <tr key={`${zone.xIndex}-${zone.yIndex}`} className="border-b border-white/5 text-white/75 last:border-0">
                <td className="py-3 pr-4 font-black text-white">{index + 1}</td>
                <td className="py-3 pr-4">{zone.xIndex}</td>
                <td className="py-3 pr-4">{zone.yIndex}</td>
                <td className="py-3 pr-4">{zone.killCount}</td>
                <td className="py-3 pr-0 font-black text-emerald-300">{zone.successScore.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function RiskRewardZoneTable({ zones }: { zones: RiskRewardZone[] }) {
  const visibleZones = zones.slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
            <th className="py-3 pr-4 font-bold">Rank</th>
            <th className="py-3 pr-4 font-bold">X Index</th>
            <th className="py-3 pr-4 font-bold">Y Index</th>
            <th className="py-3 pr-4 font-bold">Kills</th>
            <th className="py-3 pr-4 font-bold">Deaths</th>
            <th className="py-3 pr-4 font-bold">Score</th>
            <th className="py-3 pr-0 font-bold">Balance</th>
          </tr>
        </thead>
        <tbody>
          {visibleZones.length === 0 ? (
            <tr>
              <td className="py-8 text-center text-white/45" colSpan={7}>
                No kill/death balance cells match the current filters
              </td>
            </tr>
          ) : (
            visibleZones.map((zone, index) => (
              <tr key={`${zone.xIndex}-${zone.yIndex}`} className="border-b border-white/5 text-white/75 last:border-0">
                <td className="py-3 pr-4 font-black text-white">{index + 1}</td>
                <td className="py-3 pr-4">{zone.xIndex}</td>
                <td className="py-3 pr-4">{zone.yIndex}</td>
                <td className="py-3 pr-4">{zone.killCount}</td>
                <td className="py-3 pr-4">{zone.deathCount}</td>
                <td className="py-3 pr-4 font-black text-white">{zone.score.toFixed(2)}</td>
                <td className={`py-3 pr-0 font-black ${getRiskRewardClassName(zone.category)}`}>
                  {formatBalanceCategory(zone.category)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function MultiKillZoneTable({ multiKillZones }: { multiKillZones: MultiKillZone[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
            <th className="py-3 pr-4 font-bold">Rank</th>
            <th className="py-3 pr-4 font-bold">X Index</th>
            <th className="py-3 pr-4 font-bold">Y Index</th>
            <th className="py-3 pr-4 font-bold">Multi Kill Count</th>
            <th className="py-3 pr-0 font-bold">Score</th>
          </tr>
        </thead>
        <tbody>
          {multiKillZones.length === 0 ? (
            <tr>
              <td className="py-8 text-center text-white/45" colSpan={5}>
                No multi kill zones match the current filters
              </td>
            </tr>
          ) : (
            multiKillZones.map((zone, index) => (
              <tr key={`${zone.xIndex}-${zone.yIndex}`} className="border-b border-white/5 text-white/75 last:border-0">
                <td className="py-3 pr-4 font-black text-white">{index + 1}</td>
                <td className="py-3 pr-4">{zone.xIndex}</td>
                <td className="py-3 pr-4">{zone.yIndex}</td>
                <td className="py-3 pr-4">{zone.multiKillCount}</td>
                <td className="py-3 pr-0 font-black text-violet-300">{zone.score.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function getRiskRewardClassName(category: RiskRewardZone["category"]) {
  if (category === "reward") {
    return "text-emerald-300";
  }

  if (category === "risk") {
    return "text-valorant-red";
  }

  return "text-white/55";
}

function formatBalanceCategory(category: RiskRewardZone["category"]) {
  if (category === "reward") {
    return "Kill-Lean";
  }

  if (category === "risk") {
    return "Death-Lean";
  }

  return "Neutral";
}

function formatInsightType(type: HeatmapInsight["type"]) {
  if (type === "danger") {
    return "Risk";
  }

  if (type === "success") {
    return "Strong";
  }

  if (type === "risk") {
    return "Death-Lean";
  }

  if (type === "reward") {
    return "Kill-Lean";
  }

  return "Data";
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function getPointColor(eventType: string) {
  if (eventType === "kill") return "#ff4655";
  if (eventType === "death") return "#f59e0b";
  if (eventType === "assist") return "#38bdf8";
  if (eventType === "plant") return "#22c55e";
  if (eventType === "defuse") return "#a78bfa";
  return "#ffffff";
}
