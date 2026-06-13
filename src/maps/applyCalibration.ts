import type { Coordinate } from "./mapTypes";
import type { MapCalibration } from "./mapCalibrationTypes";

export const applyCalibration = ({
  calibration,
  coordinate,
  origin,
}: {
  calibration: MapCalibration;
  coordinate: Coordinate;
  origin: Coordinate;
}): Coordinate => {
  const radians = (calibration.rotation * Math.PI) / 180;
  const translatedX = coordinate.x - origin.x;
  const translatedY = coordinate.y - origin.y;
  const scaledX = translatedX * calibration.scale;
  const scaledY = translatedY * calibration.scale;
  const rotatedX = scaledX * Math.cos(radians) - scaledY * Math.sin(radians);
  const rotatedY = scaledX * Math.sin(radians) + scaledY * Math.cos(radians);

  return {
    x: rotatedX + origin.x + calibration.offsetX,
    y: rotatedY + origin.y + calibration.offsetY,
  };
};
