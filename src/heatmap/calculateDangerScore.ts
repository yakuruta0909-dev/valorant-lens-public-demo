export const calculateDangerScore = ({
  deathCount,
  maxDeathCount,
}: {
  deathCount: number;
  maxDeathCount: number;
}) => {
  if (maxDeathCount <= 0) {
    return 0;
  }

  return deathCount / maxDeathCount;
};
