import React, { useState, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import { AlertTriangle, Info, ArrowRight } from "lucide-react";
const JUSTIFICATION_REGEX = /^[A-Za-z0-9\s.,'()\-!&?]+$/;
const StateChangeModal = ({
  show,
  onHide,
  onConfirm,
  changes = [],
  oldState,
  newState
}) => {
  const {
    t
  } = useTranslation();
  const [justification, setJustification] = useState("");
  const [error, setError] = useState("");
  const effectiveChanges = changes.length > 0 ? changes : oldState || newState ? [{
    label: t("Status"),
    oldValue: oldState || t("Unknown"),
    newValue: newState || t("Unknown")
  }] : [];
  const handleConfirm = useCallback(() => {
    const text = justification.trim();
    if (!text) {
      setError(t("Justification is required to change project state"));
      return;
    }
    if (text.length < 10) {
      setError(t("Justification must be at least 10 characters long"));
      return;
    }
    if (!JUSTIFICATION_REGEX.test(text)) {
      setError(t("Invalid characters in justification"));
      return;
    }
    if (!JUSTIFICATION_REGEX.test(text)) {
      setError(t("Invalid characters in justification. Use only letters and standard punctuation."));
      return;
    }
    setError("");
    onConfirm(text);
    setJustification("");
  }, [justification, onConfirm, t]);
  const handleCancel = useCallback(() => {
    setError("");
    setJustification("");
    onHide();
  }, [onHide]);
  return <Modal show={show} onHide={handleCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title className="state-change-modal--s1">
                    <AlertTriangle color="#f59e0b" size={20} />
                    {t("Confirm State Change")}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {effectiveChanges.map((change, idx) => <div key={idx} style={{
        marginBottom: effectiveChanges.length > 1 && idx < effectiveChanges.length - 1 ? '10px' : '16px'
      }} className="state-change-modal--s2">
                        <span className="state-change-modal--s3">
                            {change.label}:
                        </span>
                        <strong className="state-change-modal--s4">{change.oldValue || t("Unknown")}</strong>
                        <ArrowRight size={16} className="state-change-modal--s5" />
                        <strong className="state-change-modal--s6">{change.newValue}</strong>
                    </div>)}
                <Form.Group>
                    <Form.Label>
                        {t("Why are you making this decision?")} <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control as="textarea" rows={3} value={justification} onChange={e => {
          setJustification(e.target.value);
          if (error) setError("");
        }} placeholder={t("Please provide a mandatory justification for the decision log...")} isInvalid={!!error} />
                    {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
                    <Form.Text className="text-muted state-change-modal--s7">
                        <Info size={14} />
                        {t("This justification will be permanently saved in the decision log for transparency.")}
                    </Form.Text>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleCancel}>
                    {t("cancel")}
                </Button>
                <Button variant="primary" onClick={handleConfirm}>
                    {t("Confirm Change")}
                </Button>
            </Modal.Footer>
        </Modal>;
};
export default StateChangeModal;
