import type { MetricDefinition, MetricKey } from "../types";

type MetricSelectorProps = {
  metrics: MetricDefinition[];
  onChange: (metrics: MetricKey[]) => void;
  value: MetricKey[];
};

export function MetricSelector({ metrics, onChange, value }: MetricSelectorProps) {
  const toggleMetric = (metricKey: MetricKey) => {
    if (value.includes(metricKey)) {
      const nextMetrics = value.filter((key) => key !== metricKey);
      onChange(nextMetrics.length > 0 ? nextMetrics : value);
      return;
    }

    onChange([...value, metricKey]);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const active = value.includes(metric.key);

        return (
          <label
            key={metric.key}
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${
              active
                ? "border-white/20 bg-white/[0.06] text-white"
                : "border-white/10 bg-black/10 text-white/60 hover:border-white/20"
            }`}
          >
            <input
              checked={active}
              className="h-4 w-4 accent-valorant-red"
              type="checkbox"
              onChange={() => toggleMetric(metric.key)}
            />
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: metric.color }} />
            <span className="min-w-0 flex-1 leading-snug">{metric.label}</span>
          </label>
        );
      })}
    </div>
  );
}
