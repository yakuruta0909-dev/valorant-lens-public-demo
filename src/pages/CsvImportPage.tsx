import { Activity, CheckCircle2, Crosshair, FileUp, Swords, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { PracticeSummaryCard } from "../components/PracticeSummaryCard";
import { saveInvalidDataReport } from "../lib/dataQualityStorage";
import { loadImportedMatches, saveImportedMatches } from "../lib/importStorage";
import { parseCsv, type ParsedCsvResult } from "../lib/parseCsv";
import { parseWeaponCsv, type ParsedWeaponCsvResult } from "../lib/parseWeaponCsv";
import { loadSettings, saveSettings } from "../lib/settingsStorage";
import { validateDataSource } from "../lib/validateDataSource";
import { loadImportedWeaponStats, saveImportedWeaponStats } from "../lib/weaponImportStorage";
import type { MatchMode } from "../types";

const emptyParsedResult: ParsedCsvResult = {
  invalidRows: [],
  matches: [],
  playerStats: [],
  previewRows: [],
  validRows: 0,
};

const emptyWeaponParsedResult: ParsedWeaponCsvResult = {
  errorSummary: {
    invalidRows: 0,
    negativeValues: 0,
    unknownWeapon: 0,
  },
  invalidRows: [],
  previewRows: [],
  validRows: 0,
  weaponStats: [],
};

const buildImportedSummary = () => {
  const importedData = loadImportedMatches();
  const importedWeaponData = loadImportedWeaponStats();
  const countByMode = (mode: MatchMode) => importedData.matches.filter((match) => match.mode === mode).length;

  return {
    competitive: countByMode("Competitive"),
    deathmatch: countByMode("Deathmatch"),
    teamDeathmatch: countByMode("Team Deathmatch"),
    total: importedData.matches.length,
    weaponRecords: importedWeaponData.weaponStats.length,
  };
};

const formatMatchModeForPublicDemo = (mode: MatchMode) => {
  if (mode === "Deathmatch") return "Solo Practice";
  if (mode === "Team Deathmatch") return "Team Practice";
  return mode;
};

export function CsvImportPage() {
  const [matchFileName, setMatchFileName] = useState("");
  const [weaponFileName, setWeaponFileName] = useState("");
  const [matchParseResult, setMatchParseResult] = useState<ParsedCsvResult>(emptyParsedResult);
  const [weaponParseResult, setWeaponParseResult] = useState<ParsedWeaponCsvResult>(emptyWeaponParsedResult);
  const [matchStatus, setMatchStatus] = useState("No match CSV loaded");
  const [weaponStatus, setWeaponStatus] = useState("No weapon CSV loaded");
  const [importedSummary, setImportedSummary] = useState(() => buildImportedSummary());
  const matchPreviewRows = useMemo(() => matchParseResult.previewRows.slice(0, 20), [matchParseResult.previewRows]);
  const weaponPreviewRows = useMemo(
    () => weaponParseResult.previewRows.slice(0, 20),
    [weaponParseResult.previewRows],
  );
  const invalidDataReport = useMemo(
    () => ({
      invalidRows: matchParseResult.invalidRows.length + weaponParseResult.errorSummary.invalidRows,
      negativeValues: weaponParseResult.errorSummary.negativeValues,
      unknownWeapon: weaponParseResult.errorSummary.unknownWeapon,
    }),
    [
      matchParseResult.invalidRows.length,
      weaponParseResult.errorSummary.invalidRows,
      weaponParseResult.errorSummary.negativeValues,
      weaponParseResult.errorSummary.unknownWeapon,
    ],
  );
  const importQualityReport = useMemo(
    () =>
      validateDataSource({
        invalidDataReport,
        matches: matchParseResult.matches,
        playerMatchStats: matchParseResult.playerStats,
        weaponStats: weaponParseResult.weaponStats,
      }),
    [invalidDataReport, matchParseResult.matches, matchParseResult.playerStats, weaponParseResult.weaponStats],
  );

  const handleMatchFileChange = async (file: File | undefined) => {
    if (!file) return;

    setMatchFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMatchParseResult({
        ...emptyParsedResult,
        invalidRows: [{ lineNumber: 1, reason: "Only .csv files are supported", raw: file.name }],
      });
      setMatchStatus("Invalid file type");
      return;
    }

    const csvText = await file.text();
    const nextResult = parseCsv(csvText);
    setMatchParseResult(nextResult);
    setMatchStatus(`Parsed ${nextResult.validRows} valid match rows`);
  };

  const handleWeaponFileChange = async (file: File | undefined) => {
    if (!file) return;

    setWeaponFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setWeaponParseResult({
        ...emptyWeaponParsedResult,
        errorSummary: {
          invalidRows: 1,
          negativeValues: 0,
          unknownWeapon: 0,
        },
        invalidRows: [
          {
            lineNumber: 1,
            raw: file.name,
            reason: "Only .csv files are supported",
            reasonCode: "missingRequired",
          },
        ],
      });
      setWeaponStatus("Invalid file type");
      return;
    }

    const csvText = await file.text();
    const nextResult = parseWeaponCsv(csvText);
    setWeaponParseResult(nextResult);
    setWeaponStatus(`Parsed ${nextResult.validRows} valid weapon rows`);
  };

  const handleMatchImport = () => {
    if (matchParseResult.validRows === 0) {
      setMatchStatus("No valid match rows to import");
      return;
    }

    saveImportedMatches(matchParseResult.matches, matchParseResult.playerStats);
    saveInvalidDataReport(invalidDataReport);
    saveSettings({ ...loadSettings(), dataSource: "csv" });
    setImportedSummary(buildImportedSummary());
    setMatchStatus(`Matches Imported: ${matchParseResult.validRows}`);
  };

  const handleWeaponImport = () => {
    if (weaponParseResult.validRows === 0) {
      setWeaponStatus("No valid weapon rows to import");
      return;
    }

    saveImportedWeaponStats(weaponParseResult.weaponStats);
    saveInvalidDataReport(invalidDataReport);
    saveSettings({ ...loadSettings(), dataSource: "csv" });
    setImportedSummary(buildImportedSummary());
    setWeaponStatus(`Weapon Records Imported: ${weaponParseResult.validRows}`);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <PracticeSummaryCard icon={Activity} label="Imported Matches" value={importedSummary.total} />
        <PracticeSummaryCard icon={Swords} label="Competitive" value={importedSummary.competitive} />
        <PracticeSummaryCard icon={FileUp} label="Solo Practice" value={importedSummary.deathmatch} />
        <PracticeSummaryCard icon={FileUp} label="Team Practice" value={importedSummary.teamDeathmatch} />
        <PracticeSummaryCard icon={Crosshair} label="Weapon Records" value={importedSummary.weaponRecords} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <UploadCard
          description="date,map,agent,mode,kills,deaths,assists,acs,hsRate,win,averageRating"
          fileName={matchFileName}
          label="Match CSV"
          status={matchStatus}
          title="Upload Match CSV"
          validRows={matchParseResult.validRows}
          onFileChange={handleMatchFileChange}
          onImport={handleMatchImport}
        />
        <UploadCard
          description="matchId,weapon,kills,headshots,bodyshots,legshots"
          fileName={weaponFileName}
          label="Weapon Stats CSV"
          status={weaponStatus}
          title="Upload Weapon Stats CSV"
          validRows={weaponParseResult.validRows}
          onFileChange={handleWeaponFileChange}
          onImport={handleWeaponImport}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ValidationCard icon={CheckCircle2} label="Valid Match Rows" value={matchParseResult.validRows} variant="valid" />
        <ValidationCard icon={TriangleAlert} label="Invalid Match Rows" value={matchParseResult.invalidRows.length} variant="invalid" />
        <ValidationCard icon={CheckCircle2} label="Valid Weapon Rows" value={weaponParseResult.validRows} variant="valid" />
        <ValidationCard icon={TriangleAlert} label="Unknown Weapon" value={weaponParseResult.errorSummary.unknownWeapon} variant="invalid" />
        <ValidationCard icon={TriangleAlert} label="Negative Values" value={weaponParseResult.errorSummary.negativeValues} variant="invalid" />
      </div>

      <ImportReview
        duplicateIds={importQualityReport.duplicateReport.duplicateMatchIds.length}
        invalidRows={invalidDataReport.invalidRows}
        matches={matchParseResult.validRows}
        weaponRecords={weaponParseResult.validRows}
      />

      <InvalidRowsSection
        rows={[
          ...matchParseResult.invalidRows.map((row) => ({
            lineNumber: row.lineNumber,
            reason: row.reason,
            source: "Match CSV",
          })),
          ...weaponParseResult.invalidRows.map((row) => ({
            lineNumber: row.lineNumber,
            reason: row.reason,
            source: "Weapon CSV",
          })),
        ]}
      />

      <div className="grid gap-5 2xl:grid-cols-2">
        <MatchPreviewTable rows={matchPreviewRows} />
        <WeaponPreviewTable rows={weaponPreviewRows} />
      </div>
    </div>
  );
}

function UploadCard({
  description,
  fileName,
  label,
  status,
  title,
  validRows,
  onFileChange,
  onImport,
}: {
  description: string;
  fileName: string;
  label: string;
  status: string;
  title: string;
  validRows: number;
  onFileChange: (file: File | undefined) => Promise<void>;
  onImport: () => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FileUp className="h-5 w-5 text-valorant-red" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-black text-white">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">{description}</p>
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-white/70">
          {status}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">{label}</span>
          <input
            accept=".csv,text/csv"
            className="block w-full rounded-md border border-white/10 bg-[#090b10] px-3 py-3 text-sm font-semibold text-white file:mr-4 file:rounded-md file:border-0 file:bg-valorant-red file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
            type="file"
            onChange={(event) => void onFileChange(event.target.files?.[0])}
          />
        </label>

        <button
          className="h-11 rounded-md border border-valorant-red/60 bg-valorant-red px-5 text-sm font-black text-white transition hover:bg-valorant-red/80 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-white/35"
          disabled={validRows === 0}
          type="button"
          onClick={onImport}
        >
          Import Anyway
        </button>
      </div>

      {fileName && <p className="mt-3 text-sm font-semibold text-white/50">Loaded: {fileName}</p>}
    </section>
  );
}

function ImportReview({
  duplicateIds,
  invalidRows,
  matches,
  weaponRecords,
}: {
  duplicateIds: number;
  invalidRows: number;
  matches: number;
  weaponRecords: number;
}) {
  const reviewItems = [
    ["Matches", matches],
    ["Weapon Records", weaponRecords],
    ["Duplicate IDs", duplicateIds],
    ["Invalid Rows", invalidRows],
  ] as const;

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Import Review</h2>
        <p className="mt-1 text-sm font-semibold text-white/50">
          Review parsed data before using Import Anyway.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {reviewItems.map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-white/60">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InvalidRowsSection({
  rows,
}: {
  rows: Array<{ lineNumber: number; reason: string; source: string }>;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <h2 className="mb-4 text-lg font-black text-white">Invalid Row Details</h2>
      <div className="grid gap-2">
        {rows.slice(0, 10).map((row) => (
          <div
            key={`${row.source}-${row.lineNumber}-${row.reason}`}
            className="rounded-md border border-valorant-red/30 bg-valorant-red/10 p-3 text-sm text-valorant-red"
          >
            {row.source} line {row.lineNumber}: {row.reason}
          </div>
        ))}
      </div>
    </section>
  );
}

function MatchPreviewTable({ rows }: { rows: ParsedCsvResult["previewRows"] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Match Preview</h2>
        <p className="text-sm font-semibold text-white/50">First 20 valid rows</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
              <th className="py-3 pr-4 font-bold">Date</th>
              <th className="py-3 pr-4 font-bold">Map</th>
              <th className="py-3 pr-4 font-bold">Agent</th>
              <th className="py-3 pr-4 font-bold">Mode</th>
              <th className="py-3 pr-4 font-bold">Kills</th>
              <th className="py-3 pr-4 font-bold">Deaths</th>
              <th className="py-3 pr-4 font-bold">ACS</th>
              <th className="py-3 pr-4 font-bold">HS Rate</th>
              <th className="py-3 pr-0 font-bold">Average Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-white/45" colSpan={9}>
                  No valid match preview rows
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.date}-${row.map}-${row.agent}-${index}`} className="border-b border-white/5 text-white/75 last:border-0">
                  <td className="py-3 pr-4 font-bold text-white">{row.date}</td>
                  <td className="py-3 pr-4">{row.map}</td>
                  <td className="py-3 pr-4">{row.agent}</td>
                  <td className="py-3 pr-4">{formatMatchModeForPublicDemo(row.mode)}</td>
                  <td className="py-3 pr-4">{row.kills}</td>
                  <td className="py-3 pr-4">{row.deaths}</td>
                  <td className="py-3 pr-4">{row.acs}</td>
                  <td className="py-3 pr-4">{row.hsRate.toFixed(1)}%</td>
                  <td className="py-3 pr-0">{row.averageRating}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WeaponPreviewTable({ rows }: { rows: ParsedWeaponCsvResult["previewRows"] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Weapon Preview</h2>
        <p className="text-sm font-semibold text-white/50">First 20 valid rows</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/40">
              <th className="py-3 pr-4 font-bold">Match ID</th>
              <th className="py-3 pr-4 font-bold">Weapon</th>
              <th className="py-3 pr-4 font-bold">Kills</th>
              <th className="py-3 pr-4 font-bold">Head</th>
              <th className="py-3 pr-4 font-bold">Body</th>
              <th className="py-3 pr-0 font-bold">Leg</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-white/45" colSpan={6}>
                  No valid weapon preview rows
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.matchId}-${row.weapon}-${index}`} className="border-b border-white/5 text-white/75 last:border-0">
                  <td className="py-3 pr-4 font-bold text-white">{row.matchId}</td>
                  <td className="py-3 pr-4">{row.weapon}</td>
                  <td className="py-3 pr-4">{row.kills}</td>
                  <td className="py-3 pr-4">{row.headshots}</td>
                  <td className="py-3 pr-4">{row.bodyshots}</td>
                  <td className="py-3 pr-0">{row.legshots}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ValidationCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  variant: "valid" | "invalid";
}) {
  return (
    <div
      className={`rounded-lg border p-5 shadow-2xl shadow-black/20 ${
        variant === "valid"
          ? "border-emerald-400/30 bg-emerald-400/10"
          : "border-valorant-red/30 bg-valorant-red/10"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-white/70">{label}</span>
        <Icon className={variant === "valid" ? "h-5 w-5 text-emerald-200" : "h-5 w-5 text-valorant-red"} />
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}
