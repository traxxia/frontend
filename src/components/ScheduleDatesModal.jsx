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
    let baseDate = new Date();
    
    if (scheduleDates.length > 0) {
      const lastDateStr = scheduleDates[scheduleDates.length - 1].date;
      if (lastDateStr && !isNaN(new Date(lastDateStr).getTime())) {
        baseDate = new Date(lastDateStr);
      }
    }

    const freq = (cadence?.frequency || "").toLowerCase();
    
    if (freq === 'weekly') {
      baseDate.setDate(baseDate.getDate() + 7);
    } else if (freq === 'monthly') {
      baseDate.setMonth(baseDate.getMonth() + 1);
    } else if (freq === 'quarterly') {
      baseDate.setMonth(baseDate.getMonth() + 3);
    } else if (freq === 'annually' || freq === 'annual') {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    } else {
      // Default fallback
      baseDate.setMonth(baseDate.getMonth() + 1);
    }

    const formattedDate = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

    setScheduleDates([...scheduleDates, { date: formattedDate, name: cadence?.name || "" }]);
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
            const isValidYear = item.date && !isNaN(new Date(item.date).getTime()) && new Date(item.date).getFullYear() >= 2000 && new Date(item.date).getFullYear() <= 2100;
            const daysAway = isValidYear ? calculateDaysAway(item.date) : null;
            
            let diffDays = -1;
            if (isValidYear && item.date) {
              const targetDate = new Date(item.date);
              targetDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
            }

            let pillText = null;
            let pillBg = '';
            let pillColor = '';

            if (diffDays === 0) {
              pillText = 'NEEDS CLOSE';
              pillBg = '#fef3c7';
              pillColor = '#d97706';
            } else if (diffDays > 0 && diffDays < 15) {
              pillText = 'UPCOMING';
              pillBg = '#ede9fe';
              pillColor = '#7c3aed';
            } else if (diffDays >= 15) {
              pillText = 'SCHEDULED';
              pillBg = '#e0f2fe';
              pillColor = '#0284c7';
            }
            
            return (
              <div key={index} className="border rounded p-3 mb-3 d-flex flex-column gap-2 text-start" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <Form.Control 
                      type="date"
                      value={item.date}
                      min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                      onChange={(e) => handleUpdateDate(index, 'date', e.target.value)}
                      className="shadow-none py-1"
                      style={{ width: '150px', borderColor: '#cbd5e1', fontSize: '14px' }}
                    />
                    {item.date && (
                      <div className="d-flex align-items-center gap-2">
                        {pillText && (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: pillBg, color: pillColor, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                            {pillText}
                          </span>
                        )}
                        <span 
                          className={diffDays !== 0 ? "text-muted" : ""} 
                          style={{ 
                            fontSize: '13px', 
                            color: diffDays === 0 ? '#0284c7' : '',
                            fontWeight: diffDays === 0 ? '600' : 'normal'
                          }}
                        >
                          {daysAway}
                        </span>
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
        <Button 
          variant="primary" 
          className="fw-bold px-4 rounded-pill" 
          disabled={isSubmitting} 
          onClick={handleSave}
        >
          {t("Done")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScheduleDatesModal;
