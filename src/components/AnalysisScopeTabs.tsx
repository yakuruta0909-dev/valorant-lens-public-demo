import type { AnalysisScope } from "../types";
import { FilterGroup } from "./FilterGroup";

const scopeOptions: Array<{ label: string; value: AnalysisScope }> = [
  { label: "Overall", value: "overall" },
  { label: "Agent", value: "agent" },
  { label: "Map", value: "map" },
  { label: "Agent x Map", value: "agentMap" },
];

type AnalysisScopeTabsProps = {
  onChange: (value: AnalysisScope) => void;
  value: AnalysisScope;
};

export function AnalysisScopeTabs({ onChange, value }: AnalysisScopeTabsProps) {
  return (
    <FilterGroup title="Scope">
      <div className="grid grid-cols-2 gap-2">
        {scopeOptions.map((option) => (
          <button
            key={option.value}
            className={`h-10 rounded-md border px-2 text-sm font-semibold transition ${
              value === option.value
                ? "border-valorant-red bg-valorant-red text-white"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"
            }`}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </FilterGroup>
  );
}
