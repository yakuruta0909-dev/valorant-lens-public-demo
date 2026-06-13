import type { MatchTimelineEvent } from "./types";
import { normalizeCoordinate } from "../maps/coordinateAdapter";
import { getMapMetadata } from "../maps/mapMetadata";

const escapeCsvValue = (value: string | number | undefined) => {
  const normalizedValue = value === undefined ? "" : String(value);

  if (!/[",\n\r]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

const getNormalizedCoordinate = (
  event: MatchTimelineEvent,
  matchMapById: Map<string, string>,
): { normalizedX?: number; normalizedY?: number } => {
  const metadata = getMapMetadata(matchMapById.get(event.matchId ?? ""));

  if (!metadata || !Number.isFinite(event.positionX) || !Number.isFinite(event.positionY)) {
    return {};
  }

  const normalized = normalizeCoordinate({
    metadata,
    worldX: event.positionX,
    worldY: event.positionY,
  });

  if (normalized.x < 0 || normalized.x > 1 || normalized.y < 0 || normalized.y > 1) {
    return {};
  }

  return {
    normalizedX: Number(normalized.x.toFixed(4)),
    normalizedY: Number(normalized.y.toFixed(4)),
  };
};

export const buildTimelineCsv = (
  timelineEvents: MatchTimelineEvent[],
  matchMapById = new Map<string, string>(),
) => {
  const headers = [
    "matchId",
    "timestamp",
    "eventType",
    "killer",
    "victim",
    "weapon",
    "positionX",
    "positionY",
    "normalizedX",
    "normalizedY",
  ];
  const rows = timelineEvents.map((event) => {
    const normalized = getNormalizedCoordinate(event, matchMapById);

    return [
      event.matchId,
      event.timestamp,
      event.eventType,
      event.killer,
      event.victim,
      event.weapon,
      event.positionX,
      event.positionY,
      normalized.normalizedX,
      normalized.normalizedY,
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
};

export const downloadTimelineCsv = (
  timelineEvents: MatchTimelineEvent[],
  matchMapById = new Map<string, string>(),
) => {
  const blob = new Blob([buildTimelineCsv(timelineEvents, matchMapById)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "timeline_export.csv";
  link.click();
  window.URL.revokeObjectURL(url);
};
