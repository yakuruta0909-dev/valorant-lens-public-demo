export const RIOT_WEAPON_MAPPING = {
  Ares: "Ares",
  Bucky: "Bucky",
  Bulldog: "Bulldog",
  Classic: "Classic",
  Frenzy: "Frenzy",
  Ghost: "Ghost",
  Guardian: "Guardian",
  Judge: "Judge",
  Marshal: "Marshal",
  Odin: "Odin",
  Operator: "Operator",
  Phantom: "Phantom",
  Sheriff: "Sheriff",
  Shorty: "Shorty",
  Spectre: "Spectre",
  Stinger: "Stinger",
  Vandal: "Vandal",
} as const;

export type RiotWeaponName = keyof typeof RIOT_WEAPON_MAPPING;

const normalizedWeaponEntries = Object.entries(RIOT_WEAPON_MAPPING).map(([riotName, internalName]) => [
  riotName.toLowerCase(),
  internalName,
]);

export const mapRiotWeaponName = (weaponName: string) => {
  const normalizedName = weaponName.trim().toLowerCase();
  const mappedWeapon = normalizedWeaponEntries.find(([riotName]) => riotName === normalizedName)?.[1];

  return mappedWeapon ?? weaponName;
};
