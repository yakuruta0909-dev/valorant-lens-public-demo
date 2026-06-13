import { Activity, BadgeCheck, Database, ShieldAlert, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { PracticeSummaryCard } from "../components/PracticeSummaryCard";
import { getCurrentDataSourceData } from "../dataSources/getCurrentDataSource";
import { buildQualityInsights } from "../lib/buildQualityInsights";
import { loadInvalidDataReport } from "../lib/dataQualityStorage";
import { validateDataSource } from "../lib/validateDataSource";
import { summarizeTimeline } from "../timeline/summarizeTimeline";
import { validateTimeline } from "../timeline/validateTimeline";
import { verifyTimelineData } from "../timeline/verifyTimelineData";

const gradeClasses = {
  A: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  B: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  C: "border-orange-400/35 bg-orange-400/10 text-orange-200",
  D: "border-valorant-red/40 bg-valorant-red/10 text-valorant-red",
  F: "border-valorant-red/60 bg-valorant-red/20 text-valorant-red shadow-glow",
} as const;

export function DataQualityPage() {
  const currentData = useMemo(() => getCurrentDataSourceData(), []);
  const invalidDataReport = useMemo(() => loadInvalidDataReport(), []);
  const qualityReport = useMemo(
    () =>
      validateDataSource({
        invalidDataReport,
        matches: currentData.matches,
        playerMatchStats: currentData.playerMatchStats,
        weaponStats: currentData.weaponStats,
      }),
    [currentData.matches, currentData.playerMatchStats, currentData.weaponStats, invalidDataReport],
  );
  const insights = useMemo(() => buildQualityInsights(qualityReport), [qualityReport]);
  const timelineSummary = useMemo(
    () => summarizeTimeline(currentData.timelineEvents),
    [currentData.timelineEvents],
  );
  const timelineValidation = useMemo(
    () => validateTimeline(currentData.timelineEvents),
    [currentData.timelineEvents],
  );
  const timelineVerification = useMemo(
    () => verifyTimelineData(currentData.timelineEvents),
    [currentData.timelineEvents],
  );
  const timelineHealth =
    timelineVerification.eventCount > 0
      ? Math.round(
          ((timelineVerification.eventCount - timelineVerification.invalidCount) /
            timelineVerification.eventCount) *
            100,
        )
      : 100;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-valorant-red/30 bg-valorant-panel p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <BadgeCheck className="h-6 w-6 text-valorant-red" aria-hidden="true" />
              <h2 className="text-xl font-black text-white">Data Quality Summary</h2>
            </div>
            <p className="text-sm font-semibold text-white/55">
              Shared validation layer for Dummy, CSV, and future Riot data sources.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">Health Score</p>
              <p className="mt-2 text-4xl font-black text-white">{qualityReport.health.score} / 100</p>
            </div>
            <div className={`rounded-lg border p-5 ${gradeClasses[qualityReport.health.grade]}`}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">Health Grade</p>
              <p className="mt-2 text-4xl font-black">{qualityReport.health.grade}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PracticeSummaryCard
          icon={Database}
          label="Duplicate Match IDs"
          value={qualityReport.duplicateReport.duplicateMatchIds.length}
        />
        <PracticeSummaryCard
          icon={ShieldAlert}
          label="Missing Weapon Records"
          value={qualityReport.weaponReport.missingWeaponMatchIds.length}
        />
        <PracticeSummaryCard
          icon={TriangleAlert}
          label="Orphan Weapon Records"
          value={qualityReport.weaponReport.orphanWeaponRecords}
        />
        <PracticeSummaryCard icon={Activity} label="Invalid Rows" value={qualityReport.invalidDataReport.invalidRows} />
      </div>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Timeline Quality</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            Timeline events are validated for future Heatmap and Timeline Viewer features.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <PracticeSummaryCard icon={Activity} label="Timeline Events" value={timelineSummary.totalEvents} />
          <PracticeSummaryCard
            icon={TriangleAlert}
            label="Invalid Timeline Events"
            value={timelineValidation.invalidEvents}
          />
          <PracticeSummaryCard icon={BadgeCheck} label="Timeline Health" suffix="%" value={timelineHealth} />
          <PracticeSummaryCard icon={ShieldAlert} label="Missing Positions" value={timelineVerification.missingPositions} />
          <PracticeSummaryCard icon={Database} label="Duplicate Events" value={timelineVerification.duplicateEvents} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TimelineMiniStat label="Kill Events" value={timelineSummary.killEvents} />
          <TimelineMiniStat label="Death Events" value={timelineSummary.deathEvents} />
          <TimelineMiniStat label="Unique Weapons" value={timelineSummary.uniqueWeapons} />
          <TimelineMiniStat label="Unique Players" value={timelineSummary.uniquePlayers} />
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-2">
        <DetailCard
          emptyText="No duplicate match IDs detected"
          items={qualityReport.duplicateReport.duplicateMatchIds}
          title="Duplicate Match Detection"
        />
        <DetailCard
          emptyText="Every competitive match has at least one weapon record"
          items={qualityReport.weaponReport.missingWeaponMatchIds}
          title="Weapon Record Consistency"
        />
        <DetailCard
          emptyText="No orphan weapon records detected"
          items={qualityReport.weaponReport.orphanWeaponRecordIds}
          title="Orphan Weapon Records"
        />
        <InvalidReportCard
          invalidRows={qualityReport.invalidDataReport.invalidRows}
          negativeValues={
            qualityReport.invalidDataReport.negativeValues + qualityReport.weaponReport.negativeWeaponRecords
          }
          unknownWeapon={
            qualityReport.invalidDataReport.unknownWeapon + qualityReport.weaponReport.unknownWeaponRecords
          }
        />
      </div>

      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Quality Notes</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">Template-based data checks</p>
        </div>
        <div className="grid gap-3">
          {insights.map((insight) => (
            <div key={insight} className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-white/75">
              {insight}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TimelineMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function DetailCard({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: string[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">{title}</h2>
        <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-black text-white/60">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-200">
          {emptyText}
        </p>
      ) : (
        <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
          {items.slice(0, 24).map((item) => (
            <div key={item} className="rounded-md border border-valorant-red/25 bg-valorant-red/10 p-3 text-sm font-bold text-valorant-red">
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InvalidReportCard({
  invalidRows,
  negativeValues,
  unknownWeapon,
}: {
  invalidRows: number;
  negativeValues: number;
  unknownWeapon: number;
}) {
  const rows = [
    ["Invalid Rows", invalidRows],
    ["Negative Values", negativeValues],
    ["Unknown Weapon", unknownWeapon],
  ] as const;

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Invalid Data Report</h2>
        <p className="mt-1 text-sm font-semibold text-white/50">Latest import validation and current records</p>
      </div>

      <div className="grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-4">
            <span className="text-sm font-bold text-white/65">{label}</span>
            <span className="text-xl font-black text-white">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
