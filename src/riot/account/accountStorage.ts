import type { RiotAccountProfile, RiotAccountStorageState } from "./accountTypes";
import type { RiotRegion } from "../types";

const RIOT_ACCOUNT_STORAGE_KEY = "valorant-improvement-analyzer-riot-account";

const emptyState: RiotAccountStorageState = {
  account: null,
  lastLookup: null,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeAccount = (value: unknown): RiotAccountProfile | null => {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.gameName !== "string" ||
    typeof value.tagLine !== "string" ||
    typeof value.puuid !== "string" ||
    typeof value.region !== "string"
  ) {
    return null;
  }

  if (!["AP", "NA", "EU", "KR"].includes(value.region)) {
    return null;
  }

  return {
    gameName: value.gameName,
    puuid: value.puuid,
    region: value.region as RiotRegion,
    tagLine: value.tagLine,
  };
};

export const getRiotAccountStorageKey = () => RIOT_ACCOUNT_STORAGE_KEY;

export const loadRiotAccountState = (): RiotAccountStorageState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const rawValue = window.localStorage.getItem(RIOT_ACCOUNT_STORAGE_KEY);

    if (!rawValue) {
      return emptyState;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isObject(parsedValue)) {
      return emptyState;
    }

    return {
      account: sanitizeAccount(parsedValue.account),
      lastLookup: typeof parsedValue.lastLookup === "string" ? parsedValue.lastLookup : null,
    };
  } catch {
    return emptyState;
  }
};

export const saveRiotAccountProfile = (account: RiotAccountProfile): RiotAccountStorageState => {
  const nextState: RiotAccountStorageState = {
    account,
    lastLookup: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(RIOT_ACCOUNT_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
};

export const clearRiotAccountProfile = (): RiotAccountStorageState => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RIOT_ACCOUNT_STORAGE_KEY);
  }

  return emptyState;
};
