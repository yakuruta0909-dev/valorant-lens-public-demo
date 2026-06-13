import type { ValorantMap } from "./mapTypes";
import type { MapCalibration } from "./mapCalibrationTypes";

const storageKey = "valorant-improvement-analyzer-map-calibration";

export const DEFAULT_MAP_CALIBRATION: MapCalibration = {
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  scale: 1,
};

type MapCalibrationState = {
  calibrations: Partial<Record<ValorantMap, MapCalibration>>;
};

const emptyState: MapCalibrationState = {
  calibrations: {},
};

export const getMapCalibrationStorageKey = () => storageKey;

export const loadMapCalibrationState = (): MapCalibrationState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return emptyState;
    }

    const parsedValue = JSON.parse(rawValue) as MapCalibrationState;
    return {
      calibrations: parsedValue.calibrations ?? {},
    };
  } catch {
    return emptyState;
  }
};

export const loadMapCalibration = (map: ValorantMap): MapCalibration => ({
  ...DEFAULT_MAP_CALIBRATION,
  ...loadMapCalibrationState().calibrations[map],
});

export const saveMapCalibration = (map: ValorantMap, calibration: MapCalibration): MapCalibrationState => {
  const currentState = loadMapCalibrationState();
  const nextState = {
    calibrations: {
      ...currentState.calibrations,
      [map]: calibration,
    },
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
};

export const resetMapCalibration = (map: ValorantMap): MapCalibrationState => {
  const currentState = loadMapCalibrationState();
  const nextCalibrations = { ...currentState.calibrations };

  delete nextCalibrations[map];

  const nextState = {
    calibrations: nextCalibrations,
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextState));
  return nextState;
};

export const getModifiedMapCalibrationCount = () =>
  Object.keys(loadMapCalibrationState().calibrations).length;

export const validateMapCalibration = (calibration: MapCalibration) => {
  const errors: string[] = [];

  if (calibration.scale <= 0) {
    errors.push("Scale must be greater than 0.");
  }

  if (calibration.rotation < -360 || calibration.rotation > 360) {
    errors.push("Rotation must be between -360 and 360.");
  }

  return {
    errors,
    valid: errors.length === 0,
  };
};
