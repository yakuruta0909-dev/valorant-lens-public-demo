import { Activity, BarChart3, Crosshair, Dumbbell, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { CorrelationCard } from "../components/CorrelationCard";
import { InsightCard } from "../components/InsightCard";
import { PeriodSelector } from "../components/PeriodSelector";
import { PracticeChart } from "../components/PracticeChart";
import { PracticeSummaryCard } from "../components/PracticeSummaryCard";
import { PracticeWeaponChart } from "../components/PracticeWeaponChart";
import { getCurrentDataSourceData } from "../dataSources/getCurrentDataSource";
import { buildPracticeInsights } from "../lib/buildPracticeInsights";
import {
  buildPracticeCorrelations,
  buildPracticePeriodStats,
  buildPracticeSummary,
} from "../lib/buildPracticeStats";
import {
  WEAPON_FILTER_OPTIONS,
  buildPracticeWeaponCorrelation,
  buildPracticeWeaponStats,
  type WeaponTrendKey,
} from "../lib/buildWeaponStats";
import { loadSettings } from "../lib/settingsStorage";
import type { PeriodType, PracticeMetricKey } from "../types";

const comparisonCharts: Array<{ key: PracticeMetricKey; label: string; title: string }> = [
  { key: "performanceIndex", label: "Lens Score", title: "Practice vs Lens Score" },
  { key: "acs", label: "ACS", title: "Practice vs ACS" },
  { key: "kd", label: "KD", title: "Practice vs KD" },
  { key: "hsRate", label: "HS Rate", title: "Practice vs HS Rate" },
];
const practiceWeaponOptions = WEAPON_FILTER_OPTIONS.filter(
  (weapon): weapon is Exclude<WeaponTrendKey, "Overall"> => weapon !== "Overall",
);

export function PracticeAnalysisPage() {
  const currentData = useMemo(() => getCurrentDataSourceData(), []);
  const initialSettings = useMemo(() => loadSettings(), []);
  const [periodType, setPeriodType] = useState<PeriodType>(initialSettings.defaultPeriod);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponTrendKey>("Vandal");
  const periodStats = useMemo(
    () => buildPracticePeriodStats(periodType, currentData.matches, currentData.playerMatchStats),
    [currentData.matches, currentData.playerMatchStats, periodType],
  );
  const summary = useMemo(() => buildPracticeSummary(periodStats), [periodStats]);
  const correlations = useMemo(() => buildPracticeCorrelations(periodStats), [periodStats]);
  const weaponPracticeStats = useMemo(
    () =>
      buildPracticeWeaponStats(
        periodType,
        currentData.matches,
        currentData.playerMatchStats,
        currentData.weaponStats,
        selectedWeapon,
      ),
    [currentData.matches, currentData.playerMatchStats, currentData.weaponStats, periodType, selectedWeapon],
  );
  const weaponCorrelation = useMemo(
    () => buildPracticeWeaponCorrelation(weaponPracticeStats, selectedWeapon),
    [selectedWeapon, weaponPracticeStats],
  );
  const insights = useMemo(() => buildPracticeInsights(correlations), [correlations]);

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-6 flex items-center gap-3">
            <Dumbbell className="h-5 w-5 text-valorant-red" aria-hidden="true" />
            <h2 className="text-base font-bold text-white">Practice Filters</h2>
          </div>
          <PeriodSelector onChange={setPeriodType} value={periodType} />
        </section>

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Weapon HS Target</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">Practice metric relationship</p>
          </div>
          <div className="grid gap-2">
            {practiceWeaponOptions.map((weapon) => {
              const active = selectedWeapon === weapon;

              return (
                <button
                  key={weapon}
                  className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm font-bold transition ${
                    active
                      ? "border-valorant-red/60 bg-valorant-red/10 text-white shadow-glow"
                      : "border-white/10 bg-black/10 text-white/60 hover:border-white/20"
                  }`}
                  type="button"
                  onClick={() => setSelectedWeapon(weapon)}
                >
                  {weapon}
                </button>
              );
            })}
          </div>
        </section>

        <InsightCard insights={insights} />
      </aside>

      <section className="min-w-0 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
          <PracticeSummaryCard icon={Crosshair} label="Solo Practice" value={summary.totalDeathmatch} />
          <PracticeSummaryCard icon={Dumbbell} label="Team Practice" value={summary.totalTeamDeathmatch} />
          <PracticeSummaryCard icon={Activity} label="Total Practice" value={summary.totalPractice} />
          <PracticeSummaryCard icon={BarChart3} label="Average Lens Score" value={summary.averagePerformanceIndex} />
          <PracticeSummaryCard icon={Target} label="Average HS Rate" suffix="%" value={summary.averageHsRate} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
          {correlations.map((correlation) => (
            <CorrelationCard
              key={correlation.key}
              grade={correlation.grade}
              label={correlation.label}
              value={correlation.value}
            />
          ))}
          <CorrelationCard
            grade={weaponCorrelation.grade}
            label={weaponCorrelation.label}
            value={weaponCorrelation.value}
          />
        </div>

        <PracticeChart data={periodStats} mode="trend" title="Practice Trend" />

        <div className="grid gap-5 2xl:grid-cols-2">
          {comparisonCharts.map((chart) => (
            <PracticeChart
              key={chart.key}
              data={periodStats}
              metricKey={chart.key}
              metricLabel={chart.label}
              mode="comparison"
              title={chart.title}
            />
          ))}
        </div>

        <PracticeWeaponChart
          data={weaponPracticeStats}
          weapon={selectedWeapon}
          weaponStatsAvailable={currentData.weaponStats.length > 0}
        />
      </section>
    </div>
  );
}
