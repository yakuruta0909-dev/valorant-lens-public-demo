import type { CompareRow, SortDirection, SortKey } from "../types";

export const sortCompareRows = (
  rows: CompareRow[],
  sortKey: SortKey,
  direction: SortDirection,
): CompareRow[] => {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const difference = a[sortKey] - b[sortKey];

    if (difference !== 0) {
      return difference * directionMultiplier;
    }

    if (a.matches !== b.matches) {
      return b.matches - a.matches;
    }

    return a.label.localeCompare(b.label);
  });
};
