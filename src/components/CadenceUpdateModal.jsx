import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const CadenceUpdateModal = ({ show, onHide, bet, actionType, onSave }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(bet?.status || 'Active');
  const [learningState, setLearningState] = useState(bet?.learning_state || 'Testing');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize when bet changes
  React.useEffect(() => {
    if (bet) {
      setStatus(bet.status || 'Active');
      setLearningState(bet.learning_state || 'Testing');
      setAdditionalInfo('');
    }
  }, [bet, show]);

  const handleSubmit = async () => {
    setIsSaving(true);
    await onSave({
      status,
      learning_state: learningState,
      additional_info: additionalInfo,
      action: actionType
    });
    setIsSaving(false);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold fs-4">
          {actionType === 'Close' ? 'Close Bet' : 'Capture Learning'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-4">
        <p className="text-muted mb-4">
          Updating bet: <strong>{bet?.project_name || bet?.initiative_name || bet?.name}</strong>
        </p>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold" style={{ fontSize: '12px' }}>Status</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} className="shadow-none" style={{ borderColor: '#0c71b9' }}>
            <option value="Active">Active</option>
            <option value="At Risk">At Risk</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold" style={{ fontSize: '12px' }}>Learning State</Form.Label>
          <Form.Select value={learningState} onChange={(e) => setLearningState(e.target.value)} className="shadow-none" style={{ borderColor: '#0c71b9' }}>
            <option value="Testing">Testing</option>
            <option value="Validated">Validated</option>
            <option value="Invalidated">Invalidated</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold" style={{ fontSize: '12px' }}>Additional Information</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={3} 
            value={additionalInfo} 
            onChange={(e) => setAdditionalInfo(e.target.value)} 
            placeholder="Add any notes, learnings or outcomes..."
            className="shadow-none"
            style={{ borderColor: '#0c71b9' }}
          />
        </Form.Group>
      </Modal.Body>
      
      <Modal.Footer className="border-0 px-4 pb-4 pt-0">
        <Button variant="outline-secondary" className="rounded-pill fw-bold px-4" onClick={onHide} disabled={isSaving}>
          Cancel
        </Button>
        <Button 
          className="rounded-pill fw-bold px-4 border-0 shadow-none text-white d-flex align-items-center gap-2" 
          style={{ backgroundColor: '#0c71b9' }} 
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <><span className="spinner-border spinner-border-sm" /> Saving...</>
          ) : (
            'Submit Update'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CadenceUpdateModal;
