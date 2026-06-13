import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeriodStats, PracticeMetricKey } from "../types";

type PracticeChartProps =
  | {
      data: PeriodStats[];
      mode: "trend";
      title: string;
    }
  | {
      data: PeriodStats[];
      metricKey: PracticeMetricKey;
      metricLabel: string;
      mode: "comparison";
      title: string;
    };

const metricColors: Record<PracticeMetricKey, string> = {
  performanceIndex: "#f43f5e",
  acs: "#f59e0b",
  kd: "#60a5fa",
  hsRate: "#e879f9",
};

const formatMetricValue = (key: PracticeMetricKey, value: number) => {
  if (key === "hsRate") return `${value.toFixed(1)}%`;
  if (key === "kd") return value.toFixed(2);
  return `${Math.round(value)}`;
};

export function PracticeChart(props: PracticeChartProps) {
  if (props.mode === "trend") {
    return (
      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <ChartHeader subtitle="Solo / Team / Total" title={props.title} />
        <div className="h-[320px] min-h-[320px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={props.data} margin={{ top: 14, right: 18, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="periodKey"
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
                tickLine={false}
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
              />
              <Bar dataKey="deathmatchCount" fill="#a3e635" name="Solo Practice Count" radius={[4, 4, 0, 0]} />
              <Bar dataKey="teamDeathmatchCount" fill="#38bdf8" name="Team Practice Count" radius={[4, 4, 0, 0]} />
              <Bar dataKey="practiceMatches" fill="#ff4655" name="Practice Total" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <ChartHeader subtitle="Practice Total + Selected Metric" title={props.title} />
      <div className="h-[320px] min-h-[320px]">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={props.data} margin={{ top: 14, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="periodKey"
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              tickLine={false}
              width={46}
              yAxisId="practice"
            />
            <YAxis
              orientation="right"
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              tickLine={false}
              width={48}
              yAxisId="metric"
            />
            <Tooltip
              contentStyle={{
                background: "#10131a",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 8,
                color: "#ffffff",
              }}
              cursor={{ fill: "rgba(255, 70, 85, 0.1)" }}
              formatter={(value, name) => {
                if (name === props.metricLabel) {
                  return [formatMetricValue(props.metricKey, Number(value)), props.metricLabel];
                }

                return [Math.round(Number(value)), String(name)];
              }}
            />
            <Bar
              dataKey="practiceMatches"
              fill="#ff4655"
              name="Practice Total"
              radius={[4, 4, 0, 0]}
              yAxisId="practice"
            />
            <Line
              activeDot={{ r: 6, strokeWidth: 0 }}
              dataKey={props.metricKey}
              dot={{ r: 3, strokeWidth: 0 }}
              name={props.metricLabel}
              stroke={metricColors[props.metricKey]}
              strokeWidth={2.5}
              type="monotone"
              yAxisId="metric"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ChartHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-white/50">{subtitle}</p>
    </div>
  );
}
