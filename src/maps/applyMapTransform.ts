import type { MapAsset } from "./mapAssetTypes";
import type { Coordinate } from "./mapTypes";

const rotateCoordinate = ({
  coordinate,
  height,
  rotateDeg,
  width,
}: {
  coordinate: Coordinate;
  height: number;
  rotateDeg: MapAsset["rotateDeg"];
  width: number;
}): Coordinate => {
  if (rotateDeg === 90) {
    return {
      x: height - coordinate.y,
      y: coordinate.x,
    };
  }

  if (rotateDeg === 180) {
    return {
      x: width - coordinate.x,
      y: height - coordinate.y,
    };
  }

  if (rotateDeg === 270) {
    return {
      x: coordinate.y,
      y: width - coordinate.x,
    };
  }

  return coordinate;
};

export const applyMapTransform = ({
  asset,
  coordinate,
}: {
  asset: MapAsset;
  coordinate: Coordinate;
}): Coordinate => {
  const flipped = {
    x: asset.flipX ? asset.width - coordinate.x : coordinate.x,
    y: asset.flipY ? asset.height - coordinate.y : coordinate.y,
  };

  return rotateCoordinate({
    coordinate: flipped,
    height: asset.height,
    rotateDeg: asset.rotateDeg ?? 0,
    width: asset.width,
  });
};
