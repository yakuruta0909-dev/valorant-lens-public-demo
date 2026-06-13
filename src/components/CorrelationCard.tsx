import type { CorrelationGrade } from "../types";

type CorrelationCardProps = {
  grade: CorrelationGrade;
  label: string;
  value: number;
};

const gradeClasses: Record<CorrelationGrade, string> = {
  Strong: "border-valorant-red/50 bg-valorant-red/10 text-valorant-red shadow-glow",
  Moderate: "border-orange-400/35 bg-orange-400/10 text-orange-200",
  Weak: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  "Very Weak": "border-white/20 bg-white/[0.05] text-white/70",
};

const gradeLabels: Record<CorrelationGrade, string> = {
  Strong: "High",
  Moderate: "Moderate",
  Weak: "Low",
  "Very Weak": "Very Low",
};

export function CorrelationCard({ grade, label, value }: CorrelationCardProps) {
  return (
    <article className={`rounded-lg border p-5 shadow-2xl shadow-black/20 ${gradeClasses[grade]}`}>
      <p className="text-sm font-bold text-white/70">{label}</p>
      <p className="mt-4 text-3xl font-black text-white">
        {value >= 0 ? "+" : ""}
        {value.toFixed(2)}
      </p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em]">{gradeLabels[grade]}</p>
    </article>
  );
}
