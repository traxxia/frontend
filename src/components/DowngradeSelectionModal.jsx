import React, { useState } from 'react';
import { Modal, Button, Form, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Briefcase, Users, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const DowngradeSelectionModal = ({
    show,
    onHide,
    data,
    onConfirm,
    submitting
}) => {
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState([]);
    const [error, setError] = useState(null);

    const { businesses = [], new_plan } = data || {};

    const handleBusinessSelect = (businessId) => {
        setSelectedBusinessId(businessId);
        // Reset collaborator selection when business changes
        setSelectedCollaboratorIds([]);
    };

    const handleCollaboratorToggle = (userId) => {
        setSelectedCollaboratorIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleConfirm = () => {
        if (!selectedBusinessId) {
            setError('Please select a workspace to keep active.');
            return;
        }
        onConfirm({
            active_business_id: selectedBusinessId,
            active_collaborator_ids: selectedCollaboratorIds
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
                <Alert variant="info" className="mb-4 small border-0 bg-light-blue shadow-sm">
                    <div className="d-flex">
                        <ArrowRight className="me-2 flex-shrink-0" size={16} />
                        <div>
                            You are downgrading to the <strong>{new_plan}</strong> plan.
                            Please select one workspace to remain active. All other workspaces will be
                            archived (read-only mode). You can also choose which collaborators keep access to the active workspace.
                        </div>
                    </div>
                </Alert>

                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                    <Briefcase size={16} className="me-1" />
                    Select Active Workspace
                </h6>

                <div className="business-list mb-4">
                    <Row xs={1} md={2} className="g-3">
                        {businesses.map(business => (
                            <Col key={business._id}>
                                <Card
                                    className={`h-100 cursor-pointer selection-card ${selectedBusinessId === business._id ? 'selected' : ''}`}
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
                                                {business.collaborator_count} Collaborators
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

                {selectedBusiness && selectedBusiness.collaborators && selectedBusiness.collaborators.length > 0 && (
                    <>
                        <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                            <Users size={16} className="me-1" />
                            Select Active Collaborators for "{selectedBusiness.business_name}"
                        </h6>
                        <div className="collaborator-selection">
                            {/* Note: In a real app, we'd fetch collaborator names. For now, showing placeholders if only IDs available */}
                            <Row xs={1} md={2} className="g-2">
                                {selectedBusiness.collaborators.map(collab => (
                                    <Col key={collab.user_id || collab}>
                                        <Card
                                            className={`h-100 cursor-pointer selection-card p-2 ${selectedCollaboratorIds.includes(collab.user_id || collab) ? 'selected' : ''}`}
                                            onClick={() => handleCollaboratorToggle(collab.user_id || collab)}
                                        >
                                            <div className="d-flex align-items-center px-1">
                                                <div className="form-check me-2">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedCollaboratorIds.includes(collab.user_id || collab)}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="small fw-medium text-truncate">
                                                    {collab.email || 'Collaborator'}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                            <div className="mt-2 small text-muted">
                                <Badge bg="light" text="dark" className="border">Note</Badge> collaborators not selected will lose access but won't be deleted.
                            </div>
                        </div>
                    </>
                )}
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
            `}} />
        </Modal>
    );
};

export default DowngradeSelectionModal;
