import type { MatchSyncData } from "./matchSyncTypes";

export type ConflictAction = "add" | "update" | "duplicate";

export type ConflictResolutionMode = "skip" | "overwrite" | "merge";

export type ConflictPreviewRow = {
  action: ConflictAction;
  existing: boolean;
  incomingCount: number;
  matchId: string;
  reason: string;
};

export type ConflictPreviewSummary = {
  addCount: number;
  duplicateCount: number;
  totalIncoming: number;
  updateCount: number;
};

export type ConflictResolutionState = {
  appliedAt: string | null;
  conflicts: ConflictPreviewRow[];
  generatedAt: string | null;
  resolutionMode: ConflictResolutionMode;
  summary: ConflictPreviewSummary;
};

export type BuildConflictPreviewInput = {
  existingData: MatchSyncData;
  generatedAt?: string;
  incomingData: MatchSyncData;
  resolutionMode: ConflictResolutionMode;
};

export type ApplyConflictResolutionInput = {
  existingData: MatchSyncData;
  incomingData: MatchSyncData;
  preview: ConflictResolutionState;
};
