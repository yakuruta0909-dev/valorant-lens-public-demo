export type ValorantMap =
  | "Ascent"
  | "Bind"
  | "Haven"
  | "Split"
  | "Icebox"
  | "Breeze"
  | "Fracture"
  | "Pearl"
  | "Lotus"
  | "Sunset";

export type MapMetadata = {
  name: ValorantMap;
  worldMinX: number;
  worldMaxX: number;
  worldMinY: number;
  worldMaxY: number;
  imageWidth: number;
  imageHeight: number;
};

export type Coordinate = {
  x: number;
  y: number;
};
