import type { Match, MatchMode, PlayerMatchStats } from "../types";

export type CsvPreviewRow = {
  acs: number;
  agent: string;
  assists: number;
  averageRating: number;
  date: string;
  deaths: number;
  hsRate: number;
  kills: number;
  map: string;
  mode: MatchMode;
  win: boolean;
};

export type ParsedCsvResult = {
  invalidRows: Array<{ lineNumber: number; reason: string; raw: string }>;
  matches: Match[];
  playerStats: PlayerMatchStats[];
  previewRows: CsvPreviewRow[];
  validRows: number;
};

const REQUIRED_COLUMNS = [
  "date",
  "map",
  "agent",
  "mode",
  "kills",
  "deaths",
  "assists",
  "acs",
  "hsRate",
  "win",
  "averageRating",
] as const;

const PLAYER_PUUID = "csv-imported-player";

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const normalizeMode = (value: string): MatchMode | null => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "competitive") return "Competitive";
  if (normalized === "deathmatch" || normalized === "dm") return "Deathmatch";
  if (normalized === "team deathmatch" || normalized === "tdm") return "Team Deathmatch";
  return null;
};

const parseBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "true" || normalized === "1" || normalized === "win" || normalized === "won") return true;
  if (normalized === "false" || normalized === "0" || normalized === "loss" || normalized === "lost") return false;
  return null;
};

const parseNumber = (value: string) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const isBlankLine = (line: string) => line.trim().length === 0;

export const parseCsv = (csvText: string): ParsedCsvResult => {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerLine = lines.find((line) => !isBlankLine(line));

  if (!headerLine) {
    return {
      invalidRows: [{ lineNumber: 1, reason: "CSV is empty", raw: "" }],
      matches: [],
      playerStats: [],
      previewRows: [],
      validRows: 0,
    };
  }

  const headerIndex = lines.indexOf(headerLine);
  const headers = splitCsvLine(headerLine).map((header) => header.trim());
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    return {
      invalidRows: [
        {
          lineNumber: headerIndex + 1,
          reason: `Missing required columns: ${missingColumns.join(", ")}`,
          raw: headerLine,
        },
      ],
      matches: [],
      playerStats: [],
      previewRows: [],
      validRows: 0,
    };
  }

  const invalidRows: ParsedCsvResult["invalidRows"] = [];
  const matches: Match[] = [];
  const playerStats: PlayerMatchStats[] = [];
  const previewRows: CsvPreviewRow[] = [];

  lines.slice(headerIndex + 1).forEach((line, rowIndex) => {
    const lineNumber = headerIndex + rowIndex + 2;

    if (isBlankLine(line)) {
      return;
    }

    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const mode = normalizeMode(row.mode);
    const win = parseBoolean(row.win);
    const kills = parseNumber(row.kills);
    const deaths = parseNumber(row.deaths);
    const assists = parseNumber(row.assists);
    const acs = parseNumber(row.acs);
    const hsRate = parseNumber(row.hsRate);
    const averageRating = parseNumber(row.averageRating);

    if (!row.date || !row.map || !row.agent) {
      invalidRows.push({ lineNumber, reason: "date, map, and agent are required", raw: line });
      return;
    }

    if (!mode) {
      invalidRows.push({ lineNumber, reason: "mode must be Competitive, Deathmatch, or Team Deathmatch", raw: line });
      return;
    }

    if (
      kills === null ||
      deaths === null ||
      assists === null ||
      acs === null ||
      hsRate === null ||
      averageRating === null
    ) {
      invalidRows.push({ lineNumber, reason: "numeric columns contain invalid values", raw: line });
      return;
    }

    if (win === null) {
      invalidRows.push({ lineNumber, reason: "win must be true or false", raw: line });
      return;
    }

    const matchId = `csv-${lineNumber}-${row.date}`;
    const safeHsRate = Math.min(Math.max(hsRate, 0), 100);
    const headshots = Math.round(safeHsRate);
    const bodyshots = 100 - headshots;
    const legshots = 0;

    matches.push({
      matchId,
      playedAt: row.date,
      mode,
      map: row.map,
      averageRating,
    });

    playerStats.push({
      matchId,
      playerPuuid: PLAYER_PUUID,
      agent: row.agent,
      win,
      kills,
      deaths,
      assists,
      acs,
      headshots,
      bodyshots,
      legshots,
    });

    previewRows.push({
      date: row.date,
      map: row.map,
      agent: row.agent,
      mode,
      kills,
      deaths,
      assists,
      acs,
      hsRate: safeHsRate,
      win,
      averageRating,
    });
  });

  return {
    invalidRows,
    matches,
    playerStats,
    previewRows,
    validRows: matches.length,
  };
};
