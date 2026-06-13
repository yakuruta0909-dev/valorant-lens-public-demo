import type { MatchTimelineEvent } from "./types";
import { validateTimeline } from "./validateTimeline";

export type TimelineVerificationReport = {
  duplicateEvents: number;
  duplicateEventKeys: string[];
  eventCount: number;
  invalidCount: number;
  missingPositions: number;
  valid: boolean;
};

const buildEventKey = (event: MatchTimelineEvent) =>
  [
    event.timestamp,
    event.eventType,
    event.positionX,
    event.positionY,
    event.killer ?? "",
    event.victim ?? "",
    event.weapon ?? "",
  ].join("|");

export const verifyTimelineData = (timelineEvents: MatchTimelineEvent[]): TimelineVerificationReport => {
  const validation = validateTimeline(timelineEvents);
  const seenKeys = new Set<string>();
  const duplicateKeys = new Set<string>();

  timelineEvents.forEach((event) => {
    const key = buildEventKey(event);

    if (seenKeys.has(key)) {
      duplicateKeys.add(key);
      return;
    }

    seenKeys.add(key);
  });

  return {
    duplicateEventKeys: Array.from(duplicateKeys),
    duplicateEvents: duplicateKeys.size,
    eventCount: timelineEvents.length,
    invalidCount: validation.invalidEvents,
    missingPositions: validation.missingPositions,
    valid: validation.valid && duplicateKeys.size === 0,
  };
};
