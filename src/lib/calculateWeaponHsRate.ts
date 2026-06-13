import type { WeaponStat } from "../types";

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const calculateWeaponHsRate = (
  stat: Pick<WeaponStat, "headshots" | "bodyshots" | "legshots">,
) => {
  const shots = stat.headshots + stat.bodyshots + stat.legshots;

  if (shots <= 0) {
    return 0;
  }

  return round((stat.headshots / shots) * 100);
};
