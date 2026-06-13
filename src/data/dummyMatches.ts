import type { Match, PlayerMatchStats } from "../types";

export const PLAYER_PUUID = "dummy-player-valorant-improvement-analyzer";

export const AGENTS = ["Jett", "Omen", "Raze", "Killjoy", "Sova", "Cypher"];

export const MAPS = ["Ascent", "Bind", "Haven", "Split", "Lotus", "Sunset"];

const competitiveRows = [
  ["2026-01-03", "Ascent", "Jett", 0, 23, 17, 4, 247, 18, 44, 7, 1520],
  ["2026-01-05", "Bind", "Sova", 1, 15, 13, 9, 201, 12, 38, 6, 1450],
  ["2026-01-11", "Haven", "Omen", 0, 18, 19, 7, 214, 14, 41, 8, 1495],
  ["2026-01-18", "Split", "Killjoy", 1, 17, 11, 6, 221, 13, 35, 5, 1510],
  ["2026-01-24", "Lotus", "Raze", 1, 25, 16, 3, 272, 19, 48, 8, 1548],
  ["2026-02-01", "Sunset", "Cypher", 0, 12, 15, 8, 178, 8, 34, 5, 1508],
  ["2026-02-08", "Ascent", "Jett", 1, 26, 18, 5, 286, 21, 46, 8, 1562],
  ["2026-02-12", "Bind", "Sova", 1, 19, 14, 10, 232, 16, 43, 6, 1532],
  ["2026-02-21", "Haven", "Omen", 0, 16, 18, 11, 205, 12, 40, 9, 1555],
  ["2026-03-02", "Split", "Killjoy", 1, 21, 12, 4, 241, 17, 38, 6, 1588],
  ["2026-03-07", "Lotus", "Raze", 0, 20, 19, 5, 235, 15, 45, 7, 1604],
  ["2026-03-15", "Sunset", "Cypher", 1, 18, 10, 12, 227, 14, 36, 5, 1591],
  ["2026-03-22", "Ascent", "Jett", 1, 29, 15, 4, 309, 25, 50, 7, 1620],
  ["2026-04-02", "Bind", "Sova", 0, 17, 16, 8, 216, 13, 42, 6, 1632],
  ["2026-04-09", "Haven", "Omen", 1, 21, 15, 13, 248, 16, 44, 5, 1655],
  ["2026-04-16", "Split", "Killjoy", 1, 19, 13, 7, 234, 15, 39, 5, 1661],
  ["2026-04-23", "Lotus", "Raze", 1, 27, 17, 4, 294, 22, 47, 8, 1674],
  ["2026-05-04", "Sunset", "Cypher", 0, 14, 17, 9, 190, 10, 37, 7, 1668],
  ["2026-05-10", "Ascent", "Jett", 1, 31, 16, 5, 324, 26, 53, 7, 1702],
  ["2026-05-17", "Bind", "Sova", 1, 22, 13, 11, 261, 18, 43, 5, 1715],
  ["2026-05-25", "Haven", "Omen", 1, 24, 14, 10, 276, 20, 42, 5, 1724],
  ["2026-06-03", "Split", "Killjoy", 0, 18, 15, 6, 226, 14, 40, 6, 1732],
  ["2026-06-07", "Lotus", "Raze", 1, 30, 18, 6, 318, 24, 52, 9, 1756],
] as const;

const practiceRows = [
  ["2026-01-02", "Deathmatch", "Ascent", "Jett", 34, 26, 0, 0, 24, 42, 8],
  ["2026-01-04", "Team Deathmatch", "District", "Sova", 28, 20, 7, 0, 18, 39, 5],
  ["2026-01-14", "Deathmatch", "Bind", "Raze", 31, 28, 0, 0, 19, 44, 7],
  ["2026-01-21", "Team Deathmatch", "Kasbah", "Omen", 24, 19, 8, 0, 15, 36, 6],
  ["2026-02-03", "Deathmatch", "Haven", "Jett", 37, 24, 0, 0, 27, 41, 7],
  ["2026-02-05", "Deathmatch", "Ascent", "Jett", 40, 23, 0, 0, 31, 39, 5],
  ["2026-02-10", "Team Deathmatch", "Piazza", "Sova", 29, 21, 10, 0, 20, 35, 6],
  ["2026-02-19", "Deathmatch", "Split", "Raze", 33, 26, 0, 0, 23, 40, 8],
  ["2026-03-01", "Deathmatch", "Lotus", "Jett", 38, 24, 0, 0, 30, 39, 6],
  ["2026-03-04", "Team Deathmatch", "District", "Killjoy", 25, 18, 9, 0, 16, 34, 7],
  ["2026-03-10", "Deathmatch", "Bind", "Raze", 35, 27, 0, 0, 25, 41, 6],
  ["2026-03-18", "Team Deathmatch", "Kasbah", "Omen", 31, 22, 11, 0, 21, 38, 5],
  ["2026-03-27", "Deathmatch", "Sunset", "Cypher", 36, 25, 0, 0, 26, 40, 7],
  ["2026-04-01", "Deathmatch", "Ascent", "Jett", 42, 23, 0, 0, 34, 37, 5],
  ["2026-04-05", "Team Deathmatch", "Piazza", "Sova", 33, 20, 12, 0, 24, 35, 4],
  ["2026-04-14", "Deathmatch", "Haven", "Omen", 39, 24, 0, 0, 30, 38, 6],
  ["2026-04-21", "Team Deathmatch", "District", "Raze", 34, 21, 8, 0, 25, 36, 5],
  ["2026-04-27", "Deathmatch", "Lotus", "Raze", 44, 22, 0, 0, 36, 34, 5],
  ["2026-05-02", "Deathmatch", "Ascent", "Jett", 46, 20, 0, 0, 38, 33, 4],
  ["2026-05-05", "Team Deathmatch", "Kasbah", "Killjoy", 32, 19, 13, 0, 23, 35, 5],
  ["2026-05-13", "Deathmatch", "Bind", "Sova", 41, 22, 0, 0, 33, 36, 4],
  ["2026-05-20", "Team Deathmatch", "Piazza", "Omen", 35, 20, 12, 0, 27, 33, 5],
  ["2026-05-28", "Deathmatch", "Haven", "Jett", 45, 21, 0, 0, 37, 33, 3],
  ["2026-06-01", "Team Deathmatch", "District", "Raze", 38, 22, 10, 0, 30, 34, 4],
  ["2026-06-05", "Deathmatch", "Lotus", "Raze", 48, 22, 0, 0, 40, 32, 4],
  ["2026-06-09", "Deathmatch", "Ascent", "Jett", 47, 20, 0, 0, 41, 30, 3],
] as const;

export const matches: Match[] = [
  ...competitiveRows.map(
    ([playedAt, map, , , , , , , , , , averageRating], index): Match => ({
      matchId: `comp-${index + 1}`,
      playedAt,
      mode: "Competitive",
      map,
      averageRating,
    }),
  ),
  ...practiceRows.map(
    ([playedAt, mode, map], index): Match => ({
      matchId: `practice-${index + 1}`,
      playedAt,
      mode,
      map,
      averageRating: 0,
    }),
  ),
];

export const playerMatchStats: PlayerMatchStats[] = [
  ...competitiveRows.map(
    (
      [
        ,
        ,
        agent,
        win,
        kills,
        deaths,
        assists,
        acs,
        headshots,
        bodyshots,
        legshots,
      ],
      index,
    ): PlayerMatchStats => ({
      matchId: `comp-${index + 1}`,
      playerPuuid: PLAYER_PUUID,
      agent,
      win: Boolean(win),
      kills,
      deaths,
      assists,
      acs,
      headshots,
      bodyshots,
      legshots,
    }),
  ),
  ...practiceRows.map(
    (
      [
        ,
        ,
        ,
        agent,
        kills,
        deaths,
        assists,
        acs,
        headshots,
        bodyshots,
        legshots,
      ],
      index,
    ): PlayerMatchStats => ({
      matchId: `practice-${index + 1}`,
      playerPuuid: PLAYER_PUUID,
      agent,
      win: false,
      kills,
      deaths,
      assists,
      acs,
      headshots,
      bodyshots,
      legshots,
    }),
  ),
];
