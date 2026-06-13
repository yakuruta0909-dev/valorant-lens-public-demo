import { VALORANT_MAPS } from "./mapMetadata";
import type { MapAsset } from "./mapAssetTypes";
import { loadStoredMapAsset } from "./mapAssetStorage";
import type { ValorantMap } from "./mapTypes";

const createPlaceholderAsset = (map: ValorantMap): MapAsset => ({
  backgroundType: "placeholder",
  flipX: false,
  flipY: false,
  height: 1024,
  map,
  rotateDeg: 0,
  width: 1024,
});

export const MAP_ASSET_REGISTRY: Record<ValorantMap, MapAsset> = VALORANT_MAPS.reduce(
  (assets, map) => ({
    ...assets,
    [map]: createPlaceholderAsset(map),
  }),
  {} as Record<ValorantMap, MapAsset>,
);

export const getMapAsset = (map: string | undefined): MapAsset | undefined => {
  if (!map || !(map in MAP_ASSET_REGISTRY)) {
    return undefined;
  }

  const valorantMap = map as ValorantMap;
  const storedAsset = loadStoredMapAsset(valorantMap);

  if (!storedAsset) {
    return MAP_ASSET_REGISTRY[valorantMap];
  }

  return {
    backgroundType: "image",
    dataUrl: storedAsset.dataUrl,
    flipX: storedAsset.flipX,
    flipY: storedAsset.flipY,
    height: storedAsset.height,
    map: storedAsset.map,
    rotateDeg: storedAsset.rotateDeg,
    width: storedAsset.width,
  };
};
