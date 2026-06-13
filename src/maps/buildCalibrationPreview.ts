import { applyCalibration } from "./applyCalibration";
import type {
  CalibrationPoint,
  CalibrationPreviewPoint,
  CalibrationPreviewSummary,
} from "./calibrationPointTypes";
import type { MapCalibration } from "./mapCalibrationTypes";

export const buildCalibrationPreview = ({
  calibration,
  points,
}: {
  calibration: MapCalibration;
  points: CalibrationPoint[];
}): {
  points: CalibrationPreviewPoint[];
  summary: CalibrationPreviewSummary;
} => {
  const previewPoints = points.map((point) => {
    const after = applyCalibration({
      calibration,
      coordinate: {
        x: point.x,
        y: point.y,
      },
      origin: {
        x: 512,
        y: 512,
      },
    });
    const deltaX = after.x - point.x;
    const deltaY = after.y - point.y;
    const offsetDistance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    return {
      afterX: after.x,
      afterY: after.y,
      beforeX: point.x,
      beforeY: point.y,
      deltaX,
      deltaY,
      id: point.id,
      label: point.label,
      map: point.map,
      offsetDistance,
    };
  });
  const offsetTotal = previewPoints.reduce((total, point) => total + point.offsetDistance, 0);
  const largestOffset = Math.max(0, ...previewPoints.map((point) => point.offsetDistance));

  return {
    points: previewPoints,
    summary: {
      averageOffset: previewPoints.length === 0 ? 0 : offsetTotal / previewPoints.length,
      largestOffset,
      totalTestPoints: previewPoints.length,
    },
  };
};
