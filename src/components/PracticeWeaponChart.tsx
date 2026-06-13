import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeaponPracticeRow, WeaponTrendKey } from "../lib/buildWeaponStats";

type PracticeWeaponChartProps = {
  data: WeaponPracticeRow[];
  weapon: WeaponTrendKey;
  weaponStatsAvailable: boolean;
};

export function PracticeWeaponChart({ data, weapon, weaponStatsAvailable }: PracticeWeaponChartProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-5">
        <h2 className="text-lg font-black text-white">Practice vs Weapon HS</h2>
        <p className="mt-1 text-sm font-semibold text-white/50">Practice Total + {weapon} HS Rate</p>
        {!weaponStatsAvailable && (
          <p className="mt-2 text-xs font-semibold text-amber-200/80">
            CSV weapon breakdown is not available yet.
          </p>
        )}
      </div>

      <div className="h-[320px] min-h-[320px]">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ top: 14, right: 12, bottom: 8, left: 0 }}>
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
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              width={48}
              yAxisId="weapon"
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
                if (name === `${weapon} HS Rate`) {
                  return [`${Number(value).toFixed(1)}%`, String(name)];
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
              dataKey="weaponHsRate"
              dot={{ r: 3, strokeWidth: 0 }}
              name={`${weapon} HS Rate`}
              stroke="#e879f9"
              strokeWidth={2.5}
              type="monotone"
              yAxisId="weapon"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
