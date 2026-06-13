import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMetricValue } from "../lib/formatMetricValue";
import type { MetricDefinition, PeriodStats } from "../types";

type ChartCardProps = {
  data: PeriodStats[];
  metric: MetricDefinition;
};

export function ChartCard({ data, metric }: ChartCardProps) {
  const latest = [...data].reverse().find((period) => period[metric.key] > 0)?.[metric.key] ?? 0;
  const formattedLatest = formatMetricValue(metric, latest);
  const commonAxisProps = {
    tickLine: false,
  };

  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">{metric.label} Trend</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">{metric.chartType === "bar" ? "Volume" : "Performance"}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Latest</p>
          <p className="text-lg font-black text-white">{formattedLatest}</p>
        </div>
      </div>

      <div className="h-[280px] min-h-[280px]">
        <ResponsiveContainer height="100%" width="100%">
          {metric.chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 14, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                {...commonAxisProps}
                dataKey="periodKey"
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              />
              <YAxis
                {...commonAxisProps}
                allowDecimals={false}
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "#10131a",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 8,
                  color: "#ffffff",
                }}
                cursor={{ fill: "rgba(255, 70, 85, 0.1)" }}
                formatter={(value) => [formatMetricValue(metric, Number(value)), metric.label]}
              />
              <Bar dataKey={metric.key} fill={metric.color} name={metric.label} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 14, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                {...commonAxisProps}
                dataKey="periodKey"
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              />
              <YAxis
                {...commonAxisProps}
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
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
                formatter={(value) => [formatMetricValue(metric, Number(value)), metric.label]}
              />
              <Line
                activeDot={{ r: 6, strokeWidth: 0 }}
                dataKey={metric.key}
                dot={{ r: 3, strokeWidth: 0 }}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </article>
  );
}
