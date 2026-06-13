import type { MapMetadata, ValorantMap } from "./mapTypes";

const createPlaceholderMetadata = (name: ValorantMap): MapMetadata => ({
  imageHeight: 1024,
  imageWidth: 1024,
  name,
  worldMaxX: 10000,
  worldMaxY: 10000,
  worldMinX: 0,
  worldMinY: 0,
});

export const VALORANT_MAPS: ValorantMap[] = [
  "Ascent",
  "Bind",
  "Haven",
  "Split",
  "Icebox",
  "Breeze",
  "Fracture",
  "Pearl",
  "Lotus",
  "Sunset",
];

export const MAP_METADATA: Record<ValorantMap, MapMetadata> = VALORANT_MAPS.reduce(
  (metadata, map) => ({
    ...metadata,
    [map]: createPlaceholderMetadata(map),
  }),
  {} as Record<ValorantMap, MapMetadata>,
);

export const isValorantMap = (map: string | undefined): map is ValorantMap =>
  Boolean(map && map in MAP_METADATA);

export const getMapMetadata = (map: string | undefined): MapMetadata | undefined => {
  if (!isValorantMap(map)) {
    return undefined;
  }

  return MAP_METADATA[map];
};
