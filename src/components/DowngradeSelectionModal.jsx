import React, { useState } from 'react';
import { Modal, Button, Form, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Briefcase, Users, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const DowngradeSelectionModal = ({
    show,
    onHide,
    data,
    onConfirm,
    submitting,
    externalError
}) => {
    const [selectedBusinessId, setSelectedBusinessId] = useState(null);
    const [error, setError] = useState(null);

    const errorMessage = externalError || error;

    const { businesses = [], new_plan } = data || {};

    const handleBusinessSelect = (businessId) => {
        setSelectedBusinessId(businessId);
    };

    const handleConfirm = () => {
        if (!selectedBusinessId) {
            setError('Please select a workspace to keep active.');
            return;
        }
        onConfirm({
            active_business_id: selectedBusinessId
        });
    };

    const selectedBusiness = businesses.find(b => b._id === selectedBusinessId);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="downgrade-selection-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold d-flex align-items-center">
                    <AlertTriangle className="text-warning me-2" size={24} />
                    Downgrade Configuration
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
                <Alert variant="warning" className="mb-3 border-0 shadow-sm">
                    <div className="d-flex align-items-start">
                        <AlertTriangle className="me-2 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h6 className="mb-2 fw-bold">Downgrade Impact</h6>
                            <p className="mb-2 small">
                                You are downgrading to the <strong>{new_plan}</strong> plan.
                                Based on your current usage, the following changes will occur:
                            </p>
                            <div className="downgrade-impact-details small">
                                <div className="mb-2">
                                    <strong>📊 Current Usage:</strong>
                                    <ul className="mb-1 mt-1 ps-3">
                                        <li>Workspaces: <strong>{businesses.length}</strong> active</li>
                                        <li>Collaborators: <strong>{businesses.reduce((sum, b) => sum + (b.collaborator_count || 0), 0)}</strong> total</li>
                                    </ul>
                                </div>
                                <div className="mb-2">
                                    <strong>⚠️ What will happen:</strong>
                                    <ul className="mb-0 mt-1 ps-3">
                                        <li><strong>Workspaces:</strong> Only 1 workspace will remain active. {businesses.length > 1 ? `${businesses.length - 1} workspace(s) will be archived (read-only mode).` : ''}</li>
                                        <li><strong>Collaborators:</strong> All collaborators will be archived and lose access to all workspaces.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Alert>

                {errorMessage && <Alert variant="danger" className="py-2 small mb-3">{errorMessage}</Alert>}

                <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                    <Briefcase size={16} className="me-1" />
                    Select Workspace to Keep Active
                </h6>

                <div className="business-list mb-4">
                    <Row xs={1} md={2} className="g-3">
                        {businesses.map(business => (
                            <Col key={business._id}>
                                <Card
                                    className={`h - 100 cursor - pointer selection - card ${selectedBusinessId === business._id ? 'selected' : ''} `}
                                    onClick={() => handleBusinessSelect(business._id)}
                                >
                                    <Card.Body className="p-3 d-flex align-items-center">
                                        <div className="form-check me-0 pe-0">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                checked={selectedBusinessId === business._id}
                                                readOnly
                                            />
                                        </div>
                                        <div className="ms-3 overflow-hidden">
                                            <div className="fw-bold text-truncate">{business.business_name}</div>
                                            <div className="small text-muted">
                                                Active Workspace
                                            </div>
                                        </div>
                                        {selectedBusinessId === business._id && (
                                            <CheckCircle className="ms-auto text-primary" size={20} />
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="link" onClick={onHide} className="text-decoration-none text-muted">
                    Back to Plans
                </Button>
                <Button
                    variant="warning"
                    onClick={handleConfirm}
                    disabled={submitting || !selectedBusinessId}
                    className="px-4 py-2 fw-bold"
                >
                    {submitting ? 'Processing...' : 'Downgrade & Archive Others'}
                </Button>
            </Modal.Footer>

            <style dangerouslySetInnerHTML={{
                __html: `
    .downgrade-selection-modal .modal-content {
        border-radius: 12px;
        border: none;
    }
    .selection-card {
        transition: all 0.2s ease;
        border: 2px solid #f0f0f0;
        cursor: pointer;
    }
    .selection-card:hover {
        border-color: #e0e0e0;
        background-color: #fcfcfc;
    }
    .selection-card.selected {
        border-color: #0d6efd;
        background-color: #f0f7ff;
    }
    .cursor-pointer {
        cursor: pointer;
    }
    .bg-light-blue {
        background-color: #f0faff;
    }
    .downgrade-impact-details ul {
        margin-bottom: 0.5rem;
    }
    .downgrade-impact-details li {
        margin-bottom: 0.25rem;
        line-height: 1.5;
    }
`}} />
        </Modal>
    );
};

export default DowngradeSelectionModal;
