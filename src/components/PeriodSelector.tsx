import type { PeriodType } from "../types";
import { FilterGroup } from "./FilterGroup";

const periodOptions: Array<{ label: string; value: PeriodType }> = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

type PeriodSelectorProps = {
  onChange: (value: PeriodType) => void;
  value: PeriodType;
};

export function PeriodSelector({ onChange, value }: PeriodSelectorProps) {
  return (
    <FilterGroup title="Period">
      <div className="grid grid-cols-3 gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            className={`h-10 rounded-md border text-sm font-semibold transition ${
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
