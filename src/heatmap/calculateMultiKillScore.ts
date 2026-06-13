export const calculateMultiKillScore = ({
  maxMultiKillCount,
  multiKillCount,
}: {
  maxMultiKillCount: number;
  multiKillCount: number;
}) => {
  if (maxMultiKillCount <= 0) {
    return 0;
  }

  return multiKillCount / maxMultiKillCount;
};
