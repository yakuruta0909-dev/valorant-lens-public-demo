import type { MatchTimelineEvent, TimelineEventType } from "./types";

export type TimelineStatistics = {
  assistPercent: number;
  deathPercent: number;
  defusePercent: number;
  killPercent: number;
  plantPercent: number;
};

const round = (value: number) => Math.round(value * 10) / 10;

const percentOf = (count: number, total: number) => (total > 0 ? round((count / total) * 100) : 0);

export const buildTimelineStats = (timelineEvents: MatchTimelineEvent[]): TimelineStatistics => {
  const totalEvents = timelineEvents.length;
  const countByType = (eventType: TimelineEventType) =>
    timelineEvents.filter((event) => event.eventType === eventType).length;

  return {
    assistPercent: percentOf(countByType("assist"), totalEvents),
    deathPercent: percentOf(countByType("death"), totalEvents),
    defusePercent: percentOf(countByType("defuse"), totalEvents),
    killPercent: percentOf(countByType("kill"), totalEvents),
    plantPercent: percentOf(countByType("plant"), totalEvents),
  };
};
