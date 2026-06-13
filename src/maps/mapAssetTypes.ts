import type { ValorantMap } from "./mapTypes";

export type MapAsset = {
  map: ValorantMap;
  width: number;
  height: number;
  backgroundType: "image" | "placeholder";
  dataUrl?: string;
  flipX?: boolean;
  flipY?: boolean;
  rotateDeg?: 0 | 90 | 180 | 270;
};

export type StoredMapAsset = {
  map: ValorantMap;
  dataUrl: string;
  width: number;
  height: number;
  flipX: boolean;
  flipY: boolean;
  rotateDeg: 0 | 90 | 180 | 270;
};
