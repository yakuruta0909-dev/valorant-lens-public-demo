import type { Match, MatchMode, PlayerMatchStats, WeaponStat } from "../../types";
import type { RawRiotMatch, RawRiotPlayer, RawRiotWeapon } from "../types";
import { mapRiotWeaponName } from "../mappings/weaponMapping";

const normalizeMode = (mode: RawRiotMatch["mode"]): MatchMode => {
  const normalizedMode = String(mode).trim().toLowerCase();

  if (normalizedMode === "deathmatch" || normalizedMode === "dm") {
    return "Deathmatch";
  }

  if (normalizedMode === "team deathmatch" || normalizedMode === "tdm") {
    return "Team Deathmatch";
  }

  return "Competitive";
};

const resolvePlayerWin = (rawMatch: RawRiotMatch, rawPlayer: RawRiotPlayer) => {
  if (typeof rawPlayer.win === "boolean") {
    return rawPlayer.win;
  }

  const team = rawMatch.teams?.find((rawTeam) => rawTeam.teamId === rawPlayer.teamId);
  return team?.won ?? false;
};

export const adaptRiotMatch = (rawMatch: RawRiotMatch): Match => {
  return {
    averageRating: rawMatch.averageRating ?? 0,
    map: rawMatch.map,
    matchId: rawMatch.matchId,
    mode: normalizeMode(rawMatch.mode),
    playedAt: rawMatch.playedAt,
  };
};

export const adaptRiotPlayerStats = (
  rawMatch: RawRiotMatch,
  rawPlayer: RawRiotPlayer,
): PlayerMatchStats => {
  return {
    acs: rawPlayer.acs ?? 0,
    agent: rawPlayer.agent,
    assists: rawPlayer.assists,
    bodyshots: rawPlayer.bodyshots,
    deaths: rawPlayer.deaths,
    headshots: rawPlayer.headshots,
    kills: rawPlayer.kills,
    legshots: rawPlayer.legshots,
    matchId: rawMatch.matchId,
    playerPuuid: rawPlayer.puuid,
    win: resolvePlayerWin(rawMatch, rawPlayer),
  };
};

export const adaptRiotWeaponStat = (rawMatch: RawRiotMatch, rawWeapon: RawRiotWeapon): WeaponStat => {
  return {
    bodyshots: rawWeapon.bodyshots,
    headshots: rawWeapon.headshots,
    kills: rawWeapon.kills,
    legshots: rawWeapon.legshots,
    matchId: rawWeapon.matchId ?? rawMatch.matchId,
    weapon: mapRiotWeaponName(rawWeapon.weaponName),
  };
};

export const adaptRiotMatchBundle = (rawMatch: RawRiotMatch) => {
  return {
    match: adaptRiotMatch(rawMatch),
    playerStats: rawMatch.players.map((rawPlayer) => adaptRiotPlayerStats(rawMatch, rawPlayer)),
    weaponStats: (rawMatch.weapons ?? []).map((rawWeapon) => adaptRiotWeaponStat(rawMatch, rawWeapon)),
  };
};
