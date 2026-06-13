import { Activity, Crosshair, Download, Map as MapIcon, Search, ShieldCheck, Target, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { PracticeSummaryCard } from "../components/PracticeSummaryCard";
import { getCurrentDataSourceData } from "../dataSources/getCurrentDataSource";
import { loadSettings } from "../lib/settingsStorage";
import { buildCoordinateSummary } from "../maps/buildCoordinateSummary";
import { convertToScreenCoordinate, normalizeCoordinate } from "../maps/coordinateAdapter";
import { getMapMetadata, VALORANT_MAPS } from "../maps/mapMetadata";
import { validateTimelineCoordinates } from "../maps/validateCoordinates";
import { buildTimelineStats } from "../timeline/buildTimelineStats";
import { downloadTimelineCsv } from "../timeline/exportTimelineCsv";
import { filterTimeline, type TimelineFilters } from "../timeline/filterTimeline";
import { summarizeTimeline } from "../timeline/summarizeTimeline";
import { loadTimelineEvents } from "../timeline/timelineStorage";
import type { MatchTimelineEvent, TimelineEventType } from "../timeline/types";
import { verifyTimelineData } from "../timeline/verifyTimelineData";

const eventTypeOptions: Array<{ label: string; value: TimelineEventType }> = [
  { label: "Kill", value: "kill" },
  { label: "Death", value: "death" },
  { label: "Assist", value: "assist" },
  { label: "Plant", value: "plant" },
  { label: "Defuse", value: "defuse" },
];

const weaponOptions = ["All", "Vandal", "Phantom", "Sheriff", "Guardian", "Operator", "Marshal"];
const mapOptions = ["All", ...VALORANT_MAPS];

const sourceLabels = {
  csv: "CSV Data",
  dummy: "Dummy Data",
  riot: "Riot Data",
} as const;

export function TimelineViewerPage() {
  const settings = useMemo(() => loadSettings(), []);
  const currentData = useMemo(() => getCurrentDataSourceData(), []);
  const storedTimelineData = useMemo(() => loadTimelineEvents(), []);
  const timelineEvents =
    currentData.timelineEvents.length > 0 ? currentData.timelineEvents : storedTimelineData.timelineEvents;
  const matchMapById = useMemo(
    () => new Map(currentData.matches.map((match) => [match.matchId, match.map])),
    [currentData.matches],
  );
  const matchOptions = useMemo(
    () => ["All", ...Array.from(new Set(timelineEvents.map((event) => event.matchId).filter(Boolean) as string[])).sort()],
    [timelineEvents],
  );
  const [filters, setFilters] = useState<TimelineFilters>({
    eventTypes: ["kill", "death", "assist", "plant", "defuse"],
    map: "All",
    matchId: "All",
    playerQuery: "",
    searchQuery: "",
    weapon: "All",
  });
  const [selectedEventKey, setSelectedEventKey] = useState<string | undefined>();
  const filteredEvents = useMemo(
    () => filterTimeline(timelineEvents, filters, matchMapById),
    [filters, matchMapById, timelineEvents],
  );
  const summary = useMemo(() => summarizeTimeline(filteredEvents), [filteredEvents]);
  const stats = useMemo(() => buildTimelineStats(filteredEvents), [filteredEvents]);
  const verification = useMemo(() => verifyTimelineData(filteredEvents), [filteredEvents]);
  const coordinateSummary = useMemo(
    () => buildCoordinateSummary(filteredEvents, matchMapById),
    [filteredEvents, matchMapById],
  );
  const coordinateValidation = useMemo(
    () => validateTimelineCoordinates(filteredEvents, matchMapById),
    [filteredEvents, matchMapById],
  );
  const selectedEvent =
    filteredEvents.find((event, index) => buildTimelineEventKey(event, index) === selectedEventKey) ?? filteredEvents[0];

  const toggleEventType = (eventType: TimelineEventType) => {
    setFilters((current) => ({
      ...current,
      eventTypes: current.eventTypes.includes(eventType)
        ? current.eventTypes.filter((value) => value !== eventType)
        : [...current.eventTypes, eventType],
    }));
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <div className="mb-5 flex items-center gap-3">
            <Search className="h-5 w-5 text-valorant-red" aria-hidden="true" />
            <h2 className="text-base font-bold text-white">Timeline Filters</h2>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">Event Type</h3>
              <div className="grid gap-2">
                {eventTypeOptions.map((option) => {
                  const active = filters.eventTypes.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`flex min-h-10 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm font-bold transition ${
                        active
                          ? "border-valorant-red/60 bg-valorant-red/10 text-white"
                          : "border-white/10 bg-black/10 text-white/60 hover:border-white/20"
                      }`}
                    >
                      <input
                        checked={active}
                        className="h-4 w-4 accent-valorant-red"
                        type="checkbox"
                        onChange={() => toggleEventType(option.value)}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <SelectField
              label="Weapon"
              value={filters.weapon}
              options={weaponOptions}
              onChange={(weapon) => setFilters((current) => ({ ...current, weapon }))}
            />

            <SelectField
              label="Map"
              value={filters.map}
              options={mapOptions}
              onChange={(map) => setFilters((current) => ({ ...current, map }))}
            />

            <SelectField
              label="Match ID"
              value={filters.matchId}
              options={matchOptions}
              onChange={(matchId) => setFilters((current) => ({ ...current, matchId }))}
            />

            <TextField
              label="Player Filter"
              placeholder="Player"
              value={filters.playerQuery}
              onChange={(playerQuery) => setFilters((current) => ({ ...current, playerQuery }))}
            />

            <TextField
              label="Timeline Search"
              placeholder="killer / victim / weapon"
              value={filters.searchQuery}
              onChange={(searchQuery) => setFilters((current) => ({ ...current, searchQuery }))}
            />

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-valorant-red/60 bg-valorant-red px-4 text-sm font-black text-white transition hover:bg-valorant-red/80 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-white/35"
              disabled={filteredEvents.length === 0}
              type="button"
              onClick={() => downloadTimelineCsv(filteredEvents, matchMapById)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
          <h2 className="mb-4 text-base font-bold text-white">Timeline Source Info</h2>
          <div className="grid gap-3">
            <InfoRow label="Current Data Source" value={sourceLabels[settings.dataSource]} />
            <InfoRow label="Timeline Records" value={String(timelineEvents.length)} />
            <InfoRow label="Filtered Records" value={String(filteredEvents.length)} />
            <InfoRow label="Valid Coordinates" value={String(coordinateSummary.validCoordinates)} />
            <InfoRow label="Invalid Coordinates" value={String(coordinateSummary.invalidCoordinates)} />
          </div>
        </section>
      </aside>

      <section className="min-w-0 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <PracticeSummaryCard icon={Activity} label="Total Events" value={summary.totalEvents} />
          <PracticeSummaryCard icon={Target} label="Kill Events" value={summary.killEvents} />
          <PracticeSummaryCard icon={TriangleAlert} label="Death Events" value={summary.deathEvents} />
          <PracticeSummaryCard icon={Crosshair} label="Assist Events" value={summary.assistEvents} />
          <PracticeSummaryCard icon={MapIcon} label="Plant Events" value={summary.plantEvents} />
          <PracticeSummaryCard icon={ShieldCheck} label="Defuse Events" value={summary.defuseEvents} />
          <PracticeSummaryCard icon={ShieldCheck} label="Unique Weapons" value={summary.uniqueWeapons} />
          <PracticeSummaryCard icon={Activity} label="Unique Players" value={summary.uniquePlayers} />
        </div>

        <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-5">
          <PercentCard label="Kill %" value={stats.killPercent} />
          <PercentCard label="Death %" value={stats.deathPercent} />
          <PercentCard label="Assist %" value={stats.assistPercent} />
          <PercentCard label="Plant %" value={stats.plantPercent} />
          <PercentCard label="Defuse %" value={stats.defusePercent} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <TimelineEventTable
            events={filteredEvents}
            selectedEventKey={selectedEventKey}
            onSelectEvent={setSelectedEventKey}
          />

          <div className="space-y-5">
            <CoordinatePreview event={selectedEvent} matchMapById={matchMapById} />

            <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
              <div className="mb-4">
                <h2 className="text-lg font-black text-white">Timeline Verification</h2>
                <p className="mt-1 text-sm font-semibold text-white/50">Filtered result quality</p>
              </div>
              <div className="grid gap-3">
                <InfoRow label="Invalid Events" value={String(verification.invalidCount)} />
                <InfoRow label="Missing Positions" value={String(verification.missingPositions)} />
                <InfoRow label="Duplicate Events" value={String(verification.duplicateEvents)} />
                <InfoRow label="Invalid Coordinates" value={String(coordinateSummary.invalidCoordinates)} />
                <InfoRow label="Coordinate Issues" value={String(coordinateValidation.filter((result) => !result.valid).length)} />
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition focus:border-valorant-red/60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-valorant-red/60"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function PercentCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <p className="text-sm font-bold text-white/60">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value.toFixed(1)}%</p>
    </div>
  );
}

function CoordinatePreview({
  event,
  matchMapById,
}: {
  event: MatchTimelineEvent | undefined;
  matchMapById: Map<string, string>;
}) {
  const mapName = event ? matchMapById.get(event.matchId ?? "") : undefined;
  const metadata = getMapMetadata(mapName);

  if (!event || !metadata || !Number.isFinite(event.positionX) || !Number.isFinite(event.positionY)) {
    return (
      <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
        <h2 className="text-lg font-black text-white">Coordinate Preview</h2>
        <p className="mt-3 text-sm font-semibold text-white/50">Select a supported map event to inspect normalized coordinates.</p>
      </section>
    );
  }

  const normalized = normalizeCoordinate({
    metadata,
    worldX: event.positionX,
    worldY: event.positionY,
  });
  const screen = convertToScreenCoordinate({ metadata, normalized });

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Coordinate Preview</h2>
        <p className="mt-1 text-sm font-semibold text-white/50">Numeric preview only</p>
      </div>
      <div className="grid gap-3">
        <InfoRow label="Map" value={metadata.name} />
        <InfoRow label="Normalized X" value={normalized.x.toFixed(2)} />
        <InfoRow label="Normalized Y" value={normalized.y.toFixed(2)} />
        <InfoRow label="Screen X" value={screen.x.toFixed(0)} />
        <InfoRow label="Screen Y" value={screen.y.toFixed(0)} />
      </div>
    </section>
  );
}

const buildTimelineEventKey = (event: MatchTimelineEvent, index: number) =>
  `${event.matchId ?? "unknown"}-${event.timestamp}-${event.eventType}-${index}`;

const formatOptionalValue = (value: string | undefined) => value || "-";

function TimelineEventTable({
  events,
  onSelectEvent,
  selectedEventKey,
}: {
  events: ReturnType<typeof filterTimeline>;
  onSelectEvent: (eventKey: string) => void;
  selectedEventKey: string | undefined;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Timeline Event Table</h2>
        <p className="text-sm font-semibold text-white/50">{events.length} events</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
              <th className="py-3 pr-4 font-bold">Match ID</th>
              <th className="py-3 pr-4 font-bold">Timestamp</th>
              <th className="py-3 pr-4 font-bold">Event Type</th>
              <th className="py-3 pr-4 font-bold">Position X</th>
              <th className="py-3 pr-4 font-bold">Position Y</th>
              <th className="py-3 pr-4 font-bold">Killer</th>
              <th className="py-3 pr-4 font-bold">Victim</th>
              <th className="py-3 pr-0 font-bold">Weapon</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-white/45" colSpan={8}>
                  No timeline events available
                </td>
              </tr>
            ) : (
              events.map((event, index) => {
                const eventKey = buildTimelineEventKey(event, index);
                const selected = selectedEventKey === eventKey || (!selectedEventKey && index === 0);

                return (
                <tr
                  key={eventKey}
                  className={`cursor-pointer border-b border-white/5 text-white/75 transition last:border-0 ${
                    selected ? "bg-valorant-red/10" : "hover:bg-white/[0.03]"
                  }`}
                  onClick={() => onSelectEvent(eventKey)}
                >
                  <td className="py-3 pr-4 font-bold text-white">{formatOptionalValue(event.matchId)}</td>
                  <td className="py-3 pr-4 font-bold text-white">{event.timestamp}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex h-7 items-center rounded border border-valorant-red/30 bg-valorant-red/10 px-2 text-xs font-black text-valorant-red">
                      {event.eventType}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{event.positionX}</td>
                  <td className="py-3 pr-4">{event.positionY}</td>
                  <td className="py-3 pr-4">{formatOptionalValue(event.killer)}</td>
                  <td className="py-3 pr-4">{formatOptionalValue(event.victim)}</td>
                  <td className="py-3 pr-0">{formatOptionalValue(event.weapon)}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
