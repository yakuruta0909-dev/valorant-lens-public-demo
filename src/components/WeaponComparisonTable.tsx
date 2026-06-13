import { ArrowDown, ArrowUp } from "lucide-react";
import type { WeaponComparisonRow } from "../lib/buildWeaponStats";
import type { SortDirection } from "../types";

export type WeaponSortKey = "weapon" | "hsRate" | "kills";

type WeaponComparisonTableProps = {
  rows: WeaponComparisonRow[];
  sortDirection: SortDirection;
  sortKey: WeaponSortKey;
  onSortChange: (sortKey: WeaponSortKey) => void;
};

const headerLabels: Record<WeaponSortKey, string> = {
  weapon: "Weapon",
  hsRate: "HS%",
  kills: "Kills",
};

export function WeaponComparisonTable({
  rows,
  sortDirection,
  sortKey,
  onSortChange,
}: WeaponComparisonTableProps) {
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Weapon Compare</h2>
        <p className="mt-1 text-sm font-semibold text-white/50">Headshot rate by weapon</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
              {(["weapon", "hsRate", "kills"] as WeaponSortKey[]).map((key) => (
                <th key={key} className="py-3 pr-4 font-bold last:pr-0">
                  <button
                    className="inline-flex items-center gap-1.5 text-left transition hover:text-white/80"
                    type="button"
                    onClick={() => onSortChange(key)}
                  >
                    {headerLabels[key]}
                    {sortKey === key &&
                      (sortDirection === "desc" ? (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.weapon} className="border-b border-white/5 text-white/75 last:border-0">
                <td className="py-3 pr-4 font-bold text-white">{row.weapon}</td>
                <td className="py-3 pr-4 font-bold text-valorant-red">{row.hsRate.toFixed(1)}%</td>
                <td className="py-3 pr-0">{row.kills}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
