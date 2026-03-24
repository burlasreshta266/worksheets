export const DEFAULT_FILTER = "none";
export const MIN_ZOOM = 50;
export const MAX_ZOOM = 200;
export const ZOOM_STEP = 10;

export function getValidImageFiles(files) {
  return Array.isArray(files) ? files.filter((file) => file instanceof File) : [];
}

export function createImageId(file) {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createImageModel(file) {
  return {
    id: createImageId(file),
    originalFile: file,
    previewUrl: "",
    transformations: {
      crop: null,
      filter: DEFAULT_FILTER,
    },
  };
}

export function createImageModels(files) {
  return getValidImageFiles(files).map(createImageModel);
}

export function createPreviewItems(images) {
  return images
    .filter((image) => typeof image.previewUrl === "string" && image.previewUrl.length > 0)
    .map((image) => ({
      id: image.id,
      key: image.id,
      src: image.previewUrl,
    }));
}

export function getImagesProcessingKey(images) {
  return images
    .map((image) => {
      const { crop, filter } = image.transformations;
      const cropKey = crop
        ? `${crop.x}:${crop.y}:${crop.width}:${crop.height}`
        : "none";

      return [
        image.id,
        image.originalFile.name,
        image.originalFile.lastModified,
        image.originalFile.size,
        cropKey,
        filter,
      ].join(":");
    })
    .join("|");
}
