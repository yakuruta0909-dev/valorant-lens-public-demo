import type { WeaponStat } from "../types";

const WEAPON_IMPORT_STORAGE_KEY = "valorant-improvement-analyzer-weapon-data";

export type ImportedWeaponData = {
  weaponStats: WeaponStat[];
};

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isWeaponStat = (value: unknown): value is WeaponStat => {
  return (
    isRecord(value) &&
    typeof value.matchId === "string" &&
    typeof value.weapon === "string" &&
    typeof value.kills === "number" &&
    typeof value.headshots === "number" &&
    typeof value.bodyshots === "number" &&
    typeof value.legshots === "number"
  );
};

export const saveImportedWeaponStats = (weaponStats: WeaponStat[]) => {
  const data: ImportedWeaponData = { weaponStats };

  if (canUseLocalStorage()) {
    window.localStorage.setItem(WEAPON_IMPORT_STORAGE_KEY, JSON.stringify(data));
  }

  return data;
};

export const loadImportedWeaponStats = (): ImportedWeaponData => {
  if (!canUseLocalStorage()) {
    return { weaponStats: [] };
  }

  const rawData = window.localStorage.getItem(WEAPON_IMPORT_STORAGE_KEY);

  if (!rawData) {
    return { weaponStats: [] };
  }

  try {
    const parsedData = JSON.parse(rawData) as unknown;

    if (!isRecord(parsedData) || !Array.isArray(parsedData.weaponStats)) {
      return { weaponStats: [] };
    }

    return {
      weaponStats: parsedData.weaponStats.filter(isWeaponStat),
    };
  } catch {
    return { weaponStats: [] };
  }
};

export const clearImportedWeaponStats = () => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(WEAPON_IMPORT_STORAGE_KEY);
  }
};

export const getWeaponImportStorageKey = () => WEAPON_IMPORT_STORAGE_KEY;
