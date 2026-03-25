import { applyCrop, canvasToBlob, loadImageFromFile } from "./cropUtils.js";
import { applyFilter } from "./filterUtils.js";

function getOutputType(fileType) {
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  return supportedTypes.has(fileType) ? fileType : "image/png";
}

async function renderProcessedImage(image) {
  if (!image?.originalFile) {
    throw new Error("A source image is required.");
  }

  const sourceImage = await loadImageFromFile(image.originalFile);
  const croppedSource = image.transformations?.crop
    ? applyCrop(sourceImage, image.transformations.crop)
    : sourceImage;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  const width = croppedSource instanceof HTMLCanvasElement ? croppedSource.width : croppedSource.naturalWidth;
  const height = croppedSource instanceof HTMLCanvasElement ? croppedSource.height : croppedSource.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  applyFilter(context, image.transformations?.filter ?? "none");
  context.drawImage(croppedSource, 0, 0, width, height);
  context.filter = "none";

  return canvasToBlob(canvas, getOutputType(image.originalFile.type));
}

export async function processImageToBlob(image) {
  return renderProcessedImage(image);
}

export async function processImage(image) {
  const blob = await renderProcessedImage(image);
  return URL.createObjectURL(blob);
}
