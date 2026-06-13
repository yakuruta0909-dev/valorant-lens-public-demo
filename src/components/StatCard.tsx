import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
};

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-white/60">{label}</span>
        <Icon className="h-5 w-5 text-valorant-red" aria-hidden="true" />
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}
