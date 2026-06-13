import type { Match, PlayerMatchStats } from "../types";

const IMPORT_STORAGE_KEY = "valorant-improvement-analyzer-imported-data";

export type ImportedMatchData = {
  matches: Match[];
  playerStats: PlayerMatchStats[];
};

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isMatch = (value: unknown): value is Match => {
  return (
    isRecord(value) &&
    typeof value.matchId === "string" &&
    typeof value.playedAt === "string" &&
    (value.mode === "Competitive" || value.mode === "Deathmatch" || value.mode === "Team Deathmatch") &&
    typeof value.map === "string" &&
    typeof value.averageRating === "number"
  );
};

const isPlayerStats = (value: unknown): value is PlayerMatchStats => {
  return (
    isRecord(value) &&
    typeof value.matchId === "string" &&
    typeof value.playerPuuid === "string" &&
    typeof value.agent === "string" &&
    typeof value.win === "boolean" &&
    typeof value.kills === "number" &&
    typeof value.deaths === "number" &&
    typeof value.assists === "number" &&
    typeof value.acs === "number" &&
    typeof value.headshots === "number" &&
    typeof value.bodyshots === "number" &&
    typeof value.legshots === "number"
  );
};

export const saveImportedMatches = (matches: Match[], playerStats: PlayerMatchStats[]) => {
  const data: ImportedMatchData = { matches, playerStats };

  if (canUseLocalStorage()) {
    window.localStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(data));
  }

  return data;
};

export const loadImportedMatches = (): ImportedMatchData => {
  if (!canUseLocalStorage()) {
    return { matches: [], playerStats: [] };
  }

  const rawData = window.localStorage.getItem(IMPORT_STORAGE_KEY);

  if (!rawData) {
    return { matches: [], playerStats: [] };
  }

  try {
    const parsedData = JSON.parse(rawData) as unknown;

    if (!isRecord(parsedData) || !Array.isArray(parsedData.matches) || !Array.isArray(parsedData.playerStats)) {
      return { matches: [], playerStats: [] };
    }

    return {
      matches: parsedData.matches.filter(isMatch),
      playerStats: parsedData.playerStats.filter(isPlayerStats),
    };
  } catch {
    return { matches: [], playerStats: [] };
  }
};

export const clearImportedMatches = () => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(IMPORT_STORAGE_KEY);
  }
};

export const getImportStorageKey = () => IMPORT_STORAGE_KEY;
