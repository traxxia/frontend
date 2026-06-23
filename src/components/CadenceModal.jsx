import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store";

const CadenceModal = ({ show, onHide, onSave, businessId, existingCadence = null }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [audience, setAudience] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show && businessId) {
      const fetchUsers = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/businesses/${businessId}/eligible-owners`, {
            headers: {
              "Authorization": `Bearer ${useAuthStore.getState().token}`
            }
          });
          const data = await response.json();
          setEligibleUsers(data.eligible_owners || []);
        } catch (err) {
          console.error("Failed to fetch users:", err);
          setEligibleUsers([]);
        }
      };
      fetchUsers();
    }
  }, [show, businessId]);

  useEffect(() => {
    if (show) {
      if (existingCadence) {
        setName(existingCadence.name || "");
        setFrequency(existingCadence.frequency || "Monthly");
        setAudience(existingCadence.defaultAudience || []);
      } else {
        setName("");
        setFrequency("Monthly");
        setAudience([]);
      }
    }
  }, [show, existingCadence]);

  const toggleAudience = (userId) => {
    setAudience((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave({ name, frequency, defaultAudience: audience });
      onHide();
    } catch (err) {
      console.error("Failed to save cadence:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="modal-md">
      <Modal.Header className="border-0 pb-0" closeButton>
        <Modal.Title className="fw-bold fs-4">
          {existingCadence ? t("Edit cadence") : t("Add a cadence")}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-2 pb-2">
        <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: '1.4' }}>
          {t("A recurring meeting series with its own audience and frequency — e.g. a product committee, a sales review. You can have several at the same frequency.")}
        </p>

        <Form.Group className="mb-4">
          <Form.Label className="text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>Name</Form.Label>
          <Form.Control 
            type="text" 
            placeholder="e.g. Product Committee" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow-none py-2 px-3"
            style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
          />
          <Form.Text className="text-muted mt-2 d-block" style={{ fontSize: '12px' }}>
            {t("Use the name your team already calls it.")}
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>Frequency</Form.Label>
          <Form.Select 
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="shadow-none py-2 px-3"
            style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
          >
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annually">Annually</option>
          </Form.Select>
          <Form.Text className="text-muted mt-2 d-block" style={{ fontSize: '12px' }}>
            {t("How often this cadence runs. The system schedules the next occurrence based on this.")}
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label className="text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>Default Audience</Form.Label>
          <div className="border rounded px-3 py-2" style={{ maxHeight: '180px', overflowY: 'auto', borderColor: '#cbd5e1' }}>
            {eligibleUsers.map((user) => (
              <div key={user._id} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <Form.Check 
                  type="checkbox"
                  id={`audience-${user._id}`}
                  label={<span className="fw-medium text-dark ms-2">{user.name || user.email}</span>}
                  checked={audience.includes(user._id)}
                  onChange={() => toggleAudience(user._id)}
                  className="mb-0"
                />
                <span className="text-muted" style={{ fontSize: '12px' }}>{user.email}</span>
              </div>
            ))}
          </div>
          <Form.Text className="text-muted mt-2 d-block" style={{ fontSize: '12px' }}>
            {t("Who's in the room by default. You can still override per occurrence later.")}
          </Form.Text>
        </Form.Group>

      </Modal.Body>
      
      <Modal.Footer className="border-0 px-4 pb-4 pt-2">
        <Button variant="outline-secondary" className="border shadow-sm bg-white text-dark fw-bold px-4 rounded-pill" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" className="text-white fw-bold px-4 rounded-pill border-0" disabled={!name.trim() || isSubmitting} onClick={handleSave}>
          {existingCadence ? t("Save changes") : t("Add cadence")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CadenceModal;
