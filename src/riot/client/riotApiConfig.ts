import { MOCK_RIOT_ACCOUNT } from "../mock/mockAccount";
import type { RiotRegion } from "../types";
import type { RiotApiConfig, RiotApiMode, RiotApiRateLimitMock } from "./riotApiTypes";

const regionValues: RiotRegion[] = ["AP", "NA", "EU", "KR"];

const getEnvValue = (key: string) => {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const value = env[key];

  return typeof value === "string" ? value : "";
};

export const isProductionBuild = () => Boolean(import.meta.env.PROD);

export const isPublicDemoMode = () => isProductionBuild() || getEnvValue("VITE_VALORANT_LENS_PUBLIC_DEMO") === "true";

const getEnvMode = (): RiotApiMode => {
  if (isPublicDemoMode()) {
    return "mock";
  }

  return getEnvValue("VITE_RIOT_API_MODE") === "real" ? "real" : "mock";
};

const getEnvRegion = (): RiotRegion => {
  const region = getEnvValue("VITE_RIOT_API_REGION");

  return regionValues.includes(region as RiotRegion) ? (region as RiotRegion) : MOCK_RIOT_ACCOUNT.region;
};

export const RIOT_API_KEY_EXPOSED_WARNING =
  "VITE_RIOT_API_KEY is exposed in the browser bundle. Use real mode only for local dev verification.";

export const isRealModeAllowed = (config: RiotApiConfig) =>
  config.mode === "real" && !isPublicDemoMode() && isRiotApiConfigured(config);

export const DEFAULT_RIOT_API_CONFIG: RiotApiConfig = {
  apiKey: getEnvValue("VITE_RIOT_API_KEY"),
  mode: getEnvMode(),
  region: getEnvRegion(),
};

export const RIOT_API_RATE_LIMIT_MOCK: RiotApiRateLimitMock = {
  remaining: 100,
  resetInSeconds: 60,
};

export const isRiotApiConfigured = (config: RiotApiConfig = DEFAULT_RIOT_API_CONFIG) =>
  config.apiKey.trim().length > 0;

export const RIOT_API_MOCK_MODE = DEFAULT_RIOT_API_CONFIG.mode === "mock";

export const getRiotApiConfig = (): RiotApiConfig => ({
  apiKey: getEnvValue("VITE_RIOT_API_KEY"),
  mode: getEnvMode(),
  region: getEnvRegion(),
});
