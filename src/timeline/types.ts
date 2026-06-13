import type { MatchTimelineEvent as RiotMatchTimelineEvent } from "../riot/types";

export type TimelineEventType = "kill" | "death" | "assist" | "plant" | "defuse";

export type MatchTimelineEvent = RiotMatchTimelineEvent & {
  eventType: TimelineEventType | string;
};

export type TimelineSummary = {
  assistEvents: number;
  defuseEvents: number;
  deathEvents: number;
  killEvents: number;
  plantEvents: number;
  totalEvents: number;
  uniquePlayers: number;
  uniqueWeapons: number;
};
