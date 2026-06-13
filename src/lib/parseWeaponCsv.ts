import { WEAPONS } from "../data/dummyWeaponStats";
import type { WeaponStat } from "../types";

export type WeaponCsvPreviewRow = {
  bodyshots: number;
  headshots: number;
  kills: number;
  legshots: number;
  matchId: string;
  weapon: string;
};

export type WeaponCsvInvalidReason = "missingColumns" | "missingRequired" | "invalidNumber" | "unknownWeapon" | "negativeValue";

export type WeaponCsvInvalidRow = {
  lineNumber: number;
  reason: string;
  reasonCode: WeaponCsvInvalidReason;
  raw: string;
};

export type ParsedWeaponCsvResult = {
  invalidRows: WeaponCsvInvalidRow[];
  previewRows: WeaponCsvPreviewRow[];
  validRows: number;
  weaponStats: WeaponStat[];
  errorSummary: {
    invalidRows: number;
    unknownWeapon: number;
    negativeValues: number;
  };
};

const REQUIRED_COLUMNS = ["matchId", "weapon", "kills", "headshots", "bodyshots", "legshots"] as const;

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

const parseNumber = (value: string) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const isBlankLine = (line: string) => line.trim().length === 0;

const createEmptyResult = (invalidRows: WeaponCsvInvalidRow[] = []): ParsedWeaponCsvResult => ({
  errorSummary: {
    invalidRows: invalidRows.length,
    negativeValues: invalidRows.filter((row) => row.reasonCode === "negativeValue").length,
    unknownWeapon: invalidRows.filter((row) => row.reasonCode === "unknownWeapon").length,
  },
  invalidRows,
  previewRows: [],
  validRows: 0,
  weaponStats: [],
});

export const parseWeaponCsv = (csvText: string): ParsedWeaponCsvResult => {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerLine = lines.find((line) => !isBlankLine(line));

  if (!headerLine) {
    return createEmptyResult([
      {
        lineNumber: 1,
        raw: "",
        reason: "CSV is empty",
        reasonCode: "missingRequired",
      },
    ]);
  }

  const headerIndex = lines.indexOf(headerLine);
  const headers = splitCsvLine(headerLine).map((header) => header.trim());
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    return createEmptyResult([
      {
        lineNumber: headerIndex + 1,
        raw: headerLine,
        reason: `Missing required columns: ${missingColumns.join(", ")}`,
        reasonCode: "missingColumns",
      },
    ]);
  }

  const invalidRows: WeaponCsvInvalidRow[] = [];
  const previewRows: WeaponCsvPreviewRow[] = [];
  const weaponStats: WeaponStat[] = [];

  lines.slice(headerIndex + 1).forEach((line, rowIndex) => {
    const lineNumber = headerIndex + rowIndex + 2;

    if (isBlankLine(line)) {
      return;
    }

    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const kills = parseNumber(row.kills);
    const headshots = parseNumber(row.headshots);
    const bodyshots = parseNumber(row.bodyshots);
    const legshots = parseNumber(row.legshots);

    if (!row.matchId || !row.weapon) {
      invalidRows.push({
        lineNumber,
        raw: line,
        reason: "matchId and weapon are required",
        reasonCode: "missingRequired",
      });
      return;
    }

    if (!WEAPONS.includes(row.weapon as (typeof WEAPONS)[number])) {
      invalidRows.push({
        lineNumber,
        raw: line,
        reason: `Unknown weapon: ${row.weapon}`,
        reasonCode: "unknownWeapon",
      });
      return;
    }

    if (kills === null || headshots === null || bodyshots === null || legshots === null) {
      invalidRows.push({
        lineNumber,
        raw: line,
        reason: "numeric columns contain invalid values",
        reasonCode: "invalidNumber",
      });
      return;
    }

    if ([kills, headshots, bodyshots, legshots].some((value) => value < 0)) {
      invalidRows.push({
        lineNumber,
        raw: line,
        reason: "numeric columns must not be negative",
        reasonCode: "negativeValue",
      });
      return;
    }

    const weaponStat: WeaponStat = {
      matchId: row.matchId,
      weapon: row.weapon,
      kills,
      headshots,
      bodyshots,
      legshots,
    };

    weaponStats.push(weaponStat);
    previewRows.push(weaponStat);
  });

  return {
    errorSummary: {
      invalidRows: invalidRows.length,
      negativeValues: invalidRows.filter((row) => row.reasonCode === "negativeValue").length,
      unknownWeapon: invalidRows.filter((row) => row.reasonCode === "unknownWeapon").length,
    },
    invalidRows,
    previewRows,
    validRows: weaponStats.length,
    weaponStats,
  };
};
