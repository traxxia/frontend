import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
const ConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = 'primary',
  icon
}) => {
  const {
    t
  } = useTranslation();
  const handleConfirm = () => {
    if (onConfirm && typeof onConfirm === 'function') {
      onConfirm();
    }
    onHide();
  };
  return <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    {icon || <AlertTriangle size={22} className="text-warning" />}
                    <span>{title || t('Are you sure?')}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="py-2">
                    <p className="mb-0 fs-6 text-dark confirmation-modal--s1">
                        {message}
                    </p>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pb-3">
                <Button variant="outline-secondary" onClick={onHide} className="px-4">
                    {cancelText || t('Cancel')}
                </Button>
                <Button variant={confirmVariant} onClick={handleConfirm} className="px-4">
                    {confirmText || t('Confirm')}
                </Button>
            </Modal.Footer>
        </Modal>;
};
export default ConfirmationModal;