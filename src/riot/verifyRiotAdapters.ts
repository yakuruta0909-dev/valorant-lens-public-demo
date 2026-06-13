import type { Match, PlayerMatchStats, WeaponStat } from "../types";

export type RiotAdapterVerificationIssue = {
  entity: "match" | "playerStats" | "weaponStats";
  id?: string;
  message: string;
};

export type RiotAdapterVerificationResult = {
  issues: RiotAdapterVerificationIssue[];
  valid: boolean;
};

const isMissingString = (value: string | undefined) => !value || value.trim().length === 0;
const isInvalidNumber = (value: number) => !Number.isFinite(value);

export const verifyRiotAdapters = ({
  matches,
  playerStats,
  weaponStats,
}: {
  matches: Match[];
  playerStats: PlayerMatchStats[];
  weaponStats: WeaponStat[];
}): RiotAdapterVerificationResult => {
  const issues: RiotAdapterVerificationIssue[] = [];

  matches.forEach((match) => {
    if (isMissingString(match.matchId)) {
      issues.push({ entity: "match", message: "Match is missing matchId." });
    }

    if (isMissingString(match.playedAt) || isMissingString(match.map)) {
      issues.push({ entity: "match", id: match.matchId, message: "Match is missing playedAt or map." });
    }
  });

  playerStats.forEach((stats) => {
    if (isMissingString(stats.matchId) || isMissingString(stats.playerPuuid) || isMissingString(stats.agent)) {
      issues.push({
        entity: "playerStats",
        id: stats.matchId,
        message: "Player stats are missing matchId, playerPuuid, or agent.",
      });
    }

    if ([stats.kills, stats.deaths, stats.assists, stats.acs].some(isInvalidNumber)) {
      issues.push({ entity: "playerStats", id: stats.matchId, message: "Player stats contain invalid numbers." });
    }
  });

  weaponStats.forEach((stats) => {
    if (isMissingString(stats.matchId) || isMissingString(stats.weapon)) {
      issues.push({
        entity: "weaponStats",
        id: stats.matchId,
        message: "Weapon stats are missing matchId or weapon.",
      });
    }

    if ([stats.kills, stats.headshots, stats.bodyshots, stats.legshots].some(isInvalidNumber)) {
      issues.push({ entity: "weaponStats", id: stats.matchId, message: "Weapon stats contain invalid numbers." });
    }
  });

  return {
    issues,
    valid: issues.length === 0,
  };
};
