import type { RawRiotMatch } from "./types";

export type RiotValidationIssueType = "missing_match_id" | "missing_player" | "missing_weapon";

export type RiotValidationIssue = {
  matchId?: string;
  message: string;
  type: RiotValidationIssueType;
};

export type RiotValidationReport = {
  invalidRows: number;
  issues: RiotValidationIssue[];
  missingMatchId: number;
  missingPlayer: number;
  missingWeapon: number;
  valid: boolean;
};

export const validateRiotData = (rawMatches: RawRiotMatch[]): RiotValidationReport => {
  const issues: RiotValidationIssue[] = [];

  rawMatches.forEach((rawMatch, index) => {
    if (!rawMatch.matchId) {
      issues.push({
        message: `Raw Riot match at index ${index} is missing matchId.`,
        type: "missing_match_id",
      });
    }

    if (rawMatch.players.length === 0) {
      issues.push({
        matchId: rawMatch.matchId,
        message: `Raw Riot match ${rawMatch.matchId || index} has no players.`,
        type: "missing_player",
      });
    }

    if (!rawMatch.weapons || rawMatch.weapons.length === 0) {
      issues.push({
        matchId: rawMatch.matchId,
        message: `Raw Riot match ${rawMatch.matchId || index} has no weapon records.`,
        type: "missing_weapon",
      });
    }
  });

  return {
    invalidRows: issues.length,
    issues,
    missingMatchId: issues.filter((issue) => issue.type === "missing_match_id").length,
    missingPlayer: issues.filter((issue) => issue.type === "missing_player").length,
    missingWeapon: issues.filter((issue) => issue.type === "missing_weapon").length,
    valid: issues.length === 0,
  };
};
