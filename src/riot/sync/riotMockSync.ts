import type { Match, PlayerMatchStats, WeaponStat } from "../../types";
import type { MatchTimelineEvent } from "../../timeline/types";
import { adaptRiotMatch, adaptRiotPlayerStats, adaptRiotWeaponStat } from "../adapters/riotMatchAdapter";
import { MOCK_RIOT_ACCOUNT } from "../mock/mockAccount";
import { mockRiotMatches } from "../mock/mockMatches";
import { verifyRiotAdapters, type RiotAdapterVerificationResult } from "../verifyRiotAdapters";

export type RiotMockSyncResult = {
  matches: Match[];
  playerStats: PlayerMatchStats[];
  timelineEvents: MatchTimelineEvent[];
  verification: RiotAdapterVerificationResult;
  weaponStats: WeaponStat[];
};

export const runRiotMockSync = (): RiotMockSyncResult => {
  const matches = mockRiotMatches.map(adaptRiotMatch);
  const playerStats = mockRiotMatches.flatMap((rawMatch) =>
    rawMatch.players
      .filter((rawPlayer) => rawPlayer.puuid === MOCK_RIOT_ACCOUNT.puuid)
      .map((rawPlayer) => adaptRiotPlayerStats(rawMatch, rawPlayer)),
  );
  const weaponStats = mockRiotMatches.flatMap((rawMatch) =>
    (rawMatch.weapons ?? [])
      .filter((rawWeapon) => !rawWeapon.puuid || rawWeapon.puuid === MOCK_RIOT_ACCOUNT.puuid)
      .map((rawWeapon) => adaptRiotWeaponStat(rawMatch, rawWeapon)),
  );
  const timelineEvents = mockRiotMatches.flatMap((rawMatch) =>
    (rawMatch.timeline ?? []).map((event) => {
      const playerAgent = rawMatch.players.find((rawPlayer) => rawPlayer.puuid === MOCK_RIOT_ACCOUNT.puuid)?.agent;

      return {
        ...event,
        agent: event.agent ?? playerAgent,
        map: event.map ?? rawMatch.map,
        matchId: event.matchId ?? rawMatch.matchId,
      };
    }),
  );
  const verification = verifyRiotAdapters({ matches, playerStats, weaponStats });

  return {
    matches,
    playerStats,
    timelineEvents,
    verification,
    weaponStats,
  };
};
