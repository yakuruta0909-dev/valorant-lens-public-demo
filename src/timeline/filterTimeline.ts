import type { MatchTimelineEvent, TimelineEventType } from "./types";

export type TimelineFilters = {
  eventTypes: TimelineEventType[];
  map: string;
  matchId: string;
  playerQuery: string;
  searchQuery: string;
  weapon: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const filterTimeline = (
  timelineEvents: MatchTimelineEvent[],
  filters: TimelineFilters,
  matchMapById = new Map<string, string>(),
) => {
  const playerQuery = normalize(filters.playerQuery);
  const searchQuery = normalize(filters.searchQuery);

  return timelineEvents.filter((event) => {
    if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.eventType as TimelineEventType)) {
      return false;
    }

    if (filters.weapon !== "All" && event.weapon !== filters.weapon) {
      return false;
    }

    if (filters.matchId !== "All" && event.matchId !== filters.matchId) {
      return false;
    }

    if (filters.map !== "All" && matchMapById.get(event.matchId ?? "") !== filters.map) {
      return false;
    }

    if (
      playerQuery &&
      !normalize(event.killer ?? "").includes(playerQuery) &&
      !normalize(event.victim ?? "").includes(playerQuery)
    ) {
      return false;
    }

    if (
      searchQuery &&
      !normalize(event.killer ?? "").includes(searchQuery) &&
      !normalize(event.victim ?? "").includes(searchQuery) &&
      !normalize(event.weapon ?? "").includes(searchQuery)
    ) {
      return false;
    }

    return true;
  });
};
