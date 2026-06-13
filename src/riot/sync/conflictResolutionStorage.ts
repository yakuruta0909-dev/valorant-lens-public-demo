import type {
  ConflictAction,
  ConflictPreviewRow,
  ConflictPreviewSummary,
  ConflictResolutionMode,
  ConflictResolutionState,
} from "./conflictResolutionTypes";

const CONFLICT_RESOLUTION_STORAGE_KEY = "valorant-improvement-analyzer-riot-conflict-preview";

const emptySummary: ConflictPreviewSummary = {
  addCount: 0,
  duplicateCount: 0,
  totalIncoming: 0,
  updateCount: 0,
};

export const DEFAULT_CONFLICT_RESOLUTION_STATE: ConflictResolutionState = {
  appliedAt: null,
  conflicts: [],
  generatedAt: null,
  resolutionMode: "merge",
  summary: emptySummary,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const canUseLocalStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const isConflictAction = (value: unknown): value is ConflictAction =>
  value === "add" || value === "update" || value === "duplicate";

const isResolutionMode = (value: unknown): value is ConflictResolutionMode =>
  value === "skip" || value === "overwrite" || value === "merge";

const sanitizeSummary = (value: unknown): ConflictPreviewSummary => {
  if (!isObject(value)) {
    return emptySummary;
  }

  return {
    addCount: typeof value.addCount === "number" ? value.addCount : 0,
    duplicateCount: typeof value.duplicateCount === "number" ? value.duplicateCount : 0,
    totalIncoming: typeof value.totalIncoming === "number" ? value.totalIncoming : 0,
    updateCount: typeof value.updateCount === "number" ? value.updateCount : 0,
  };
};

const sanitizeConflict = (value: unknown): ConflictPreviewRow | null => {
  if (!isObject(value) || !isConflictAction(value.action)) {
    return null;
  }

  if (
    typeof value.existing !== "boolean" ||
    typeof value.incomingCount !== "number" ||
    typeof value.matchId !== "string" ||
    typeof value.reason !== "string"
  ) {
    return null;
  }

  return {
    action: value.action,
    existing: value.existing,
    incomingCount: value.incomingCount,
    matchId: value.matchId,
    reason: value.reason,
  };
};

const sanitizeState = (value: unknown): ConflictResolutionState => {
  if (!isObject(value)) {
    return DEFAULT_CONFLICT_RESOLUTION_STATE;
  }

  return {
    appliedAt: typeof value.appliedAt === "string" ? value.appliedAt : null,
    conflicts: Array.isArray(value.conflicts)
      ? value.conflicts.map(sanitizeConflict).filter((conflict): conflict is ConflictPreviewRow => Boolean(conflict))
      : [],
    generatedAt: typeof value.generatedAt === "string" ? value.generatedAt : null,
    resolutionMode: isResolutionMode(value.resolutionMode)
      ? value.resolutionMode
      : DEFAULT_CONFLICT_RESOLUTION_STATE.resolutionMode,
    summary: sanitizeSummary(value.summary),
  };
};

export const getConflictResolutionStorageKey = () => CONFLICT_RESOLUTION_STORAGE_KEY;

export const loadConflictResolutionState = (): ConflictResolutionState => {
  if (!canUseLocalStorage()) {
    return DEFAULT_CONFLICT_RESOLUTION_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(CONFLICT_RESOLUTION_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_CONFLICT_RESOLUTION_STATE;
    }

    return sanitizeState(JSON.parse(rawValue) as unknown);
  } catch {
    return DEFAULT_CONFLICT_RESOLUTION_STATE;
  }
};

export const saveConflictResolutionState = (state: ConflictResolutionState): ConflictResolutionState => {
  const nextState = sanitizeState(state);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(CONFLICT_RESOLUTION_STORAGE_KEY, JSON.stringify(nextState));
  }

  return nextState;
};
