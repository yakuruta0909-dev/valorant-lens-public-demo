import type { ConflictResolutionMode } from "./conflictResolutionTypes";

export type SyncPreview = {
  accountPuuid: string;
  addCount: number;
  duplicateCount: number;
  generatedAt: string;
  incomingMatchIds: string[];
  readyToSync: boolean;
  resolutionMode: ConflictResolutionMode;
  skippedMatchIds: string[];
  syncMode: "incremental" | "full";
  targetMatchIds: string[];
  updateCount: number;
};

export type GenerateSyncPreviewResult = {
  error?: string;
  preview: SyncPreview;
};
