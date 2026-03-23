import { useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ActionModal from "./ActionModal.jsx";
import { createCroppedImageFile } from "../utils/cropImage.js";

function createInitialCrop(mediaWidth, mediaHeight, aspect) {
  if (aspect) {
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

  return {
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  };
}

function CropModal({ show, imageSrc, fileName, aspect, onClose, onConfirm }) {
  const imageRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!show) {
      return;
    }

    setCrop(undefined);
    setCompletedCrop(null);
    setIsSaving(false);
  }, [show, imageSrc, aspect]);

  const handleImageLoad = (event) => {
    const { width, height } = event.currentTarget;
    setCrop(createInitialCrop(width, height, aspect));
  };

  const handleConfirm = async () => {
    if (!imageRef.current || !completedCrop || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const croppedFile = await createCroppedImageFile(imageRef.current, completedCrop, fileName);
      await onConfirm?.(croppedFile);
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
              onChange={(_, percentCrop) => setCrop(percentCrop)}
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
