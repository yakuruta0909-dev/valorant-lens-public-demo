import type { BuildConflictPreviewInput, ConflictPreviewRow, ConflictResolutionState } from "./conflictResolutionTypes";

export const buildConflictPreview = ({
  existingData,
  generatedAt = new Date().toISOString(),
  incomingData,
  resolutionMode,
}: BuildConflictPreviewInput): ConflictResolutionState => {
  const existingMatchIds = new Set(existingData.matches.map((match) => match.matchId));
  const incomingCounts = incomingData.matches.reduce((counts, match) => {
    counts.set(match.matchId, (counts.get(match.matchId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  const conflicts: ConflictPreviewRow[] = Array.from(incomingCounts.entries()).map(([matchId, incomingCount]) => {
    const existing = existingMatchIds.has(matchId);

    if (incomingCount > 1) {
      return {
        action: "duplicate",
        existing,
        incomingCount,
        matchId,
        reason: "Incoming matchId appears multiple times and will be normalized to one record.",
      };
    }

    if (existing) {
      return {
        action: "update",
        existing,
        incomingCount,
        matchId,
        reason: "Incoming matchId already exists in saved Riot sync data.",
      };
    }

    return {
      action: "add",
      existing,
      incomingCount,
      matchId,
      reason: "Incoming matchId is new.",
    };
  });

  return {
    appliedAt: null,
    conflicts,
    generatedAt,
    resolutionMode,
    summary: {
      addCount: conflicts.filter((conflict) => conflict.action === "add").length,
      duplicateCount: conflicts.filter((conflict) => conflict.action === "duplicate").length,
      totalIncoming: incomingData.matches.length,
      updateCount: conflicts.filter((conflict) => conflict.action === "update").length,
    },
  };
};
