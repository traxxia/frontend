import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

const ScheduleDatesModal = ({ show, onHide, onSave, cadence }) => {
  const { t } = useTranslation();
  const [scheduleDates, setScheduleDates] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show && cadence) {
      setScheduleDates(cadence.scheduleDates || []);
    }
  }, [show, cadence]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave({ ...cadence, scheduleDates });
      onHide();
    } catch (err) {
      console.error("Failed to save schedule dates:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDate = () => {
    setScheduleDates([...scheduleDates, { date: "", name: "" }]);
  };

  const handleUpdateDate = (index, field, value) => {
    const newDates = [...scheduleDates];
    newDates[index][field] = value;
    setScheduleDates(newDates);
  };

  const handleRemoveDate = (index) => {
    setScheduleDates(scheduleDates.filter((_, i) => i !== index));
  };

  if (!cadence) return null;

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="modal-md">
      <Modal.Header className="border-0 pb-0" closeButton>
        <Modal.Title className="fw-bold fs-5">
          {t("Schedule —")} {cadence.name}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-2 pb-2">
        <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: '1.4' }}>
          {t("Set the dates this review will happen on. Each one becomes a Moment you prepare for and then close.")}
        </p>

        <div className="mb-3">
          {scheduleDates.map((item, index) => (
            <div key={index} className="border rounded p-3 mb-3 d-flex flex-column gap-2" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between gap-3">
                <Form.Control 
                  type="date"
                  value={item.date}
                  onChange={(e) => handleUpdateDate(index, 'date', e.target.value)}
                  className="shadow-none py-2"
                  style={{ width: '160px', borderColor: '#cbd5e1' }}
                />
                <button className="btn btn-link text-muted p-0" onClick={() => handleRemoveDate(index)}>
                  <X size={18} />
                </button>
              </div>
              <Form.Control 
                type="text"
                placeholder="e.g. Q2 QBR"
                value={item.name}
                onChange={(e) => handleUpdateDate(index, 'name', e.target.value)}
                className="shadow-none py-2"
                style={{ borderColor: '#cbd5e1' }}
              />
            </div>
          ))}
        </div>

        <Button 
          variant="outline-primary" 
          className="w-100 rounded fw-medium py-2 d-flex align-items-center justify-content-center gap-2 border-dashed"
          style={{ borderStyle: 'dashed', backgroundColor: '#fff', borderColor: '#cbd5e1', color: '#64748b' }}
          onClick={handleAddDate}
        >
          + {t("Add date")}
        </Button>
      </Modal.Body>
      
      <Modal.Footer className="border-0 px-4 pb-4 pt-3 d-flex justify-content-between align-items-center">
        <span className="text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>
          {scheduleDates.length} DATE{scheduleDates.length !== 1 ? 'S' : ''} SCHEDULED
        </span>
        <Button variant="primary" className="fw-bold px-4 rounded-pill" disabled={isSubmitting} onClick={handleSave}>
          {t("Done")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScheduleDatesModal;
