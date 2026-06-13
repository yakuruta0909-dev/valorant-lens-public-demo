import type { MetricDefinition, MetricKey } from "../types";
import { FilterGroup } from "./FilterGroup";

type MetricCheckboxesProps = {
  metrics: MetricDefinition[];
  onToggle: (metricKey: MetricKey) => void;
  selectedMetricKeys: MetricKey[];
};

export function MetricCheckboxes({ metrics, onToggle, selectedMetricKeys }: MetricCheckboxesProps) {
  return (
    <FilterGroup title="Metrics">
      <div className="grid gap-2">
        {metrics.map((metric) => {
          const active = selectedMetricKeys.includes(metric.key);

          return (
            <label
              key={metric.key}
              className={`flex min-h-10 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${
                active
                  ? "border-white/20 bg-white/[0.06] text-white"
                  : "border-white/10 bg-black/10 text-white/60 hover:border-white/20"
              }`}
            >
              <input
                checked={active}
                className="h-4 w-4 accent-valorant-red"
                type="checkbox"
                onChange={() => onToggle(metric.key)}
              />
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: metric.color }} />
              <span className="min-w-0 flex-1 leading-snug">{metric.label}</span>
            </label>
          );
        })}
      </div>
    </FilterGroup>
  );
}
