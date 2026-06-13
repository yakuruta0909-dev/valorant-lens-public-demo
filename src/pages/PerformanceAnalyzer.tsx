import {
  Award,
  Crosshair,
  Gauge,
  LineChart as LineChartIcon,
  Map as MapIcon,
  Shield,
  Swords,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AgentSelector } from "../components/AgentSelector";
import { AnalysisScopeTabs } from "../components/AnalysisScopeTabs";
import { ChartCard } from "../components/ChartCard";
import { MapSelector } from "../components/MapSelector";
import { MetricCheckboxes } from "../components/MetricCheckboxes";
import { PeriodSelector } from "../components/PeriodSelector";
import { StatCard } from "../components/StatCard";
import {
  WeaponComparisonTable,
  type WeaponSortKey,
} from "../components/WeaponComparisonTable";
import { WeaponFilter, getWeaponColor } from "../components/WeaponFilter";
import { WeaponRankingChart } from "../components/WeaponRankingChart";
import { AGENTS, MAPS } from "../data/dummyMatches";
import { getCurrentDataSourceData } from "../dataSources/getCurrentDataSource";
import { aggregatePeriodStats, getLatestMetricValue } from "../lib/aggregateStats";
import {
  WEAPON_FILTER_OPTIONS,
  buildWeaponComparisonRows,
  buildWeaponPeriodStats,
  type WeaponTrendKey,
  type WeaponTrendRow,
} from "../lib/buildWeaponStats";
import { calculateImprovementTrend } from "../lib/calculateImprovementTrend";
import { calculateMatchDifficulty } from "../lib/calculateMatchDifficulty";
import { calculatePerformanceGrade } from "../lib/calculatePerformanceGrade";
import { defaultMetricKeys, metricDefinitions } from "../lib/metrics";
import { loadSettings } from "../lib/settingsStorage";
import type { AnalysisScope, MatchDifficulty, MetricDefinition, MetricKey, PerformanceGrade, PeriodType, SortDirection } from "../types";

const getScopeLabel = (scope: AnalysisScope, agent: string, map: string) => {
  if (scope === "agent") return agent;
  if (scope === "map") return map;
  if (scope === "agentMap") return `${agent} on ${map}`;
  return "Overall";
};

const gradeClasses: Record<PerformanceGrade, string> = {
  S: "border-valorant-red/40 bg-valorant-red/10 text-valorant-red",
  A: "border-orange-400/35 bg-orange-400/10 text-orange-200",
  B: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  C: "border-white/20 bg-white/[0.06] text-white/75",
  D: "border-white/10 bg-black/20 text-white/45",
};

const difficultyClasses: Record<MatchDifficulty, string> = {
  Easy: "border-white/20 bg-white/[0.05] text-white/70",
  Normal: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  Hard: "border-orange-400/35 bg-orange-400/10 text-orange-200",
  "Very Hard": "border-valorant-red/40 bg-valorant-red/10 text-valorant-red",
};

export function PerformanceAnalyzer() {
  const currentData = useMemo(() => getCurrentDataSourceData(), []);
  const availableAgents = useMemo(() => {
    const agents = Array.from(new Set(currentData.playerMatchStats.map((stats) => stats.agent))).sort();
    return agents.length > 0 ? agents : AGENTS;
  }, [currentData.playerMatchStats]);
  const availableMaps = useMemo(() => {
    const maps = Array.from(new Set(currentData.matches.map((match) => match.map))).sort();
    return maps.length > 0 ? maps : MAPS;
  }, [currentData.matches]);
  const initialSettings = useMemo(() => loadSettings(), []);
  const [periodType, setPeriodType] = useState<PeriodType>(initialSettings.defaultPeriod);
  const [scope, setScope] = useState<AnalysisScope>("overall");
  const [selectedAgent, setSelectedAgent] = useState(availableAgents[0]);
  const [selectedMap, setSelectedMap] = useState(availableMaps[0]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
    ...(initialSettings.defaultMetrics.length > 0 ? initialSettings.defaultMetrics : defaultMetricKeys),
  ]);
  const [selectedWeapons, setSelectedWeapons] = useState<WeaponTrendKey[]>(["Overall", "Vandal", "Phantom"]);
  const [weaponSortKey, setWeaponSortKey] = useState<WeaponSortKey>("hsRate");
  const [weaponSortDirection, setWeaponSortDirection] = useState<SortDirection>("desc");

  const periodStats = useMemo(
    () =>
      aggregatePeriodStats(currentData.matches, currentData.playerMatchStats, {
        periodType,
        scope,
        agent: selectedAgent,
        map: selectedMap,
      }),
    [currentData.matches, currentData.playerMatchStats, periodType, scope, selectedAgent, selectedMap],
  );

  const selectedMetricDefinitions = metricDefinitions.filter((metric) => selectedMetrics.includes(metric.key));
  const hsRateSelected = selectedMetrics.includes("hsRate");
  const weaponPeriodStats = useMemo(
    () =>
      buildWeaponPeriodStats(currentData.matches, currentData.playerMatchStats, currentData.weaponStats, {
        periodType,
        scope,
        agent: selectedAgent,
        map: selectedMap,
      }),
    [
      currentData.matches,
      currentData.playerMatchStats,
      currentData.weaponStats,
      periodType,
      scope,
      selectedAgent,
      selectedMap,
    ],
  );
  const weaponComparisonRows = useMemo(
    () =>
      buildWeaponComparisonRows(currentData.matches, currentData.playerMatchStats, currentData.weaponStats, {
        scope,
        agent: selectedAgent,
        map: selectedMap,
      }),
    [currentData.matches, currentData.playerMatchStats, currentData.weaponStats, scope, selectedAgent, selectedMap],
  );
  const sortedWeaponRows = useMemo(() => {
    return [...weaponComparisonRows].sort((a, b) => {
      const direction = weaponSortDirection === "asc" ? 1 : -1;

      if (weaponSortKey === "weapon") {
        return a.weapon.localeCompare(b.weapon) * direction;
      }

      return (a[weaponSortKey] - b[weaponSortKey]) * direction;
    });
  }, [weaponComparisonRows, weaponSortDirection, weaponSortKey]);

  const totals = useMemo(() => {
    return periodStats.reduce(
      (acc, period) => ({
        rankMatches: acc.rankMatches + period.rankMatches,
        practiceMatches: acc.practiceMatches + period.practiceMatches,
        deathmatchCount: acc.deathmatchCount + period.deathmatchCount,
        teamDeathmatchCount: acc.teamDeathmatchCount + period.teamDeathmatchCount,
      }),
      {
        rankMatches: 0,
        practiceMatches: 0,
        deathmatchCount: 0,
        teamDeathmatchCount: 0,
      },
    );
  }, [periodStats]);

  const latestPerformanceIndex = getLatestMetricValue(periodStats, "performanceIndex");
  const latestMatchStrength = getLatestMetricValue(periodStats, "matchStrength");
  const latestKd = getLatestMetricValue(periodStats, "kd");
  const performanceSummary = useMemo(() => {
    const rankedPeriods = periodStats.filter((period) => period.rankMatches > 0);
    const totalRankMatches = rankedPeriods.reduce((total, period) => total + period.rankMatches, 0);
    const averagePI =
      totalRankMatches > 0
        ? Math.round(
            rankedPeriods.reduce(
              (total, period) => total + period.performanceIndex * period.rankMatches,
              0,
            ) / totalRankMatches,
          )
        : 0;
    const bestPI =
      rankedPeriods.length > 0
        ? Math.max(...rankedPeriods.map((period) => period.performanceIndex))
        : 0;
    const averageMatchStrength =
      totalRankMatches > 0
        ? Math.round(
            rankedPeriods.reduce((total, period) => total + period.matchStrength * period.rankMatches, 0) /
              totalRankMatches,
          )
        : 0;

    return {
      averagePI,
      bestPI,
      averageDifficulty: calculateMatchDifficulty(averageMatchStrength),
      performanceGrade: calculatePerformanceGrade(averagePI),
    };
  }, [periodStats]);
  const improvementTrend = useMemo(
    () =>
      calculateImprovementTrend({
        matches: currentData.matches,
        playerMatchStats: currentData.playerMatchStats,
        scope,
        agent: selectedAgent,
        map: selectedMap,
      }),
    [currentData.matches, currentData.playerMatchStats, scope, selectedAgent, selectedMap],
  );
  const trendStatusLabel = improvementTrend.status === "Improving" ? "Positive Delta" : "Negative Delta";

  const toggleMetric = (metricKey: MetricKey) => {
    setSelectedMetrics((current) => {
      if (current.includes(metricKey)) {
        return current.filter((key) => key !== metricKey);
      }

      return [...current, metricKey];
    });
  };

  const handleWeaponSortChange = (sortKey: WeaponSortKey) => {
    if (sortKey === weaponSortKey) {
      setWeaponSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setWeaponSortKey(sortKey);
    setWeaponSortDirection(sortKey === "weapon" ? "asc" : "desc");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-6 flex items-center gap-3">
          <Gauge className="h-5 w-5 text-valorant-red" aria-hidden="true" />
          <h2 className="text-base font-bold text-white">Filters</h2>
        </div>

        <PeriodSelector onChange={setPeriodType} value={periodType} />
        <MetricCheckboxes
          metrics={metricDefinitions}
          onToggle={toggleMetric}
          selectedMetricKeys={selectedMetrics}
        />
        {hsRateSelected && (
          <WeaponFilter
            onChange={setSelectedWeapons}
            options={WEAPON_FILTER_OPTIONS}
            selectedWeapons={selectedWeapons}
          />
        )}
        <AnalysisScopeTabs onChange={setScope} value={scope} />

        {(scope === "agent" || scope === "agentMap") && (
          <AgentSelector agents={availableAgents} value={selectedAgent} onChange={setSelectedAgent} />
        )}

        {(scope === "map" || scope === "agentMap") && (
          <MapSelector maps={availableMaps} value={selectedMap} onChange={setSelectedMap} />
        )}
      </section>

      <section className="min-w-0 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <StatCard icon={LineChartIcon} label="Lens Score" value={Math.round(latestPerformanceIndex)} />
          <StatCard icon={Swords} label="Rank Matches" value={totals.rankMatches} />
          <StatCard icon={Crosshair} label="Practice Total" value={totals.practiceMatches} />
          <StatCard icon={MapIcon} label="Match Strength" value={Math.round(latestMatchStrength)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
          <PerformanceSummaryCard icon={LineChartIcon} label="Average Lens Score" value={performanceSummary.averagePI} />
          <PerformanceSummaryCard icon={Award} label="Best Lens Score" value={performanceSummary.bestPI} />
          <PerformanceSummaryCard
            icon={Shield}
            label="Average Difficulty"
            value={performanceSummary.averageDifficulty}
            valueClassName={difficultyClasses[performanceSummary.averageDifficulty]}
          />
          <PerformanceSummaryCard
            icon={Award}
            label="Lens Score Band"
            value={performanceSummary.performanceGrade}
            valueClassName={gradeClasses[performanceSummary.performanceGrade]}
          />
          <PerformanceSummaryCard
            icon={improvementTrend.status === "Improving" ? TrendingUp : TrendingDown}
            label="Lens Score Delta"
            subValue={trendStatusLabel}
            value={`Lens Score ${improvementTrend.delta >= 0 ? "+" : ""}${improvementTrend.delta.toFixed(1)}`}
            valueClassName={
              improvementTrend.status === "Improving"
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
                : "border-valorant-red/40 bg-valorant-red/10 text-valorant-red"
            }
          />
        </div>

        <div className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Selected Trends</h2>
              <p className="mt-1 text-sm text-white/60">{getScopeLabel(scope, selectedAgent, selectedMap)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedMetricDefinitions.map((metric) => (
                <span
                  key={metric.key}
                  className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/70"
                >
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: metric.color }} />
                  {metric.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {selectedMetricDefinitions.length > 0 ? (
          <div className="grid min-w-0 gap-5 2xl:grid-cols-2">
            {selectedMetricDefinitions.map((metric) => (
              metric.key === "hsRate" ? (
                <WeaponHsTrendCard
                  key={metric.key}
                  data={weaponPeriodStats}
                  metric={metric}
                  selectedWeapons={selectedWeapons}
                  weaponStatsAvailable={currentData.weaponStats.length > 0}
                />
              ) : (
                <ChartCard key={metric.key} data={periodStats} metric={metric} />
              )
            ))}
          </div>
        ) : (
          <div className="grid h-72 place-items-center rounded-lg border border-dashed border-white/10 bg-valorant-panel text-sm font-semibold text-white/50">
            No metrics selected
          </div>
        )}

        {hsRateSelected && (
          <div className="grid min-w-0 gap-5 2xl:grid-cols-2">
            <WeaponComparisonTable
              onSortChange={handleWeaponSortChange}
              rows={sortedWeaponRows}
              sortDirection={weaponSortDirection}
              sortKey={weaponSortKey}
            />
            <WeaponRankingChart rows={weaponComparisonRows} />
          </div>
        )}

        <div className="min-w-0 rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Period Stats</h2>
            <p className="text-sm font-semibold text-white/50">KD {latestKd.toFixed(2)}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
                  <th className="py-3 pr-4 font-bold">Period</th>
                  <th className="py-3 pr-4 font-bold">Rank</th>
                  <th className="py-3 pr-4 font-bold">Win</th>
                  <th className="py-3 pr-4 font-bold">KD</th>
                  <th className="py-3 pr-4 font-bold">ACS</th>
                  <th className="py-3 pr-4 font-bold">HS</th>
                  <th className="py-3 pr-4 font-bold">Practice</th>
                  <th className="py-3 pr-4 font-bold">Strength</th>
                  <th className="py-3 pr-4 font-bold">Difficulty</th>
                  <th className="py-3 pr-4 font-bold">Lens Score</th>
                  <th className="py-3 pr-0 font-bold">Grade</th>
                </tr>
              </thead>
              <tbody>
                {periodStats.map((period) => (
                  <tr key={period.periodKey} className="border-b border-white/5 text-white/75 last:border-0">
                    <td className="py-3 pr-4 font-bold text-white">{period.periodKey}</td>
                    <td className="py-3 pr-4">{period.rankMatches}</td>
                    <td className="py-3 pr-4">{period.winRate.toFixed(1)}%</td>
                    <td className="py-3 pr-4">{period.kd.toFixed(2)}</td>
                    <td className="py-3 pr-4">{Math.round(period.acs)}</td>
                    <td className="py-3 pr-4">{period.hsRate.toFixed(1)}%</td>
                    <td className="py-3 pr-4">{period.practiceMatches}</td>
                    <td className="py-3 pr-4">{Math.round(period.matchStrength)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex h-7 items-center rounded border px-2 text-xs font-black ${difficultyClasses[period.matchDifficulty]}`}
                      >
                        {period.matchDifficulty}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-bold text-valorant-red">{period.performanceIndex}</td>
                    <td className="py-3 pr-0">
                      <span
                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded border px-2 text-xs font-black ${gradeClasses[period.performanceGrade]}`}
                      >
                        {period.performanceGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function WeaponHsTrendCard({
  data,
  metric,
  selectedWeapons,
  weaponStatsAvailable,
}: {
  data: WeaponTrendRow[];
  metric: MetricDefinition;
  selectedWeapons: WeaponTrendKey[];
  weaponStatsAvailable: boolean;
}) {
  const latestPeriod = [...data].reverse().find((period) =>
    selectedWeapons.some((weapon) => period[weapon] > 0),
  );
  const latestOverall = latestPeriod?.Overall ?? 0;

  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">HS Rate Trend</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">Overall + weapon lines</p>
          {!weaponStatsAvailable && (
            <p className="mt-2 text-xs font-semibold text-amber-200/80">
              CSV weapon breakdown is not available yet. Overall remains available.
            </p>
          )}
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Latest</p>
          <p className="text-lg font-black text-white">{latestOverall.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {selectedWeapons.map((weapon) => (
          <span
            key={weapon}
            className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/70"
          >
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: getWeaponColor(weapon) }} />
            {weapon}
          </span>
        ))}
      </div>

      <div className="h-[280px] min-h-[280px]">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ top: 14, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="periodKey"
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: "#10131a",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 8,
                color: "#ffffff",
              }}
              cursor={{ stroke: "rgba(255,70,85,0.45)", strokeWidth: 1 }}
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name)]}
            />
            {selectedWeapons.map((weapon) => (
              <Line
                key={weapon}
                activeDot={{ r: 6, strokeWidth: 0 }}
                dataKey={weapon}
                dot={{ r: 3, strokeWidth: 0 }}
                name={weapon === "Overall" ? metric.label : weapon}
                stroke={getWeaponColor(weapon)}
                strokeWidth={weapon === "Overall" ? 3 : 2.4}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function PerformanceSummaryCard({
  icon: Icon,
  label,
  subValue,
  value,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  subValue?: string;
  value: number | string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-white/60">{label}</span>
        <Icon className="h-5 w-5 text-valorant-red" aria-hidden="true" />
      </div>
      <div
        className={
          valueClassName
            ? `inline-flex min-h-10 items-center rounded-md border px-3 text-2xl font-black ${valueClassName}`
            : "text-3xl font-black text-white"
        }
      >
        {value}
      </div>
      {subValue && <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-white/45">{subValue}</p>}
    </div>
  );
}
