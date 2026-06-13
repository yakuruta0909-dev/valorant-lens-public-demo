import { Lightbulb } from "lucide-react";

type InsightCardProps = {
  insights: string[];
};

export function InsightCard({ insights }: InsightCardProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center gap-3">
        <Lightbulb className="h-5 w-5 text-valorant-red" aria-hidden="true" />
        <h2 className="text-lg font-black text-white">Data Notes</h2>
      </div>
      <div className="grid gap-3">
        {insights.map((insight) => (
          <p key={insight} className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/70">
            {insight}
          </p>
        ))}
      </div>
    </section>
  );
}
