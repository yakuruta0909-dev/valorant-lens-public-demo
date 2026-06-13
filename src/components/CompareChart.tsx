import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompareChartDatum } from "../lib/buildCompareChartData";
import type { CompareMetric, MetricDefinition } from "../types";

type CompareChartProps = {
  data: CompareChartDatum[];
  metric: MetricDefinition & { key: CompareMetric };
  title: string;
};

const formatValue = (metric: MetricDefinition, value: number) => {
  if (metric.valueType === "rate") return `${value.toFixed(1)}%`;
  if (metric.valueType === "ratio") return value.toFixed(2);
  return `${Math.round(value)}`;
};

export function CompareChart({ data, metric, title }: CompareChartProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="mt-1 text-sm text-white/50">{metric.label}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/40">
          Top {data.length}
        </div>
      </div>

      <div className="h-[380px] min-h-[380px]">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              tickLine={false}
              type="number"
            />
            <YAxis
              dataKey="label"
              interval={0}
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 12 }}
              tickLine={false}
              type="category"
              width={120}
            />
            <Tooltip
              contentStyle={{
                background: "#10131a",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 8,
                color: "#ffffff",
              }}
              cursor={{ fill: "rgba(255, 70, 85, 0.1)" }}
              formatter={(value) => [formatValue(metric, Number(value)), metric.label]}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="value" fill={metric.color} name={metric.label} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
