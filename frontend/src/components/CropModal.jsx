import { useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ActionModal from "./ActionModal.jsx";

function createInitialCrop(imageElement, aspect, initialCrop) {
  const mediaWidth = imageElement.width;
  const mediaHeight = imageElement.height;

  if (initialCrop?.width && initialCrop?.height) {
    const scaleX = mediaWidth / imageElement.naturalWidth;
    const scaleY = mediaHeight / imageElement.naturalHeight;

    return {
      unit: "px",
      x: initialCrop.x * scaleX,
      y: initialCrop.y * scaleY,
      width: initialCrop.width * scaleX,
      height: initialCrop.height * scaleY,
    };
  }

  if (!aspect) {
    return {
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    };
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function CropModal({ show, imageFile, initialCrop, aspect, onClose, onConfirm }) {
  const imageRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    if (!show) {
      return;
    }

    setCrop(undefined);
    setCompletedCrop(null);
    setIsSaving(false);
  }, [aspect, imageFile, initialCrop, show]);

  useEffect(() => {
    if (!show || !(imageFile instanceof File)) {
      setImageSrc("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImageSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, show]);

  const handleImageLoad = (event) => {
    const nextCrop = createInitialCrop(event.currentTarget, aspect, initialCrop);
    setCrop(nextCrop);
    setCompletedCrop(nextCrop);
  };

  const handleConfirm = async () => {
    if (!imageRef.current || !completedCrop || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

      await onConfirm?.({
        x: Math.round(completedCrop.x * scaleX),
        y: Math.round(completedCrop.y * scaleY),
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ActionModal
      show={show}
      onClose={onClose}
      title="Crop Page"
      onConfirm={handleConfirm}
      confirmLabel={isSaving ? "Cropping..." : "Apply Crop"}
      confirmVariant="primary"
      confirmDisabled={!completedCrop?.width || !completedCrop?.height || isSaving}
      size="lg"
    >
      <div className="crop-modal-content">
        <div className="crop-modal-stage">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(nextCrop) => setCrop(nextCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={aspect}
              ruleOfThirds
              keepSelection
              className="crop-modal-cropper"
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop target"
                className="crop-modal-image"
                onLoad={handleImageLoad}
              />
            </ReactCrop>
          )}
        </div>
      </div>
    </ActionModal>
  );
}

export default CropModal;
