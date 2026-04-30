import React, { useState, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import { AlertTriangle, Info, ArrowRight } from "lucide-react";

const JUSTIFICATION_REGEX = /^[A-Za-z0-9\s.,'()\-!&?]+$/;

/**
 * StateChangeModal - Common modal for status and/or learning state changes.
 * 
 * Props:
 *   show       - boolean
 *   onHide     - cancel callback
 *   onConfirm  - (justification: string) => void
 *   changes    - Array<{ label: string, oldValue: string, newValue: string }>
 *                e.g. [{ label: "Status", oldValue: "Active", newValue: "Paused" },
 *                      { label: "Learning State", oldValue: "Testing", newValue: "Validated" }]
 *
 *   Legacy single-change props still supported:
 *   oldState / newState - used when `changes` is not provided
 */
const StateChangeModal = ({ show, onHide, onConfirm, changes = [], oldState, newState }) => {
    const { t } = useTranslation();
    const [justification, setJustification] = useState("");
    const [error, setError] = useState("");

    // Build the effective changes list (support legacy props as fallback)
    const effectiveChanges = changes.length > 0
        ? changes
        : (oldState || newState)
            ? [{ label: t("Status"), oldValue: oldState || t("Unknown"), newValue: newState || t("Unknown") }]
            : [];

    const handleConfirm = useCallback(() => {
        const text = justification.trim();

        if (!text) {
            setError(t("Justification is required to change project state"));
            return;
        }

        // Minimum 10 characters
        if (text.length < 10) {
            setError(t("Justification must be at least 10 characters long"));
            return;
        }

        // Only alphabets + numbers + space + punctuation
        if (!JUSTIFICATION_REGEX.test(text)) {
            setError(t("Invalid characters in justification"));
            return;
        }

        // Check for other invalid characters
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

    return (
        <Modal show={show} onHide={handleCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle color="#f59e0b" size={20} />
                    {t("Confirm State Change")}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {effectiveChanges.map((change, idx) => (
                    <div key={idx} style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: effectiveChanges.length > 1 && idx < effectiveChanges.length - 1 ? '10px' : '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#64748b', minWidth: '110px' }}>
                            {change.label}:
                        </span>
                        <strong style={{ color: '#334155' }}>{change.oldValue || t("Unknown")}</strong>
                        <ArrowRight size={16} style={{ color: '#94a3b8' }} />
                        <strong style={{ color: '#2563eb' }}>{change.newValue}</strong>
                    </div>
                ))}
                <Form.Group>
                    <Form.Label>
                        {t("Why are you making this decision?")} <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={justification}
                        onChange={(e) => {
                            setJustification(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder={t("Please provide a mandatory justification for the decision log...")}
                        isInvalid={!!error}
                    />
                    {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
                    <Form.Text className="text-muted" style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px" }}>
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
        </Modal>
    );
};

export default StateChangeModal;
