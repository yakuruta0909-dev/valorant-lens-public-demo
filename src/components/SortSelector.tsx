import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import type { SortDirection, SortKey } from "../types";

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: "Matches", value: "matches" },
  { label: "Win Rate", value: "winRate" },
  { label: "KD", value: "kd" },
  { label: "ACS", value: "acs" },
  { label: "HS Rate", value: "hsRate" },
  { label: "Lens Score", value: "performanceIndex" },
];

type SortSelectorProps = {
  direction: SortDirection;
  onDirectionChange: (value: SortDirection) => void;
  onSortKeyChange: (value: SortKey) => void;
  sortKey: SortKey;
};

export function SortSelector({
  direction,
  onDirectionChange,
  onSortKeyChange,
  sortKey,
}: SortSelectorProps) {
  const DirectionIcon = direction === "desc" ? ArrowDownWideNarrow : ArrowUpNarrowWide;

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-valorant-panel p-4 shadow-2xl shadow-black/20 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <label>
        <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Sort By</span>
        <select
          className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-semibold text-white outline-none transition focus:border-valorant-red"
          value={sortKey}
          onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 transition hover:border-valorant-red/60 hover:text-white"
        type="button"
        onClick={() => onDirectionChange(direction === "desc" ? "asc" : "desc")}
      >
        <DirectionIcon className="h-4 w-4 text-valorant-red" aria-hidden="true" />
        {direction.toUpperCase()}
      </button>
    </div>
  );
}
