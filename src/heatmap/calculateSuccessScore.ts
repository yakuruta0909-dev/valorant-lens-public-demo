export const calculateSuccessScore = ({
  killCount,
  maxKillCount,
}: {
  killCount: number;
  maxKillCount: number;
}) => {
  if (maxKillCount <= 0) {
    return 0;
  }

  return killCount / maxKillCount;
};
