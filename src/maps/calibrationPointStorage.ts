import type { CalibrationPoint } from "./calibrationPointTypes";
import type { ValorantMap } from "./mapTypes";

const storageKey = "valorant-improvement-analyzer-calibration-points";

type CalibrationPointState = {
  points: CalibrationPoint[];
};

const emptyState: CalibrationPointState = {
  points: [],
};

export const getCalibrationPointStorageKey = () => storageKey;

export const loadCalibrationPointState = (): CalibrationPointState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return emptyState;
    }

    const parsedValue = JSON.parse(rawValue) as CalibrationPointState;
    return {
      points: Array.isArray(parsedValue.points) ? parsedValue.points : [],
    };
  } catch {
    return emptyState;
  }
};

export const loadCalibrationPoints = (map: ValorantMap) =>
  loadCalibrationPointState().points.filter((point) => point.map === map);

export const saveCalibrationPoint = (point: CalibrationPoint): CalibrationPointState => {
  const currentState = loadCalibrationPointState();
  const nextState = {
    points: [...currentState.points.filter((currentPoint) => currentPoint.id !== point.id), point],
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
};

export const deleteCalibrationPoint = (pointId: string): CalibrationPointState => {
  const currentState = loadCalibrationPointState();
  const nextState = {
    points: currentState.points.filter((point) => point.id !== pointId),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
};

export const resetCalibrationPoints = (map: ValorantMap): CalibrationPointState => {
  const currentState = loadCalibrationPointState();
  const nextState = {
    points: currentState.points.filter((point) => point.map !== map),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
};

export const validateCalibrationPoint = (point: CalibrationPoint) => {
  const errors: string[] = [];

  if (!point.map) {
    errors.push("Map is required.");
  }

  if (point.x < 0) {
    errors.push("X must be 0 or greater.");
  }

  if (point.y < 0) {
    errors.push("Y must be 0 or greater.");
  }

  return {
    errors,
    valid: errors.length === 0,
  };
};
