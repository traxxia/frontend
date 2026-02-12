import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Briefcase, Users, CheckCircle, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

const UpgradeReactivationModal = ({
    show,
    onHide,
    data,
    onConfirm,
    submitting,
    externalError
}) => {
    const [selectedBusinessIds, setSelectedBusinessIds] = useState([]);
    const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState([]);
    const [error, setError] = useState(null);

    const errorMessage = externalError || error;

    const {
        archived_businesses = [],
        inactive_collaborators = [],
        limits = {},
        plan_id
    } = data || {};

    const maxWorkspaces = limits.max_workspaces || 3;
    const maxCollaborators = limits.max_collaborators || 3;

    const handleBusinessToggle = (id) => {
        if (selectedBusinessIds.includes(id)) {
            setSelectedBusinessIds(selectedBusinessIds.filter(bid => bid !== id));
        } else {
            // Count already active businesses (this information isn't perfect here, but we can guess)
            // Backend will validate anyway. For UX, let's just limit selection.
            if (selectedBusinessIds.length >= maxWorkspaces - 1) {
                setError(`You can only reactivate up to ${maxWorkspaces - 1} additional workspaces.`);
                return;
            }
            setSelectedBusinessIds([...selectedBusinessIds, id]);
            setError(null);
        }
    };

    const handleCollaboratorToggle = (id) => {
        if (selectedCollaboratorIds.includes(id)) {
            setSelectedCollaboratorIds(selectedCollaboratorIds.filter(cid => cid !== id));
        } else {
            if (selectedCollaboratorIds.length >= maxCollaborators) {
                setError(`You can only reactivate up to ${maxCollaborators} collaborators.`);
                return;
            }
            setSelectedCollaboratorIds([...selectedCollaboratorIds, id]);
            setError(null);
        }
    };

    const handleConfirm = () => {
        onConfirm({
            plan_id,
            reactivate_business_ids: selectedBusinessIds,
            reactivate_collaborator_ids: selectedCollaboratorIds
        });
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="upgrade-reactivation-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold d-flex align-items-center">
                    <Zap className="text-primary me-2" size={24} />
                    Upgrade & Reactivate
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
                <Alert variant="primary" className="mb-4 small border-0 bg-light-blue shadow-sm">
                    <div className="d-flex">
                        <ArrowRight className="me-2 flex-shrink-0" size={16} />
                        <div>
                            Welcome to the <strong>Advanced</strong> plan!
                            Select collaborators to restore their access, and reactivate the workspaces they need.
                        </div>
                    </div>
                </Alert>

                {errorMessage && <Alert variant="danger" className="py-2 small">{errorMessage}</Alert>}

                {/* ARCHIVED BUSINESSES SECTION */}
                {archived_businesses.length > 0 && (
                    <div className="mb-4">
                        <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                            <Briefcase size={16} className="me-1" />
                            Restore Archived Workspaces ({selectedBusinessIds.length}/{maxWorkspaces - 1} allowed)
                        </h6>
                        <Row xs={1} md={2} className="g-3">
                            {archived_businesses.map(business => (
                                <Col key={business._id}>
                                    <Card
                                        className={`h-100 cursor-pointer selection-card ${selectedBusinessIds.includes(business._id) ? 'selected' : ''}`}
                                        onClick={() => handleBusinessToggle(business._id)}
                                    >
                                        <Card.Body className="p-3 d-flex align-items-center">
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedBusinessIds.includes(business._id)}
                                                onChange={() => { }}
                                                className="me-2"
                                            />
                                            <div className="ms-2 overflow-hidden flex-grow-1">
                                                <div className="fw-bold text-truncate">{business.business_name}</div>
                                                <div className="small text-muted">Archived Workspace</div>
                                            </div>
                                            {selectedBusinessIds.includes(business._id) && (
                                                <CheckCircle className="ms-auto text-primary" size={20} />
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* INACTIVE COLLABORATORS SECTION */}
                {inactive_collaborators.length > 0 && (
                    <div className="mb-4">
                        <h6 className="mb-3 text-uppercase small fw-bold text-muted d-flex align-items-center">
                            <Users size={16} className="me-1" />
                            Restore Collaborators ({selectedCollaboratorIds.length}/{maxCollaborators} allowed)
                        </h6>
                        <div className="collaborator-list">
                            {inactive_collaborators.map(user => (
                                <Card
                                    key={user._id}
                                    className={`mb-3 collaborator-card ${selectedCollaboratorIds.includes(user._id) ? 'selected' : ''}`}
                                >
                                    <Card.Body className="p-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedCollaboratorIds.includes(user._id)}
                                                onChange={() => handleCollaboratorToggle(user._id)}
                                                className="me-2"
                                            />
                                            <div className="ms-2 overflow-hidden flex-grow-1">
                                                <div className="fw-bold text-truncate">{user.name || user.email}</div>
                                                <div className="small text-muted">{user.email}</div>
                                            </div>
                                            {selectedCollaboratorIds.includes(user._id) && (
                                                <Badge bg="primary" pill>Selected</Badge>
                                            )}
                                        </div>

                                        {/* Show associated businesses as badges */}
                                        {user.associated_business_ids?.length > 0 && (
                                            <div className="ms-4 ps-2 border-start mt-2">
                                                <div className="x-small text-muted mb-1">Associated Workspaces:</div>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {user.associated_business_ids.map(bid => {
                                                        const business = archived_businesses.find(b => b._id === bid);
                                                        if (!business) return null;
                                                        const isSelected = selectedBusinessIds.includes(bid);
                                                        return (
                                                            <Badge
                                                                key={bid}
                                                                bg={isSelected ? "success" : "light"}
                                                                text={isSelected ? "white" : "dark"}
                                                                className="border cursor-pointer fw-normal"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleBusinessToggle(bid);
                                                                }}
                                                            >
                                                                {business.business_name}
                                                                {isSelected && <CheckCircle size={10} className="ms-1 font-weight-bold" />}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="link" onClick={onHide} className="text-decoration-none text-muted">
                    Skip for Now
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="px-4 py-2 fw-bold d-flex align-items-center gap-2"
                >
                    <ShieldCheck size={18} />
                    {submitting ? 'Updating...' : 'Confirm & Reactivate'}
                </Button>
            </Modal.Footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .upgrade-reactivation-modal .modal-content {
                    border-radius: 12px;
                    border: none;
                }
                .collaborator-card {
                    transition: all 0.2s ease;
                    border: 2px solid #f0f0f0;
                }
                .collaborator-card.selected {
                    border-color: #0d6efd;
                    background-color: #f8fbff;
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
                .business-mini-card {
                    background: white;
                    border: 1px solid #dee2e6;
                    transition: all 0.1s ease;
                }
                .business-mini-card:hover {
                    border-color: #adb5bd;
                }
                .business-mini-card.selected {
                    background: #e7f1ff;
                    border-color: #0d6efd;
                }
                .mini-check .form-check-input {
                    width: 1rem;
                    height: 1rem;
                    margin-top: 0;
                }
                .bg-light-blue {
                    background-color: #f0f7ff;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}} />
        </Modal>
    );
};

export default UpgradeReactivationModal;
