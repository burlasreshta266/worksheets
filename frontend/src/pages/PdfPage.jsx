import { Alert, Button, Container, Stack, Row, Col, Form } from "react-bootstrap";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crop, Trash3Fill } from "react-bootstrap-icons";
import CropModal from "../components/CropModal.jsx";
import ActionModal from "../components/ActionModal.jsx";
import ReorderGrid from "../components/ReorderGrid.jsx";
import { createA4PaddedImage } from "../utils/a4Image.js";
import { processImage } from "../utils/processImage.js";
import {
  DEFAULT_FILTER,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  getValidImageFiles,
  createImageModels,
  createPreviewItems,
  getImagesProcessingKey,
} from "../utils/pdfPageUtils.js";

function PdfPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const addPagesInputRef = useRef(null);
  const latestPreviewUrlsRef = useRef([]);

  const [title, setTitle] = useState("generated_pdf");
  const [images, setImages] = useState(() => createImageModels(location.state?.files));
  const [alertConfig, setAlertConfig] = useState({ variant: "", message: "" });
  const [displayPreviewImages, setDisplayPreviewImages] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeModal, setActiveModal] = useState(null);
  const [cropTargetId, setCropTargetId] = useState(null);
  const [isA4Enabled, setIsA4Enabled] = useState(false);

  const previewImages = useMemo(() => createPreviewItems(images), [images]);
  const cropTargetImage = useMemo(
    () => images.find((image) => image.id === cropTargetId) ?? null,
    [cropTargetId, images],
  );
  const processingKey = useMemo(() => getImagesProcessingKey(images), [images]);

  const showAlert = (variant, message) => {
    setAlertConfig({ variant, message });
  };

  const clearAlert = () => {
    setAlertConfig({ variant: "", message: "" });
  };

  const addImages = (newImages) => {
    const imageModels = createImageModels(newImages);

    if (imageModels.length === 0) {
      showAlert("danger", "Failed to add new pages. Please try again.");
      return;
    }

    setImages((currentImages) => [...currentImages, ...imageModels]);
    showAlert("success", `${imageModels.length} new page${imageModels.length === 1 ? "" : "s"} added successfully.`);
  };

  const handleAddPagesClick = () => {
    clearAlert();
    addPagesInputRef.current?.click();
  };

  const handleAddPagesChange = (event) => {
    addImages(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleOpenModal = (modalName) => {
    setActiveModal(modalName);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setCropTargetId(null);
  };

  const handleOpenCropModal = (imageId) => {
    setCropTargetId(imageId);
    setActiveModal("crop");
  };

  const handleDeletePage = (imageId) => {
    setImages((currentImages) => {
      const pageIndex = currentImages.findIndex((image) => image.id === imageId);

      if (pageIndex === -1) {
        showAlert("danger", "Failed to delete the page. Please try again.");
        return currentImages;
      }

      showAlert("success", `Page ${pageIndex + 1} deleted successfully.`);
      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const handleReorderImages = (reorderedPreviewImages) => {
    const reorderedIds = reorderedPreviewImages.map((image) => image.id);

    setImages((currentImages) => {
      const imageMap = new Map(currentImages.map((image) => [image.id, image]));

      return reorderedIds
        .map((id) => imageMap.get(id))
        .filter((image) => image !== undefined);
    });
  };

  const handleZoomIn = () => {
    setZoomLevel((currentZoom) => Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel((currentZoom) => Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM));
  };

  const handleCropConfirm = async (crop) => {
    if (!cropTargetId) {
      return;
    }

    setImages((currentImages) =>
      currentImages.map((image) => (
        image.id === cropTargetId
          ? {
              ...image,
              transformations: {
                ...image.transformations,
                crop,
              },
            }
          : image
      )),
    );

    handleCloseModal();
    showAlert("success", "Page cropped successfully.");
  };

  const handleFilterChange = (event) => {
    const selectedFilter = event.target.value;

    setImages((currentImages) =>
      currentImages.map((image) => ({
        ...image,
        transformations: {
          ...image.transformations,
          filter: selectedFilter,
        },
      })),
    );
  };

  useEffect(() => {
    const incomingFiles = getValidImageFiles(location.state?.files);

    if (incomingFiles.length === 0) {
      navigate("/", { replace: true });
      return;
    }

    setImages((currentImages) => (currentImages.length === 0 ? createImageModels(incomingFiles) : currentImages));
  }, [location.state, navigate]);

  useEffect(() => {
    let isCancelled = false;
    let nextPreviewUrls = [];
    const previousPreviewUrls = images
      .map((image) => image.previewUrl)
      .filter((previewUrl) => typeof previewUrl === "string" && previewUrl.length > 0);

    const updatePreviews = async () => {
      try {
        const processedImages = await Promise.all(
          images.map(async (image) => ({
            id: image.id,
            previewUrl: await processImage(image),
          })),
        );

        nextPreviewUrls = processedImages.map((image) => image.previewUrl);

        if (isCancelled) {
          nextPreviewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
          return;
        }

        const previewMap = new Map(processedImages.map((image) => [image.id, image.previewUrl]));

        setImages((currentImages) =>
          currentImages.map((image) => {
            const nextPreviewUrl = previewMap.get(image.id) ?? image.previewUrl;

            return image.previewUrl === nextPreviewUrl
              ? image
              : {
                  ...image,
                  previewUrl: nextPreviewUrl,
                };
          }),
        );

        previousPreviewUrls
          .filter((previewUrl) => !nextPreviewUrls.includes(previewUrl))
          .forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      } catch {
        if (isCancelled) {
          nextPreviewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
          return;
        }

        showAlert("danger", "Failed to update the image previews. Please try again.");
      }
    };

    updatePreviews();

    return () => {
      isCancelled = true;
    };
  }, [images.length, processingKey]);

  useEffect(() => {
    latestPreviewUrlsRef.current = images
      .map((image) => image.previewUrl)
      .filter((previewUrl) => typeof previewUrl === "string" && previewUrl.length > 0);
  }, [images]);

  useEffect(() => () => {
    latestPreviewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let generatedPreviewImages = [];

    const buildDisplayPreviewImages = async () => {
      if (!isA4Enabled) {
        setDisplayPreviewImages(previewImages);
        return;
      }

      const nextDisplayPreviewImages = await Promise.all(
        previewImages.map(async (image) => {
          try {
            const paddedBlob = await createA4PaddedImage(image.src);
            const paddedSrc = URL.createObjectURL(paddedBlob);

            return {
              ...image,
              src: paddedSrc,
              cleanup: () => URL.revokeObjectURL(paddedSrc),
            };
          } catch {
            return {
              ...image,
              cleanup: null,
            };
          }
        }),
      );

      generatedPreviewImages = nextDisplayPreviewImages;

      if (isCancelled) {
        generatedPreviewImages.forEach((image) => {
          image.cleanup?.();
        });
        return;
      }

      setDisplayPreviewImages(nextDisplayPreviewImages);
    };

    buildDisplayPreviewImages();

    return () => {
      isCancelled = true;
      generatedPreviewImages.forEach((image) => {
        image.cleanup?.();
      });
    };
  }, [isA4Enabled, previewImages]);

  return (
    <Container className="ps-3 pe-3 mt-3 mb-3">

        {alertConfig.message && (
          <Alert variant={alertConfig.variant} dismissible onClose={clearAlert} className="mb-3">
            {alertConfig.message}
          </Alert>
        )}

      <Stack gap={3}>
        <Container fluid className="d-flex justify-content-between">
          <div>
            <input
              type="text"
              className="title-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <Button variant="success" size="sm" className="fw-bold">
            Download
          </Button>
        </Container>

        <Container fluid>
          <Row className="g-3">
            <Col xs={6} className="ps-3 pe-3">
              <Button className="w-100" variant="primary" onClick={handleAddPagesClick}>
                Add Pages
              </Button>
            </Col>

            <Col xs={6} className="ps-3 pe-3">
              <Button className="w-100" variant="primary" onClick={() => handleOpenModal("reorder")}>
                Reorder Pages
              </Button>
            </Col>
          </Row>
        </Container>

        <Container fluid className="p-3 pdf-preview-shell">
          <div className="pdf-preview-toolbar">
            <Stack direction="horizontal" gap={4}>
              <div className="pdf-preview-toolbar-controls">
                <Button variant="outline-light" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM}>
                  -
                </Button>
                <span className="pdf-preview-zoom-value">{zoomLevel}%</span>
                <Button variant="outline-light" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM}>
                  +
                </Button>
              </div>

              <div>
                <Form.Select
                  data-bs-theme="dark"
                  value={images[0]?.transformations.filter ?? DEFAULT_FILTER}
                  onChange={handleFilterChange}
                >
                  <option value="none">No Filter</option>
                  <option value="greyscale">Greyscale</option>
                  <option value="contrast">High Contrast</option>
                </Form.Select>
              </div>

              <div>
                <Form.Check
                  type="checkbox"
                  id="a4-format-checkbox"
                  label="A4"
                  checked={isA4Enabled}
                  onChange={(event) => setIsA4Enabled(event.target.checked)}
                />
              </div>
            </Stack>
          </div>

          {displayPreviewImages.length > 0 ? (
            <div className="pdf-preview-scroll">
              {displayPreviewImages.map((image, index) => (
                <div
                  key={image.id}
                  className="pdf-preview-page"
                  style={{ "--preview-zoom": zoomLevel / 100 }}
                >
                  <div className="pdf-preview-page-header">
                    <div className="pdf-preview-counter">
                      {index + 1}/{displayPreviewImages.length}
                    </div>
                    <div className="pdf-preview-page-actions">
                      <Button
                        variant="outline-light"
                        size="sm"
                        className="pdf-preview-crop-button"
                        onClick={() => handleOpenCropModal(image.id)}
                        aria-label={`Crop page ${index + 1}`}
                      >
                        <Crop />
                      </Button>
                      <Button
                        variant="outline-light"
                        size="sm"
                        className="pdf-preview-delete-button"
                        onClick={() => handleDeletePage(image.id)}
                        aria-label={`Delete page ${index + 1}`}
                      >
                        <Trash3Fill />
                      </Button>
                    </div>
                  </div>

                  <img
                    src={image.src}
                    alt={`Edited page ${index + 1}`}
                    className="pdf-preview-image"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="pdf-preview-empty">No edited pages available.</div>
          )}
        </Container>


        <ActionModal
          show={activeModal === "reorder"}
          onClose={handleCloseModal}
          title="Reorder Pages"
          onConfirm={handleCloseModal}
          confirmLabel="Done"
          confirmVariant="primary"
        >
          <ReorderGrid images={displayPreviewImages} onReorder={handleReorderImages} />
        </ActionModal>

        <CropModal
          show={activeModal === "crop" && cropTargetImage !== null}
          imageFile={cropTargetImage?.originalFile ?? null}
          initialCrop={cropTargetImage?.transformations.crop ?? null}
          aspect={isA4Enabled ? 210 / 297 : undefined}
          onClose={handleCloseModal}
          onConfirm={handleCropConfirm}
        />

        <Form.Control
          ref={addPagesInputRef}
          type="file"
          multiple
          accept="image/*"
          className="d-none"
          onChange={handleAddPagesChange}
        />
      </Stack>
    </Container>
  );
}

export default PdfPage;
