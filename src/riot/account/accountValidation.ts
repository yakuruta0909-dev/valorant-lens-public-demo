export const validateRiotAccountLookup = ({
  gameName,
  tagLine,
}: {
  gameName: string;
  tagLine: string;
}) => {
  const errors: string[] = [];

  if (!gameName.trim()) {
    errors.push("Game Name is required.");
  }

  if (!tagLine.trim()) {
    errors.push("Tag is required.");
  }

  return {
    errors,
    valid: errors.length === 0,
  };
};
