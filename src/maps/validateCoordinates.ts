import type { MatchTimelineEvent } from "../timeline/types";
import { normalizeCoordinate } from "./coordinateAdapter";
import { getMapMetadata } from "./mapMetadata";

export type CoordinateValidationIssue =
  | "missing-map-metadata"
  | "nan"
  | "infinity"
  | "out-of-range";

export type CoordinateValidationResult = {
  event: MatchTimelineEvent;
  issue?: CoordinateValidationIssue;
  normalizedX?: number;
  normalizedY?: number;
  valid: boolean;
};

const isFiniteNumber = (value: number) => Number.isFinite(value);

export const validateTimelineCoordinates = (
  timelineEvents: MatchTimelineEvent[],
  matchMapById: Map<string, string>,
): CoordinateValidationResult[] =>
  timelineEvents.map((event) => {
    const metadata = getMapMetadata(matchMapById.get(event.matchId ?? ""));

    if (!metadata) {
      return {
        event,
        issue: "missing-map-metadata",
        valid: false,
      };
    }

    if (Number.isNaN(event.positionX) || Number.isNaN(event.positionY)) {
      return {
        event,
        issue: "nan",
        valid: false,
      };
    }

    if (!isFiniteNumber(event.positionX) || !isFiniteNumber(event.positionY)) {
      return {
        event,
        issue: "infinity",
        valid: false,
      };
    }

    const normalized = normalizeCoordinate({
      metadata,
      worldX: event.positionX,
      worldY: event.positionY,
    });
    const valid =
      normalized.x >= 0 &&
      normalized.x <= 1 &&
      normalized.y >= 0 &&
      normalized.y <= 1;

    return {
      event,
      issue: valid ? undefined : "out-of-range",
      normalizedX: normalized.x,
      normalizedY: normalized.y,
      valid,
    };
  });
