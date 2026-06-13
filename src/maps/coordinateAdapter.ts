import type { Coordinate, MapMetadata } from "./mapTypes";

export const normalizeCoordinate = ({
  metadata,
  worldX,
  worldY,
}: {
  metadata: MapMetadata;
  worldX: number;
  worldY: number;
}): Coordinate => {
  const xRange = metadata.worldMaxX - metadata.worldMinX;
  const yRange = metadata.worldMaxY - metadata.worldMinY;

  return {
    x: (worldX - metadata.worldMinX) / xRange,
    y: (worldY - metadata.worldMinY) / yRange,
  };
};

export const convertToScreenCoordinate = ({
  metadata,
  normalized,
}: {
  metadata: MapMetadata;
  normalized: Coordinate;
}): Coordinate => ({
  x: normalized.x * metadata.imageWidth,
  y: normalized.y * metadata.imageHeight,
});
