import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import { AlertTriangle, Info } from "lucide-react";

const StateChangeModal = ({ show, onHide, onConfirm, oldState, newState }) => {
    const { t } = useTranslation();
    const [justification, setJustification] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
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

    // Only alphabets + space + punctuation (no numbers)
    const validSentence = /^[A-Za-z\s.,'-]+$/;

    if (!validSentence.test(text)) {
        setError(t("Numbers are not allowed in justification"));
        return;
    }

    setError("");
    onConfirm(text);
    setJustification("");
};

    const handleCancel = () => {
        setError("");
        setJustification("");
        onHide();
    };

    return (
        <Modal show={show} onHide={handleCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle color="#f59e0b" size={20} />
                    {t("Confirm State Change")}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    {t("You are about to change the project execution state from ")}
                    <strong>{oldState || t("Unknown")}</strong> {t("to")} <strong>{newState}</strong>.
                </p>
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
