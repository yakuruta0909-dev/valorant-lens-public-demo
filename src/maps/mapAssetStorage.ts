import type { StoredMapAsset } from "./mapAssetTypes";
import type { ValorantMap } from "./mapTypes";

const storageKey = "valorant-improvement-analyzer-map-assets";

type StoredMapAssetState = {
  assets: StoredMapAsset[];
};

const emptyState: StoredMapAssetState = {
  assets: [],
};

export const getMapAssetStorageKey = () => storageKey;

export const loadStoredMapAssets = (): StoredMapAssetState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return emptyState;
    }

    const parsedValue = JSON.parse(rawValue) as StoredMapAssetState;
    return {
      assets: Array.isArray(parsedValue.assets) ? parsedValue.assets : [],
    };
  } catch {
    return emptyState;
  }
};

export const loadStoredMapAsset = (map: ValorantMap): StoredMapAsset | undefined =>
  loadStoredMapAssets().assets.find((asset) => asset.map === map);

export const saveStoredMapAsset = (asset: StoredMapAsset): StoredMapAssetState => {
  const currentState = loadStoredMapAssets();
  const nextState = {
    assets: [...currentState.assets.filter((currentAsset) => currentAsset.map !== asset.map), asset],
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
};

export const resetStoredMapAsset = (map: ValorantMap): StoredMapAssetState => {
  const currentState = loadStoredMapAssets();
  const nextState = {
    assets: currentState.assets.filter((asset) => asset.map !== map),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
};
