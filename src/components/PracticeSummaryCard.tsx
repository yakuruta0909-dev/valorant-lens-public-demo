import type { LucideIcon } from "lucide-react";

type PracticeSummaryCardProps = {
  icon: LucideIcon;
  label: string;
  suffix?: string;
  value: number | string;
};

export function PracticeSummaryCard({ icon: Icon, label, suffix, value }: PracticeSummaryCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-white/60">{label}</span>
        <Icon className="h-5 w-5 text-valorant-red" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-white">{value}</span>
        {suffix && <span className="text-sm font-bold text-white/45">{suffix}</span>}
      </div>
    </div>
  );
}
