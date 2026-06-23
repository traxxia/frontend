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
    setScheduleDates([...scheduleDates, { date: "", name: cadence?.name || "" }]);
  };

  const handleUpdateDate = (index, field, value) => {
    const newDates = [...scheduleDates];
    newDates[index][field] = value;
    setScheduleDates(newDates);
  };

  const handleRemoveDate = (index) => {
    setScheduleDates(scheduleDates.filter((_, i) => i !== index));
  };

  const calculateDaysAway = (dateString) => {
    if (!dateString) return null;
    const targetDate = new Date(dateString);
    const today = new Date();
    // Calculate difference in days
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `in ${diffDays} days`;
    if (diffDays === 0) return 'today';
    return `${Math.abs(diffDays)} days ago`;
  };

  if (!cadence) return null;

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="modal-md">
      <Modal.Header className="border-0 pb-0" closeButton>
        <Modal.Title className="fw-bold fs-4">
          {t("Schedule —")} {cadence.name}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-2 pb-2">
        <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: '1.4' }}>
          {t("Set the dates this review will happen on. Each one becomes a Moment you prepare for and then close.")}
        </p>

        <div className="mb-3 text-center">
          {scheduleDates.length === 0 && (
            <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '14px', marginBottom: '16px' }}>
              No dates yet. Add one below.
            </p>
          )}
          {scheduleDates.map((item, index) => {
            const daysAway = calculateDaysAway(item.date);
            const isUpcoming = daysAway && daysAway.includes('in');
            
            return (
              <div key={index} className="border rounded p-3 mb-3 d-flex flex-column gap-2 text-start" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <Form.Control 
                      type="date"
                      value={item.date}
                      onChange={(e) => handleUpdateDate(index, 'date', e.target.value)}
                      className="shadow-none py-1"
                      style={{ width: '150px', borderColor: '#cbd5e1', fontSize: '14px' }}
                    />
                    {item.date && (
                      <div className="d-flex align-items-center gap-2">
                        {isUpcoming && (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                            UPCOMING
                          </span>
                        )}
                        <span className="text-muted" style={{ fontSize: '13px' }}>{daysAway}</span>
                      </div>
                    )}
                  </div>
                  <button className="btn btn-link text-muted p-0" onClick={() => handleRemoveDate(index)}>
                    <X size={18} />
                  </button>
                </div>
                <Form.Control 
                  type="text"
                  placeholder="e.g. Q2 QBR"
                  value={item.name}
                  onChange={(e) => handleUpdateDate(index, 'name', e.target.value)}
                  className="shadow-none py-2 mt-1"
                  style={{ borderColor: '#cbd5e1', fontSize: '14px' }}
                />
              </div>
            );
          })}
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
