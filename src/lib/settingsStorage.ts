import { PERFORMANCE_WEIGHTS } from "../constants/performanceWeights";
import type { DataSourceType, MetricKey, PeriodType, UserSettings } from "../types";

const STORAGE_KEY = "valorant-improvement-analyzer-settings";

const metricKeys: MetricKey[] = [
  "rankMatches",
  "winRate",
  "kd",
  "acs",
  "hsRate",
  "deathmatchCount",
  "teamDeathmatchCount",
  "practiceMatches",
  "matchStrength",
  "performanceIndex",
];

const periodTypes: PeriodType[] = ["week", "month", "year"];
const dataSourceTypes: DataSourceType[] = ["dummy", "csv", "riot"];

export const DEFAULT_SETTINGS: UserSettings = {
  dataSource: "dummy",
  defaultPeriod: "month",
  defaultMetrics: ["acs", "kd", "hsRate", "practiceMatches", "performanceIndex"],
  performanceWeights: {
    acs: PERFORMANCE_WEIGHTS.acs,
    kd: PERFORMANCE_WEIGHTS.kd,
    hsRate: PERFORMANCE_WEIGHTS.hsRate,
    win: PERFORMANCE_WEIGHTS.win,
    difficulty: PERFORMANCE_WEIGHTS.difficulty,
  },
  correlationThresholds: {
    strong: 0.7,
    moderate: 0.4,
    weak: 0.2,
  },
};

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const clampSettingNumber = (value: unknown, fallback: number) => {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(Math.max(numberValue, 0), 1);
};

const sanitizeSettings = (value: unknown): UserSettings => {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  const rawMetrics = Array.isArray(value.defaultMetrics) ? value.defaultMetrics : DEFAULT_SETTINGS.defaultMetrics;
  const performanceWeights = isRecord(value.performanceWeights) ? value.performanceWeights : {};
  const correlationThresholds = isRecord(value.correlationThresholds) ? value.correlationThresholds : {};

  const defaultMetrics = rawMetrics.filter((metric): metric is MetricKey => {
    return typeof metric === "string" && metricKeys.includes(metric as MetricKey);
  });

  return {
    dataSource:
      typeof value.dataSource === "string" && dataSourceTypes.includes(value.dataSource as DataSourceType)
        ? (value.dataSource as DataSourceType)
        : DEFAULT_SETTINGS.dataSource,
    defaultPeriod:
      typeof value.defaultPeriod === "string" && periodTypes.includes(value.defaultPeriod as PeriodType)
        ? (value.defaultPeriod as PeriodType)
        : DEFAULT_SETTINGS.defaultPeriod,
    defaultMetrics: defaultMetrics.length > 0 ? defaultMetrics : DEFAULT_SETTINGS.defaultMetrics,
    performanceWeights: {
      acs: clampSettingNumber(performanceWeights.acs, DEFAULT_SETTINGS.performanceWeights.acs),
      kd: clampSettingNumber(performanceWeights.kd, DEFAULT_SETTINGS.performanceWeights.kd),
      hsRate: clampSettingNumber(performanceWeights.hsRate, DEFAULT_SETTINGS.performanceWeights.hsRate),
      win: clampSettingNumber(performanceWeights.win, DEFAULT_SETTINGS.performanceWeights.win),
      difficulty: clampSettingNumber(
        performanceWeights.difficulty,
        DEFAULT_SETTINGS.performanceWeights.difficulty,
      ),
    },
    correlationThresholds: {
      strong: clampSettingNumber(correlationThresholds.strong, DEFAULT_SETTINGS.correlationThresholds.strong),
      moderate: clampSettingNumber(
        correlationThresholds.moderate,
        DEFAULT_SETTINGS.correlationThresholds.moderate,
      ),
      weak: clampSettingNumber(correlationThresholds.weak, DEFAULT_SETTINGS.correlationThresholds.weak),
    },
  };
};

export const loadSettings = (): UserSettings => {
  if (!canUseLocalStorage()) {
    return DEFAULT_SETTINGS;
  }

  const rawSettings = window.localStorage.getItem(STORAGE_KEY);

  if (!rawSettings) {
    return DEFAULT_SETTINGS;
  }

  try {
    return sanitizeSettings(JSON.parse(rawSettings));
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings) => {
  const sanitizedSettings = sanitizeSettings(settings);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedSettings));
  }

  return sanitizedSettings;
};

export const resetSettings = () => {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }

  return DEFAULT_SETTINGS;
};

export const exportSettings = () => {
  return JSON.stringify(loadSettings(), null, 2);
};

export const importSettings = (rawSettings: string) => {
  const parsedSettings = JSON.parse(rawSettings) as unknown;
  return saveSettings(sanitizeSettings(parsedSettings));
};

export const getSettingsStorageKey = () => STORAGE_KEY;
