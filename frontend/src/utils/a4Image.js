const A4_ASPECT_RATIO = 210 / 297;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = src;
  });
}

export async function createA4PaddedImage(imageSrc, backgroundColor = "#ffffff") {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  const imageAspectRatio = image.naturalWidth / image.naturalHeight;

  if (imageAspectRatio > A4_ASPECT_RATIO) {
    canvas.width = image.naturalWidth;
    canvas.height = Math.round(image.naturalWidth / A4_ASPECT_RATIO);
  } else {
    canvas.height = image.naturalHeight;
    canvas.width = Math.round(image.naturalHeight * A4_ASPECT_RATIO);
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const drawWidth = image.naturalWidth;
  const drawHeight = image.naturalHeight;
  const offsetX = Math.round((canvas.width - drawWidth) / 2);
  const offsetY = Math.round((canvas.height - drawHeight) / 2);

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Unable to generate an A4 image.");
  }

  return blob;
}
