import type { FailedMatchDetail, MatchSyncReview } from "./matchSyncReviewTypes";

export const buildMatchSyncReview = ({
  failedMatches,
  successfulDetails,
  totalMatchIds,
}: {
  failedMatches: FailedMatchDetail[];
  successfulDetails: number;
  totalMatchIds: number;
}): MatchSyncReview => {
  const failedDetails = failedMatches.length;

  return {
    failedDetails,
    partialFailure: failedDetails > 0 && successfulDetails > 0,
    successRate: totalMatchIds === 0 ? 0 : successfulDetails / totalMatchIds,
    successfulDetails,
    totalMatchIds,
  };
};
