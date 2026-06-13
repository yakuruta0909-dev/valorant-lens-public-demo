import type { WeaponTrendKey } from "../lib/buildWeaponStats";
import { FilterGroup } from "./FilterGroup";

type WeaponFilterProps = {
  options: readonly WeaponTrendKey[];
  selectedWeapons: WeaponTrendKey[];
  onChange: (weapons: WeaponTrendKey[]) => void;
};

const weaponColors: Record<WeaponTrendKey, string> = {
  Overall: "#ff4655",
  Vandal: "#f59e0b",
  Phantom: "#38bdf8",
  Sheriff: "#e879f9",
  Guardian: "#a3e635",
  Operator: "#818cf8",
  Marshal: "#f97316",
};

export function WeaponFilter({ options, selectedWeapons, onChange }: WeaponFilterProps) {
  const toggleWeapon = (weapon: WeaponTrendKey) => {
    if (selectedWeapons.includes(weapon)) {
      const nextWeapons = selectedWeapons.filter((selectedWeapon) => selectedWeapon !== weapon);
      onChange(nextWeapons.length > 0 ? nextWeapons : selectedWeapons);
      return;
    }

    onChange([...selectedWeapons, weapon]);
  };

  return (
    <FilterGroup title="Weapon HS Lines">
      <div className="grid gap-2">
        {options.map((weapon) => {
          const active = selectedWeapons.includes(weapon);

          return (
            <label
              key={weapon}
              className={`flex min-h-10 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${
                active
                  ? "border-white/20 bg-white/[0.06] text-white"
                  : "border-white/10 bg-black/10 text-white/60 hover:border-white/20"
              }`}
            >
              <input
                checked={active}
                className="h-4 w-4 accent-valorant-red"
                type="checkbox"
                onChange={() => toggleWeapon(weapon)}
              />
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: weaponColors[weapon] }} />
              <span className="min-w-0 flex-1 leading-snug">{weapon}</span>
            </label>
          );
        })}
      </div>
    </FilterGroup>
  );
}

export const getWeaponColor = (weapon: WeaponTrendKey) => weaponColors[weapon];
