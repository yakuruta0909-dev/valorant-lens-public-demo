import type { ValorantMap } from "./mapTypes";

export type CalibrationPoint = {
  id: string;
  map: ValorantMap;
  x: number;
  y: number;
  label: string;
};

export type CalibrationPreviewPoint = {
  id: string;
  label: string;
  map: ValorantMap;
  beforeX: number;
  beforeY: number;
  afterX: number;
  afterY: number;
  deltaX: number;
  deltaY: number;
  offsetDistance: number;
};

export type CalibrationPreviewSummary = {
  averageOffset: number;
  largestOffset: number;
  totalTestPoints: number;
};
