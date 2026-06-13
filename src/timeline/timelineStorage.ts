import type { MatchTimelineEvent } from "./types";

const TIMELINE_STORAGE_KEY = "valorant-improvement-analyzer-timeline-data";

export type ImportedTimelineData = {
  timelineEvents: MatchTimelineEvent[];
};

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isTimelineEvent = (value: unknown): value is MatchTimelineEvent => {
  return (
    isRecord(value) &&
    typeof value.timestamp === "number" &&
    typeof value.eventType === "string" &&
    typeof value.positionX === "number" &&
    typeof value.positionY === "number"
  );
};

export const saveTimelineEvents = (timelineEvents: MatchTimelineEvent[]) => {
  const data: ImportedTimelineData = { timelineEvents };

  if (canUseLocalStorage()) {
    window.localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(data));
  }

  return data;
};

export const loadTimelineEvents = (): ImportedTimelineData => {
  if (!canUseLocalStorage()) {
    return { timelineEvents: [] };
  }

  const rawData = window.localStorage.getItem(TIMELINE_STORAGE_KEY);

  if (!rawData) {
    return { timelineEvents: [] };
  }

  try {
    const parsedData = JSON.parse(rawData) as unknown;

    if (!isRecord(parsedData) || !Array.isArray(parsedData.timelineEvents)) {
      return { timelineEvents: [] };
    }

    return {
      timelineEvents: parsedData.timelineEvents.filter(isTimelineEvent),
    };
  } catch {
    return { timelineEvents: [] };
  }
};

export const clearTimelineEvents = () => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(TIMELINE_STORAGE_KEY);
  }
};

export const getTimelineStorageKey = () => TIMELINE_STORAGE_KEY;
