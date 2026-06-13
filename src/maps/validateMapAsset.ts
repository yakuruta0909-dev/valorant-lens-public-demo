import type { StoredMapAsset } from "./mapAssetTypes";

export type MapAssetValidationResult = {
  errors: string[];
  valid: boolean;
};

export const validateImageFile = (file: File | undefined): MapAssetValidationResult => {
  const errors: string[] = [];

  if (!file) {
    errors.push("Image file is required.");
  } else if (!file.type.startsWith("image/")) {
    errors.push("Only image files are supported.");
  }

  return {
    errors,
    valid: errors.length === 0,
  };
};

export const validateStoredMapAsset = (asset: StoredMapAsset | undefined): MapAssetValidationResult => {
  const errors: string[] = [];

  if (!asset?.map) {
    errors.push("Map is required.");
  }

  if (!asset?.dataUrl) {
    errors.push("Image data is required.");
  }

  if (!asset || asset.width <= 0 || asset.height <= 0) {
    errors.push("Image width and height must be greater than 0.");
  }

  return {
    errors,
    valid: errors.length === 0,
  };
};
