import type { InvalidDataReport } from "./calculateHealthScore";

const DATA_QUALITY_STORAGE_KEY = "valorant-improvement-analyzer-quality-report";

const emptyInvalidDataReport: InvalidDataReport = {
  invalidRows: 0,
  negativeValues: 0,
  unknownWeapon: 0,
};

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isInvalidDataReport = (value: unknown): value is InvalidDataReport => {
  return (
    isRecord(value) &&
    typeof value.invalidRows === "number" &&
    typeof value.negativeValues === "number" &&
    typeof value.unknownWeapon === "number"
  );
};

export const saveInvalidDataReport = (report: InvalidDataReport) => {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(DATA_QUALITY_STORAGE_KEY, JSON.stringify(report));
  }

  return report;
};

export const loadInvalidDataReport = (): InvalidDataReport => {
  if (!canUseLocalStorage()) {
    return emptyInvalidDataReport;
  }

  const rawData = window.localStorage.getItem(DATA_QUALITY_STORAGE_KEY);

  if (!rawData) {
    return emptyInvalidDataReport;
  }

  try {
    const parsedData = JSON.parse(rawData) as unknown;
    return isInvalidDataReport(parsedData) ? parsedData : emptyInvalidDataReport;
  } catch {
    return emptyInvalidDataReport;
  }
};

export const clearInvalidDataReport = () => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(DATA_QUALITY_STORAGE_KEY);
  }
};

export const getDataQualityStorageKey = () => DATA_QUALITY_STORAGE_KEY;
