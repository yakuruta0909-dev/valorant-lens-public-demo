import type { FailedMatchDetail, MatchSyncReview, MatchSyncReviewStorageState } from "./matchSyncReviewTypes";

const MATCH_SYNC_REVIEW_STORAGE_KEY = "valorant-improvement-analyzer-riot-match-sync-review";

const emptyReview: MatchSyncReview = {
  failedDetails: 0,
  partialFailure: false,
  successRate: 0,
  successfulDetails: 0,
  totalMatchIds: 0,
};

export const DEFAULT_MATCH_SYNC_REVIEW_STATE: MatchSyncReviewStorageState = {
  failedMatches: [],
  lastReview: null,
  review: emptyReview,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeFailedMatch = (value: unknown): FailedMatchDetail | null => {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.matchId !== "string" ||
    typeof value.statusCode !== "number" ||
    typeof value.errorMessage !== "string" ||
    typeof value.retryCount !== "number"
  ) {
    return null;
  }

  return {
    errorMessage: value.errorMessage,
    matchId: value.matchId,
    retryCount: value.retryCount,
    statusCode: value.statusCode,
  };
};

const sanitizeReview = (value: unknown): MatchSyncReview => {
  if (!isObject(value)) {
    return emptyReview;
  }

  return {
    failedDetails: typeof value.failedDetails === "number" ? value.failedDetails : 0,
    partialFailure: typeof value.partialFailure === "boolean" ? value.partialFailure : false,
    successRate: typeof value.successRate === "number" ? value.successRate : 0,
    successfulDetails: typeof value.successfulDetails === "number" ? value.successfulDetails : 0,
    totalMatchIds: typeof value.totalMatchIds === "number" ? value.totalMatchIds : 0,
  };
};

export const getMatchSyncReviewStorageKey = () => MATCH_SYNC_REVIEW_STORAGE_KEY;

export const loadMatchSyncReviewState = (): MatchSyncReviewStorageState => {
  if (typeof window === "undefined") {
    return DEFAULT_MATCH_SYNC_REVIEW_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(MATCH_SYNC_REVIEW_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_MATCH_SYNC_REVIEW_STATE;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isObject(parsedValue)) {
      return DEFAULT_MATCH_SYNC_REVIEW_STATE;
    }

    return {
      failedMatches: Array.isArray(parsedValue.failedMatches)
        ? parsedValue.failedMatches
            .map(sanitizeFailedMatch)
            .filter((failedMatch): failedMatch is FailedMatchDetail => Boolean(failedMatch))
        : [],
      lastReview: typeof parsedValue.lastReview === "string" ? parsedValue.lastReview : null,
      review: sanitizeReview(parsedValue.review),
    };
  } catch {
    return DEFAULT_MATCH_SYNC_REVIEW_STATE;
  }
};

export const saveMatchSyncReviewState = (state: MatchSyncReviewStorageState): MatchSyncReviewStorageState => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MATCH_SYNC_REVIEW_STORAGE_KEY, JSON.stringify(state));
  }

  return state;
};
