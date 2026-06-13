import type { MatchTimelineEvent } from "../timeline/types";
import type { HeatmapFilters } from "./heatmapTypes";

const resolveMapName = (event: MatchTimelineEvent, matchMapById: Map<string, string>) =>
  event.map ?? matchMapById.get(event.matchId ?? "");

export const filterHeatmapTimelineEvents = (
  timelineEvents: MatchTimelineEvent[],
  filters: HeatmapFilters,
  matchMapById: Map<string, string>,
) =>
  timelineEvents.filter((event) => {
    if (filters.agent !== "All" && event.agent !== filters.agent) {
      return false;
    }

    if (filters.eventType !== "All" && event.eventType !== filters.eventType) {
      return false;
    }

    if (filters.map !== "All" && resolveMapName(event, matchMapById) !== filters.map) {
      return false;
    }

    if (filters.weapon !== "All" && event.weapon !== filters.weapon) {
      return false;
    }

    if (filters.team !== "All" && event.team !== filters.team) {
      return false;
    }

    if (filters.ownership === "playerOnly" && !event.isPlayerEvent) {
      return false;
    }

    return true;
  });
