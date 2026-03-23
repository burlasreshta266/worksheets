import { Modal, Button } from "react-bootstrap";

function ActionModal({
  show,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  confirmDisabled = false,
  size,
}) {
  return (
    <Modal show={show} onHide={onClose} centered backdrop keyboard size={size}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {children}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        {onConfirm && (
          <Button variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default ActionModal;
