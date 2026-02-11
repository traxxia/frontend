import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { ArrowRight, Zap } from 'lucide-react';
import PricingPlanCard from './PricingPlanCard';
import '../styles/UpgradeModal.css';

const UpgradeModal = ({ show, onHide, onUpgradeSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = sessionStorage.getItem('token');

            const [plansRes, subRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/plans`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/api/subscription/plan-details`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!plansRes.ok || !subRes.ok) throw new Error('Failed to fetch data');

            const plansData = await plansRes.json();
            const subData = await subRes.json();

            setPlans(plansData.plans || []);
            setSubscription(subData);

            // Auto-select the next plan if current is essential
            const currentPlanName = subData.plan.toLowerCase();
            const nextPlan = plansData.plans.find(p => p.name.toLowerCase() !== currentPlanName);
            if (nextPlan) setSelectedPlanId(nextPlan._id);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!selectedPlanId) return;

        try {
            setSubmitting(true);
            setError(null);
            const token = sessionStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/api/subscription/upgrade`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ plan_id: selectedPlanId })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upgrade failed');
            }

            const updatedSub = await response.json();
            // Update sessionStorage to reflect new plan
            sessionStorage.setItem('userPlan', updatedSub.plan);

            if (onUpgradeSuccess) {
                onUpgradeSuccess(updatedSub);
            }
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedPlan = plans.find(p => p._id === selectedPlanId);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="upgrade-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <Zap className="text-warning me-2" />
                    Upgrade Your Plan
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Loading your options...</p>
                    </div>
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : (
                    <>
                        <div className="current-usage-box p-3 rounded-3 mb-4">
                            <h6 className="mb-3 text-uppercase small fw-bold text-muted">Current Usage</h6>
                            <Row className="text-center">
                                <Col>
                                    <div className="usage-item">
                                        <div className="fw-bold fs-5 text-primary">
                                            {subscription.usage.workspaces.current} / {subscription.usage.workspaces.limit}
                                        </div>
                                        <div className="small text-muted">Workspaces</div>
                                    </div>
                                </Col>
                                <Col className="border-start border-end">
                                    <div className="usage-item">
                                        <div className="fw-bold fs-5 text-primary">
                                            {subscription.usage.collaborators.current} / {subscription.usage.collaborators.limit}
                                        </div>
                                        <div className="small text-muted">Collaborators</div>
                                    </div>
                                </Col>
                                <Col>
                                    <div className="usage-item">
                                        <div className="fw-bold fs-5 text-primary">
                                            {subscription.usage.projects.current} / {subscription.usage.projects.limit}
                                        </div>
                                        <div className="small text-muted">Projects</div>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <div className="plans-grid">
                            {plans.map((plan) => (
                                <PricingPlanCard
                                    key={plan._id}
                                    plan={plan}
                                    isSelected={selectedPlanId === plan._id}
                                    onSelect={setSelectedPlanId}
                                />
                            ))}
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="link" onClick={onHide} className="text-decoration-none text-muted">
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleUpgrade}
                    disabled={submitting || !selectedPlanId || (subscription?.plan?.toLowerCase() === selectedPlan?.name?.toLowerCase())}
                    className="px-4 py-2 fw-bold"
                >
                    {submitting ? <Spinner animation="border" size="sm" /> : 'Confirm Upgrade'}
                    {!submitting && <ArrowRight size={18} className="ms-2" />}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UpgradeModal;
