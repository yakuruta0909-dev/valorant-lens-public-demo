export type FailedMatchDetail = {
  matchId: string;
  statusCode: number;
  errorMessage: string;
  retryCount: number;
};

export type MatchSyncReview = {
  totalMatchIds: number;
  successfulDetails: number;
  failedDetails: number;
  partialFailure: boolean;
  successRate: number;
};

export type MatchSyncReviewStorageState = {
  failedMatches: FailedMatchDetail[];
  lastReview: string | null;
  review: MatchSyncReview;
};
