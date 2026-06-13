import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeaponComparisonRow } from "../lib/buildWeaponStats";

type WeaponRankingChartProps = {
  rows: WeaponComparisonRow[];
};

export function WeaponRankingChart({ rows }: WeaponRankingChartProps) {
  const chartData = rows
    .filter((row) => row.shots > 0)
    .sort((a, b) => b.hsRate - a.hsRate)
    .map((row) => ({
      weapon: row.weapon,
      hsRate: row.hsRate,
      kills: row.kills,
    }));

  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-5">
        <h2 className="text-lg font-black text-white">Weapon HS Rate Ranking</h2>
        <p className="mt-1 text-sm font-semibold text-white/50">Higher is better, kills shown in tooltip</p>
      </div>

      <div className="h-[320px] min-h-[320px]">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 18, bottom: 6, left: 16 }}>
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              type="number"
            />
            <YAxis
              dataKey="weapon"
              stroke="rgba(255,255,255,0.45)"
              tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 12 }}
              tickLine={false}
              type="category"
              width={74}
            />
            <Tooltip
              contentStyle={{
                background: "#10131a",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 8,
                color: "#ffffff",
              }}
              cursor={{ fill: "rgba(255, 70, 85, 0.1)" }}
              formatter={(value, name, props) => {
                if (name === "HS Rate") {
                  return [`${Number(value).toFixed(1)}%`, `HS Rate (${props.payload.kills} kills)`];
                }

                return [value, name];
              }}
            />
            <Bar dataKey="hsRate" fill="#ff4655" name="HS Rate" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
