import type { MatchTimelineEvent, TimelineSummary } from "./types";

export const summarizeTimeline = (timelineEvents: MatchTimelineEvent[]): TimelineSummary => {
  const weapons = new Set<string>();
  const players = new Set<string>();

  timelineEvents.forEach((event) => {
    if (event.weapon) {
      weapons.add(event.weapon);
    }

    if (event.killer) {
      players.add(event.killer);
    }

    if (event.victim) {
      players.add(event.victim);
    }
  });

  return {
    assistEvents: timelineEvents.filter((event) => event.eventType === "assist").length,
    defuseEvents: timelineEvents.filter((event) => event.eventType === "defuse").length,
    deathEvents: timelineEvents.filter((event) => event.eventType === "death").length,
    killEvents: timelineEvents.filter((event) => event.eventType === "kill").length,
    plantEvents: timelineEvents.filter((event) => event.eventType === "plant").length,
    totalEvents: timelineEvents.length,
    uniquePlayers: players.size,
    uniqueWeapons: weapons.size,
  };
};
