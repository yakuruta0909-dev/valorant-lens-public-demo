import { BarChart3, Medal, ShieldCheck, Swords, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { CompareChart } from "../components/CompareChart";
import { CompareTable } from "../components/CompareTable";
import { CompareTabs } from "../components/CompareTabs";
import { SortSelector } from "../components/SortSelector";
import { getCurrentDataSourceData } from "../dataSources/getCurrentDataSource";
import { buildCompareChartData } from "../lib/buildCompareChartData";
import { buildCompareRows } from "../lib/compareStats";
import { metricDefinitions } from "../lib/metrics";
import { sortCompareRows } from "../lib/sortCompareRows";
import type {
  CompareMetric,
  CompareMode,
  MetricDefinition,
  SortDirection,
  SortKey,
} from "../types";

const compareMetricKeys: CompareMetric[] = ["winRate", "kd", "acs", "hsRate", "performanceIndex"];

const compareMetricDefinitions = metricDefinitions.filter(
  (metric): metric is MetricDefinition & { key: CompareMetric } =>
    compareMetricKeys.includes(metric.key as CompareMetric),
);

const getModeTitle = (mode: CompareMode) => {
  if (mode === "agent") return "Agent Compare";
  if (mode === "map") return "Map Compare";
  return "Agent x Map Compare";
};

const getChartTitle = (mode: CompareMode) => {
  if (mode === "agent") return "Agent Compare Graph";
  if (mode === "map") return "Map Compare Graph";
  return "Agent x Map Top 10";
};

export function ComparePage() {
  const currentData = useMemo(() => getCurrentDataSourceData(), []);
  const [mode, setMode] = useState<CompareMode>("agent");
  const [sortKey, setSortKey] = useState<SortKey>("performanceIndex");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [compareMetric, setCompareMetric] = useState<CompareMetric>("performanceIndex");

  const rows = useMemo(
    () => buildCompareRows(mode, currentData.matches, currentData.playerMatchStats),
    [currentData.matches, currentData.playerMatchStats, mode],
  );
  const sortedRows = useMemo(() => sortCompareRows(rows, sortKey, sortDirection), [rows, sortDirection, sortKey]);
  const chartData = useMemo(
    () => buildCompareChartData(rows, mode, compareMetric),
    [compareMetric, mode, rows],
  );
  const selectedMetric = compareMetricDefinitions.find((metric) => metric.key === compareMetric) ?? compareMetricDefinitions[0];

  const bestRow = chartData[0];
  const averagePi =
    rows.length > 0
      ? Math.round(rows.reduce((total, row) => total + row.performanceIndex, 0) / rows.length)
      : 0;
  const highConfidenceRows = rows.filter((row) => row.confidence === "A" || row.confidence === "B").length;

  const handleTableSort = (nextSortKey: SortKey) => {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("desc");
  };

  return (
    <div className="space-y-5">
      <CompareTabs value={mode} onChange={setMode} />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Swords} label="Rows" value={rows.length} />
        <SummaryCard icon={Medal} label="Average Lens Score" value={averagePi} />
        <SummaryCard icon={ShieldCheck} label="A/B Sample Coverage" value={highConfidenceRows} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-valorant-red" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-black text-white">{getModeTitle(mode)}</h2>
              <p className="mt-1 text-sm text-white/50">Competitive matches only</p>
            </div>
          </div>

          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">
              Metric Selector
            </span>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-semibold text-white outline-none transition focus:border-valorant-red"
              value={compareMetric}
              onChange={(event) => setCompareMetric(event.target.value as CompareMetric)}
            >
              {compareMetricDefinitions.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Current Leader</p>
            <p className="mt-2 text-xl font-black text-white">{bestRow?.label ?? "No Data"}</p>
          </div>
        </section>

        <SortSelector
          direction={sortDirection}
          onDirectionChange={setSortDirection}
          onSortKeyChange={setSortKey}
          sortKey={sortKey}
        />
      </div>

      <CompareChart data={chartData} metric={selectedMetric} title={getChartTitle(mode)} />

      <CompareTable
        mode={mode}
        onSortChange={handleTableSort}
        rows={sortedRows}
        sortDirection={sortDirection}
        sortKey={sortKey}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-white/60">{label}</span>
        <Icon className="h-5 w-5 text-valorant-red" aria-hidden="true" />
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}
