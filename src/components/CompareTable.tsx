import { ArrowDown, ArrowUp } from "lucide-react";
import type {
  CompareMode,
  CompareRow,
  MatchDifficulty,
  PerformanceGrade,
  SortDirection,
  SortKey,
} from "../types";

type CompareTableProps = {
  mode: CompareMode;
  onSortChange: (key: SortKey) => void;
  rows: CompareRow[];
  sortDirection: SortDirection;
  sortKey: SortKey;
};

const metricColumns: Array<{ key: SortKey; label: string }> = [
  { key: "matches", label: "Matches" },
  { key: "winRate", label: "WR" },
  { key: "kd", label: "KD" },
  { key: "acs", label: "ACS" },
  { key: "hsRate", label: "HS%" },
  { key: "performanceIndex", label: "Lens Score" },
];

const confidenceClasses = {
  A: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  B: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  C: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  D: "border-white/20 bg-white/[0.05] text-white/70",
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

const formatRate = (value: number) => `${value.toFixed(1)}%`;

const renderSortIcon = (active: boolean, direction: SortDirection) => {
  if (!active) return null;
  const Icon = direction === "desc" ? ArrowDown : ArrowUp;
  return <Icon className="h-3.5 w-3.5 text-valorant-red" aria-hidden="true" />;
};

export function CompareTable({ mode, onSortChange, rows, sortDirection, sortKey }: CompareTableProps) {
  const showAgent = mode === "agent" || mode === "agentMap";
  const showMap = mode === "map" || mode === "agentMap";

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Compare Table</h2>
          <p className="mt-1 text-sm text-white/50">{rows.length} rows</p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">Click headers to sort</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
              {showAgent && <th className="py-3 pr-4 font-bold">Agent</th>}
              {showMap && <th className="py-3 pr-4 font-bold">Map</th>}
              {metricColumns.map((column) => (
                <th key={column.key} className="py-3 pr-4 font-bold">
                  <button
                    className="inline-flex items-center gap-1.5 text-left transition hover:text-white"
                    type="button"
                    onClick={() => onSortChange(column.key)}
                  >
                    {column.label}
                    {renderSortIcon(sortKey === column.key, sortDirection)}
                  </button>
                </th>
              ))}
              <th className="py-3 pr-4 font-bold">Grade</th>
              <th className="py-3 pr-4 font-bold">Difficulty</th>
              <th className="py-3 pr-0 font-bold">Sample Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 text-white/75 last:border-0">
                {showAgent && <td className="py-3 pr-4 font-bold text-white">{row.agent}</td>}
                {showMap && <td className="py-3 pr-4 font-bold text-white">{row.map}</td>}
                <td className="py-3 pr-4">{row.matches}</td>
                <td className="py-3 pr-4">{formatRate(row.winRate)}</td>
                <td className="py-3 pr-4">{row.kd.toFixed(2)}</td>
                <td className="py-3 pr-4">{Math.round(row.acs)}</td>
                <td className="py-3 pr-4">{formatRate(row.hsRate)}</td>
                <td className="py-3 pr-4 font-bold text-valorant-red">{row.performanceIndex}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded border px-2 text-xs font-black ${gradeClasses[row.performanceGrade]}`}
                  >
                    {row.performanceGrade}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex h-7 items-center rounded border px-2 text-xs font-black ${difficultyClasses[row.matchDifficulty]}`}
                  >
                    {row.matchDifficulty}
                  </span>
                </td>
                <td className="py-3 pr-0">
                  <span
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded border px-2 text-xs font-black ${confidenceClasses[row.confidence]}`}
                  >
                    {row.confidence}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
