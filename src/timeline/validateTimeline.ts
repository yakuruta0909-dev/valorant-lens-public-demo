import type { MatchTimelineEvent } from "./types";

export type TimelineValidationIssueType =
  | "missing_timestamp"
  | "missing_event_type"
  | "missing_position"
  | "negative_position"
  | "same_killer_victim";

export type TimelineValidationIssue = {
  eventIndex: number;
  message: string;
  type: TimelineValidationIssueType;
};

export type TimelineValidationReport = {
  invalidEvents: number;
  issues: TimelineValidationIssue[];
  missingPositions: number;
  negativePositions: number;
  sameKillerVictim: number;
  valid: boolean;
};

const hasMissingNumber = (value: number | undefined) => typeof value !== "number" || !Number.isFinite(value);

export const validateTimeline = (timelineEvents: MatchTimelineEvent[]): TimelineValidationReport => {
  const issues: TimelineValidationIssue[] = [];

  timelineEvents.forEach((event, eventIndex) => {
    if (hasMissingNumber(event.timestamp)) {
      issues.push({
        eventIndex,
        message: "Timeline event is missing timestamp.",
        type: "missing_timestamp",
      });
    }

    if (!event.eventType) {
      issues.push({
        eventIndex,
        message: "Timeline event is missing eventType.",
        type: "missing_event_type",
      });
    }

    if (hasMissingNumber(event.positionX) || hasMissingNumber(event.positionY)) {
      issues.push({
        eventIndex,
        message: "Timeline event is missing positionX or positionY.",
        type: "missing_position",
      });
      return;
    }

    if (event.positionX < 0 || event.positionY < 0) {
      issues.push({
        eventIndex,
        message: "Timeline event position must not be negative.",
        type: "negative_position",
      });
    }

    if (event.killer && event.victim && event.killer === event.victim) {
      issues.push({
        eventIndex,
        message: "Timeline event killer and victim must not be the same player.",
        type: "same_killer_victim",
      });
    }
  });

  return {
    invalidEvents: issues.length,
    issues,
    missingPositions: issues.filter((issue) => issue.type === "missing_position").length,
    negativePositions: issues.filter((issue) => issue.type === "negative_position").length,
    sameKillerVictim: issues.filter((issue) => issue.type === "same_killer_victim").length,
    valid: issues.length === 0,
  };
};
