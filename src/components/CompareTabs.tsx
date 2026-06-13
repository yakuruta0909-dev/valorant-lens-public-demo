import type { CompareMode } from "../types";

const compareTabs: Array<{ label: string; value: CompareMode }> = [
  { label: "Agent", value: "agent" },
  { label: "Map", value: "map" },
  { label: "Agent x Map", value: "agentMap" },
];

type CompareTabsProps = {
  onChange: (value: CompareMode) => void;
  value: CompareMode;
};

export function CompareTabs({ onChange, value }: CompareTabsProps) {
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-valorant-panel p-2 shadow-2xl shadow-black/20 sm:grid-cols-3">
      {compareTabs.map((tab) => (
        <button
          key={tab.value}
          className={`h-11 rounded-md border px-4 text-sm font-black transition ${
            value === tab.value
              ? "border-valorant-red bg-valorant-red text-white shadow-glow"
              : "border-transparent bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
          }`}
          type="button"
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
