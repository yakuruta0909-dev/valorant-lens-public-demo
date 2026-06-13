import type { Match } from "../types";

export type DuplicateMatchReport = {
  duplicateMatchIds: string[];
  duplicateRows: number;
};

export const checkDuplicateMatches = (matches: Match[]): DuplicateMatchReport => {
  const seenMatchIds = new Set<string>();
  const duplicateMatchIds = new Set<string>();
  let duplicateRows = 0;

  matches.forEach((match) => {
    if (seenMatchIds.has(match.matchId)) {
      duplicateMatchIds.add(match.matchId);
      duplicateRows += 1;
      return;
    }

    seenMatchIds.add(match.matchId);
  });

  return {
    duplicateMatchIds: Array.from(duplicateMatchIds).sort(),
    duplicateRows,
  };
};
