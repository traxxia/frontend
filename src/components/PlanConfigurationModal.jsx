import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Card, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { AlertTriangle, UserCheck, Shield, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const PlanConfigurationModal = ({ show, onHide, data, onConfirm, submitting, externalError }) => {
    const { t } = useTranslation();
    const [selections, setSelections] = useState({});
    const [error, setError] = useState(null);

    // Initialize selections with currently active items
    useEffect(() => {
        if (show && data?.configurable_features) {
            const initial = {};
            data.configurable_features.forEach(feat => {
                // Initialize with active items up to the limit
                initial[feat.id] = feat.active_items.slice(0, feat.limit).map(i => i._id);
            });
            setSelections(initial);
            setError(null);
        } else if (!show) {
            setSelections({});
            setError(null);
        }
    }, [show, data]);

    const handleToggle = (featureId, itemId, limit, featureTitle) => {
        setSelections(prev => {
            const currentList = prev[featureId] || [];
            
            // If already selected, deselect
            if (currentList.includes(itemId)) {
                setError(null);
                return { ...prev, [featureId]: currentList.filter(id => id !== itemId) };
            }
            
            // If trying to select more than limit
            if (currentList.length >= limit) {
                setError(`${t("You can only select up to")} ${limit} ${t("active")} ${t(featureTitle)}.`);
                return prev;
            }

            // Can select
            setError(null);
            return { ...prev, [featureId]: [...currentList, itemId] };
        });
    };

    const handleConfirm = () => {
        if (!data?.configurable_features) return;

        // Final validation
        for (const feat of data.configurable_features) {
            const selectedCount = selections[feat.id]?.length || 0;
            if (selectedCount > feat.limit) {
                setError(`${t("You have selected too many")} ${t(feat.title)}. ${t("Maximum allowed is")} ${feat.limit}.`);
                return;
            }
        }

        onConfirm({
            plan_id: data.plan_id,
            selections: selections
        });
    };

    const errorMessage = externalError || error;
    const isOverLimit = data?.configurable_features?.some(feat => (selections[feat.id]?.length || 0) > feat.limit);

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" keyboard={false} centered scrollable>
            <Modal.Header className="bg-light border-bottom border-secondary-subtle">
                <Modal.Title className="fw-bold d-flex align-items-center">
                    <Shield className="text-primary me-2" size={24} />
                    {t("Plan Configuration")}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-4 bg-white" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Alert variant="info" className="mb-4 border-0 shadow-sm d-flex align-items-start bg-light-blue text-primary-emphasis">
                    <Shield className="me-3 flex-shrink-0 mt-1" size={22} />
                    <div>
                        <h6 className="fw-bold mb-1">
                            {t("Configuring transition to")} {t(data?.new_plan_name) || t("the new plan")}
                        </h6>
                        <p className="mb-0 small opacity-75">
                            {t("Please review your resources and select which items should remain active to fit within your new plan limits. Unselected items will simply be archived.")}
                        </p>
                    </div>
                </Alert>

                {errorMessage && (
                    <Alert variant="danger" className="d-flex align-items-center mb-4 border-0 shadow-sm">
                        <AlertTriangle className="me-2 flex-shrink-0" size={18} />
                        <div>{t(errorMessage)}</div>
                    </Alert>
                )}

                {data?.configurable_features?.map((feature) => (
                    <div key={feature.id} className="mb-4 bg-light p-3 rounded border">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="fw-bold mb-1 text-primary">{t(feature.title)}</h6>
                                <small className="text-muted">
                                    {t("Select up to")} {feature.limit} {t("active items")}.
                                </small>
                            </div>
                            <div className="text-end">
                                <Badge bg={(selections[feature.id]?.length || 0) > feature.limit ? "danger" : "primary"} className="px-3 py-2 rounded-pill shadow-sm">
                                    {selections[feature.id]?.length || 0} / {feature.limit} {t("Selected")}
                                </Badge>
                            </div>
                        </div>

                        <Row xs={1} md={2} className="g-3">
                            {[...feature.active_items, ...feature.archived_items].map(item => {
                                const isSelected = selections[feature.id]?.includes(item._id);
                                const isActive = feature.active_items.some(i => i._id === item._id);
                                
                                return (
                                    <Col key={item._id}>
                                        <Card 
                                            className={`h-100 cursor-pointer selection-card transition-all ${isSelected ? 'selected bg-light-blue border-primary shadow-sm' : 'border-light-subtle'}`}
                                            onClick={() => handleToggle(feature.id, item._id, feature.limit, feature.title)}
                                            style={{ transition: 'all 0.2s ease-in-out' }}
                                        >
                                            <Card.Body className="p-3 d-flex align-items-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by onClick on the Card
                                                    className="me-2 cursor-pointer"
                                                />
                                                <div className="flex-grow-1 overflow-hidden me-2">
                                                    <div className="fw-bold text-truncate" title={item.name || item.business_name}>
                                                        {item.name || item.business_name}
                                                    </div>
                                                    {item.email && <div className="text-muted small text-truncate" title={item.email}>{item.email}</div>}
                                                </div>
                                                <Badge bg={isActive ? "success" : "secondary"}>
                                                    {isActive ? t("Active") : t("Archived")}
                                                </Badge>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                        {feature.active_items.length === 0 && feature.archived_items.length === 0 && (
                            <div className="text-center text-muted small py-2">{t("No items found.")}</div>
                        )}
                    </div>
                ))}
            </Modal.Body>

            <Modal.Footer className="bg-light border-top border-secondary-subtle px-4 py-3 pb-4">
                <Button variant="outline-secondary" onClick={onHide} disabled={submitting} className="fw-bold px-4">
                    {t("Cancel")}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={submitting || isOverLimit}
                    className="fw-bold px-4 d-flex align-items-center bg-gradient-primary border-0 shadow-sm"
                >
                    {submitting ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            {t("Processing...")}
                        </>
                    ) : (
                        <>
                            {t("Confirm Configuration")}
                            <ChevronRight size={18} className="ms-1" />
                        </>
                    )}
                </Button>
            </Modal.Footer>

            <style type="text/css">
                {`
                    .bg-light-blue { background-color: rgba(13, 110, 253, 0.05); }
                    .selection-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                `}
            </style>
        </Modal>
    );
};

export default PlanConfigurationModal;
