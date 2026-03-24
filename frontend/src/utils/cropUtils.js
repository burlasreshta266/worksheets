function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the image."));
    image.src = src;
  });
}

export async function loadImageFromFile(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await loadImage(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function applyCrop(image, crop) {
  if (!crop?.width || !crop?.height) {
    return image;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));
  const x = Math.max(0, Math.round(crop.x));
  const y = Math.max(0, Math.round(crop.y));

  canvas.width = width;
  canvas.height = height;

  context.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas;
}

export function canvasToBlob(canvas, type = "image/png", quality = 1) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to generate the processed image."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}
