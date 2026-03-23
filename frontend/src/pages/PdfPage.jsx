import { Alert, Button, Container, Stack, Row, Col, Form } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CropModal from "../components/CropModal.jsx";
import ActionModal from "../components/ActionModal.jsx";
import ReorderGrid from "../components/ReorderGrid.jsx";
import { createA4PaddedImage } from "../utils/a4Image.js";
import { Crop, Trash3Fill } from "react-bootstrap-icons";

function getValidImageFiles(files) {
    return Array.isArray(files) ? files.filter((file) => file instanceof File) : [];
}

function createPreviewImage(image, index) {
    if (typeof image === "string") {
        return {
            key: `preview-${index}`,
            src: image,
            cleanup: null,
        };
    }

    if (image instanceof Blob) {
        const src = URL.createObjectURL(image);

        return {
            key: `${image.name ?? "preview"}-${index}-${image.lastModified ?? "blob"}`,
            src,
            cleanup: () => URL.revokeObjectURL(src),
        };
    }

    if (image && typeof image === "object") {
        const fallbackSrc = typeof image.previewUrl === "string" ? image.previewUrl : image.src;

        if (typeof fallbackSrc === "string") {
            return {
                key: `preview-${index}`,
                src: fallbackSrc,
                cleanup: null,
            };
        }
    }

    return null;
}

function PdfPage() {
    const MIN_ZOOM = 50;
    const MAX_ZOOM = 200;
    const ZOOM_STEP = 10;
    const location = useLocation();
    const navigate = useNavigate();
    const addPagesInputRef = useRef(null);

    const [title, setTitle] = useState("generated_pdf");
    const [originalImages, setOriginalImages] = useState(() => getValidImageFiles(location.state?.files));
    const [editedImages, setEditedImages] = useState(() => getValidImageFiles(location.state?.files));
    const [alertConfig, setAlertConfig] = useState({ variant: "", message: "" });
    const [previewImages, setPreviewImages] = useState([]);
    const [displayPreviewImages, setDisplayPreviewImages] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [activeModal, setActiveModal] = useState(null);
    const [cropTargetIndex, setCropTargetIndex] = useState(null);
    const [isA4Enabled, setIsA4Enabled] = useState(false);


    const showAlert = (variant, message) => {
        setAlertConfig({ variant, message });
    };

    const clearAlert = () => {
        setAlertConfig({ variant: "", message: "" });
    };

    const addImages = (newImages) => {
        const validImages = Array.isArray(newImages)
            ? newImages.filter((image) => image instanceof File)
            : [];

        if (validImages.length === 0) {
            showAlert("danger", "Failed to add new pages. Please try again.");
            return;
        }

        setOriginalImages((currentImages) => [...currentImages, ...validImages]);
        setEditedImages((currentImages) => [...currentImages, ...validImages]);
        showAlert("success", `${validImages.length} new page${validImages.length === 1 ? "" : "s"} added successfully.`);
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
        setCropTargetIndex(null);
    };

    const handleOpenCropModal = (pageIndex) => {
        setCropTargetIndex(pageIndex);
        setActiveModal("crop");
    };

    const handleDeletePage = (pageIndex) => {
        if (pageIndex < 0 || pageIndex >= editedImages.length) {
            showAlert("danger", "Failed to delete the page. Please try again.");
            return;
        }

        setEditedImages((currentImages) => currentImages.filter((_, index) => index !== pageIndex));
        setOriginalImages((currentImages) => currentImages.filter((_, index) => index !== pageIndex));
        showAlert("success", `Page ${pageIndex + 1} deleted successfully.`);
    };

    const handleReorderImages = (reorderedPreviewImages) => {
        const reorderedKeys = reorderedPreviewImages.map((image) => image.key);
        const reorderCurrentImages = (currentImages) => {
            const imageMap = new Map(
                currentImages.map((image, index) => [previewImages[index]?.key, image]),
            );

            return reorderedKeys
                .map((key) => imageMap.get(key))
                .filter((image) => image !== undefined);
        };

        setEditedImages(reorderCurrentImages);
        setOriginalImages(reorderCurrentImages);
    };

    const handleZoomIn = () => {
        setZoomLevel((currentZoom) => Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM));
    };

    const handleZoomOut = () => {
        setZoomLevel((currentZoom) => Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM));
    };

    const handleCropConfirm = async (croppedImage) => {
        if (cropTargetIndex === null) {
            return;
        }

        setEditedImages((currentImages) =>
            currentImages.map((image, index) => index === cropTargetIndex ? croppedImage : image),
        );
        handleCloseModal();
        showAlert("success", "Page cropped successfully.");
    };

    useEffect(() => {
        const incomingFiles = getValidImageFiles(location.state?.files);

        if (incomingFiles.length === 0) {
            navigate("/", { replace: true });
            return;
        }

        setOriginalImages((currentImages) => currentImages.length === 0 ? incomingFiles : currentImages);
        setEditedImages((currentImages) => currentImages.length === 0 ? incomingFiles : currentImages);
    }, [location.state, navigate]);

    useEffect(() => {
        const nextPreviewImages = editedImages
            .map((image, index) => createPreviewImage(image, index))
            .filter((image) => image !== null);

        setPreviewImages(nextPreviewImages);

        return () => {
            nextPreviewImages.forEach((image) => {
                image.cleanup?.();
            });
        };
    }, [editedImages]);

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
                            key: image.key,
                            src: paddedSrc,
                            cleanup: () => URL.revokeObjectURL(paddedSrc),
                        };
                    } catch {
                        return {
                            key: image.key,
                            src: image.src,
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
        <Container className="border ps-3 pe-3 mt-3 mb-3">
            <Stack gap={3}>


                <Container fluid className="border d-flex justify-content-between">
                    <div>
                        <input type="text" 
                        className="title-input" 
                        value={title}
                        onChange ={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <Button variant="success" size="sm" className="fw-bold">
                        Download
                    </Button>
                </Container>


                <Container fluid className="border">
                    <Row className="g-3">

                        <Col xs={6} className="ps-3 pe-3">
                             <Button className="w-100" variant="primary" onClick={handleAddPagesClick}>
                                Add Pages
                            </Button>
                        </Col>

                        <Col xs={6} className="ps-3 pe-3">
                            <Button className="w-100" variant="primary"
                                onClick={() => handleOpenModal("reorder")}>
                                Reorder Pages
                            </Button>
                        </Col>

                    </Row>
                </Container>


                <Container fluid className="border p-3 pdf-preview-shell">

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
                                <Form.Select data-bs-theme="dark">
                                    <option value="none">No Filter</option>
                                    <option value="grey">Greyscale</option>
                                    <option value="hicon">High Contrast</option>
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
                                    key={image.key}
                                    className="pdf-preview-page"
                                    style={{ "--preview-zoom": zoomLevel / 100 }}
                                >
                                    <div className="pdf-preview-page-header">
                                        <div className="pdf-preview-counter">
                                            {index + 1}/{displayPreviewImages.length}
                                        </div>
                                        <Button
                                            variant="outline-light"
                                            size="sm"
                                            className="pdf-preview-crop-button"
                                            onClick={() => handleOpenCropModal(index)}
                                            aria-label={`Crop page ${index + 1}`}
                                        >
                                            <Crop />
                                        </Button>
                                        <Button
                                            variant="outline-light"
                                            size="sm"
                                            className="pdf-preview-delete-button"
                                            onClick={() => handleDeletePage(index)}
                                            aria-label={`Delete page ${index + 1}`}
                                        >
                                            <Trash3Fill />
                                        </Button>
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

                {alertConfig.message && (
                    <Alert variant={alertConfig.variant} dismissible onClose={clearAlert} className="mb-0">
                        {alertConfig.message}
                    </Alert>
                )}

                <ActionModal
                    show={activeModal === "reorder"}
                    onClose={handleCloseModal}
                    title="Reorder Pages"
                    onConfirm={handleCloseModal}
                    confirmLabel="Done"
                    confirmVariant="primary"
                >
                    <ReorderGrid
                        images={displayPreviewImages}
                        onReorder={handleReorderImages}
                    />
                </ActionModal>

                <CropModal
                    show={activeModal === "crop" && cropTargetIndex !== null}
                    imageSrc={cropTargetIndex !== null ? previewImages[cropTargetIndex]?.src : ""}
                    fileName={cropTargetIndex !== null ? `page-${cropTargetIndex + 1}.png` : "cropped-image.png"}
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
    )
}

export default PdfPage;
