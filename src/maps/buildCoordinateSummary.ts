import type { MatchTimelineEvent } from "../timeline/types";
import { validateTimelineCoordinates } from "./validateCoordinates";

export type CoordinateSummary = {
  totalEvents: number;
  validCoordinates: number;
  invalidCoordinates: number;
};

export const buildCoordinateSummary = (
  timelineEvents: MatchTimelineEvent[],
  matchMapById: Map<string, string>,
): CoordinateSummary => {
  const validation = validateTimelineCoordinates(timelineEvents, matchMapById);
  const validCoordinates = validation.filter((result) => result.valid).length;

  return {
    invalidCoordinates: validation.length - validCoordinates,
    totalEvents: timelineEvents.length,
    validCoordinates,
  };
};
