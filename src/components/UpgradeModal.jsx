import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { ArrowRight, Zap, CreditCard, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardNumberElement } from '@stripe/react-stripe-js';
import PricingPlanCard from './PricingPlanCard';
import DowngradeSelectionModal from './DowngradeSelectionModal';
import UpgradeReactivationModal from './UpgradeReactivationModal';
import PaymentForm from './PaymentForm';
import '../styles/UpgradeModal.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const UpgradeModalContent = ({
    onHide,
    loading,
    error,
    plans,
    subscription,
    selectedPlanId,
    setSelectedPlanId,
    paymentMethods = [],
    defaultPaymentMethodId,
    submitting,
    onProcessUpgrade,
    selectedPlan
}) => {
    const stripe = useStripe();
    const elements = useElements();

    // Default to the default PM, or 'new' if none exist
    const [selectedMethodId, setSelectedMethodId] = useState('new');
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        if (defaultPaymentMethodId) {
            setSelectedMethodId(defaultPaymentMethodId);
        } else if (paymentMethods && paymentMethods.length > 0) {
            setSelectedMethodId(paymentMethods[0].id);
        } else {
            setSelectedMethodId('new');
        }
    }, [defaultPaymentMethodId, paymentMethods]);

    const handleConfirm = async () => {
        setLocalError(null);
        let paymentMethodId = selectedMethodId;
        let saveNewCard = true; // Default true for existing cards (make them default)

        // If using new card, create payment method first
        if (selectedMethodId === 'new') {
            if (!stripe || !elements) return;

            const cardElement = elements.getElement(CardNumberElement);
            if (!cardElement) {
                setLocalError("Please complete the card details.");
                return;
            }

            try {
                const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });

                if (stripeError) {
                    setLocalError(stripeError.message);
                    return;
                }
                paymentMethodId = paymentMethod.id;
                saveNewCard = true;
            } catch (err) {
                setLocalError("Payment processing failed. Please try again.");
                console.error(err);
                return;
            }
        }

        // Proceed and pass save boolean
        onProcessUpgrade(paymentMethodId, saveNewCard);
    };

    return (
        <React.Fragment>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">
                    <Zap className="text-warning me-2" />
                    Plan Management
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Loading your options...</p>
                    </div>
                ) : (
                    <>
                        {error && <Alert variant="danger">{error}</Alert>}

                        {selectedPlan?.name?.toLowerCase() === 'essential' && subscription?.plan?.toLowerCase() !== 'essential' && (
                            <Alert variant="warning" className="mb-3 border-0 shadow-sm">
                                <div className="d-flex align-items-start">
                                    <ArrowRight className="me-2 flex-shrink-0 mt-1" size={18} />
                                    <div className="small">
                                        <h6 className="mb-2 fw-bold">⚠️ Downgrade Warning</h6>
                                        <p className="mb-2">
                                            Downgrading to <strong>Essential</strong> will impact your current setup:
                                        </p>
                                        <ul className="mb-0 ps-3">
                                            {subscription.usage.workspaces.current > 1 && (
                                                <li className="mb-1">
                                                    <strong>Workspaces:</strong> You currently have <strong>{subscription.usage.workspaces.current}</strong> active workspace(s).
                                                    Only <strong>1</strong> will remain active.
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </Alert>
                        )}

                        <div className="plans-grid mb-4">
                            {plans.map((plan) => (
                                <PricingPlanCard
                                    key={plan._id}
                                    plan={plan}
                                    isSelected={selectedPlanId === plan._id}
                                    onSelect={setSelectedPlanId}
                                />
                            ))}
                        </div>

                        {/* Payment Selection */}
                        <div className="payment-section border-top pt-3">
                            {paymentMethods.length > 0 && (
                                <>
                                    <h6 className="fw-bold mb-3">Preferred Payment Methods</h6>
                                    {/* Saved Cards */}
                                    {paymentMethods.map(pm => (
                                        <div
                                            key={pm.id}
                                            className="mb-3 p-3 border rounded position-relative"
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                borderColor: selectedMethodId === pm.id ? '#666EE8' : '#e0e0e0',
                                                backgroundColor: selectedMethodId === pm.id ? 'rgba(72, 100, 161, 0.05)' : 'transparent',
                                                boxShadow: selectedMethodId === pm.id ? '0 0 0 1px #666EE8' : 'none',
                                                width: 'fit-content',
                                                minWidth: '320px'
                                            }}
                                            onClick={() => setSelectedMethodId(pm.id)}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="me-3 p-2 bg-light rounded-circle">
                                                    <CreditCard size={20} className="text-secondary" />
                                                </div>
                                                <div className="pe-4">
                                                    <div className="fw-bold text-dark fs-6">•••• •••• •••• {pm.last4}</div>
                                                    <div className="small text-muted text-uppercase mt-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                                        {pm.brand} | Expires {pm.exp_month}/{pm.exp_year}
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedMethodId === pm.id && (
                                                <div className="position-absolute top-0 end-0 m-2 text-primary">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="my-4 d-flex align-items-center">
                                        <hr className="flex-grow-1 border-secondary-subtle" />
                                        <span className="px-3 text-muted small fw-bold text-uppercase">Or pay with</span>
                                        <hr className="flex-grow-1 border-secondary-subtle" />
                                    </div>
                                </>
                            )}

                            <h6 className="fw-bold mb-3">Other Payment Methods</h6>

                            <PaymentForm
                                error={localError}
                                hideHeader={true}
                                isActive={selectedMethodId === 'new'}
                                onMethodSelect={() => setSelectedMethodId('new')}
                            />
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 d-flex justify-content-end align-items-center">
                <Button variant="link" onClick={onHide} className="text-decoration-none text-muted me-2">
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={submitting || !selectedPlanId || (subscription?.plan?.toLowerCase() === selectedPlan?.name?.toLowerCase()) || (selectedMethodId === 'new' && !stripe)}
                    className="px-4 py-2 fw-bold"
                >
                    {submitting ? <Spinner animation="border" size="sm" /> :
                        (selectedPlan?.name?.toLowerCase() === 'essential' ? 'Process Downgrade' : 'Confirm Upgrade')}
                    {!submitting && <ArrowRight size={18} className="ms-2" />}
                </Button>
            </Modal.Footer>
        </React.Fragment>
    );
};

const UpgradeModal = ({ show, onHide, onUpgradeSuccess, paymentMethod }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    // Downgrade selection state
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [selectionData, setSelectionData] = useState(null);

    // Reactivation selection state
    const [showReactivationModal, setShowReactivationModal] = useState(false);
    const [reactivationData, setReactivationData] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show]);

    const isDowngradeMode = typeof show === 'object' && show.mode === 'downgrade';

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

            if (isDowngradeMode) {
                const essentialPlan = plansData.plans.find(p => p.name.toLowerCase() === 'essential');
                if (essentialPlan) {
                    setSelectedPlanId(essentialPlan._id);
                }
            } else {
                const currentPlanName = subData.plan.toLowerCase();
                const nextPlan = plansData.plans.find(p => p.name.toLowerCase() !== currentPlanName);
                if (nextPlan) setSelectedPlanId(nextPlan._id);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const processUpgrade = async (newPaymentMethodId, saveCard) => {
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
                body: JSON.stringify({
                    plan_id: selectedPlanId,
                    paymentMethodId: newPaymentMethodId,
                    saveCard: saveCard
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upgrade failed');
            }

            if (data.requires_selection) {
                setSelectionData({ ...data, plan_id: selectedPlanId });
                setShowSelectionModal(true);
                return;
            }

            if (data.requires_reactivation_selection) {
                setReactivationData({ ...data, plan_id: selectedPlanId });
                setShowReactivationModal(true);
                return;
            }

            sessionStorage.setItem('userPlan', data.plan);
            if (onUpgradeSuccess) onUpgradeSuccess(data);
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleProcessReactivation = async (selection) => {
        try {
            setSubmitting(true);
            setError(null);
            const token = sessionStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/api/subscription/process-reactivation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selection)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Reactivation failed');
            }

            sessionStorage.setItem('userPlan', data.plan);
            if (onUpgradeSuccess) onUpgradeSuccess(data);
            setShowReactivationModal(false);
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleProcessDowngrade = async (selection) => {
        try {
            setSubmitting(true);
            setError(null);
            const token = sessionStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/api/subscription/process-downgrade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan_id: selectionData.plan_id,
                    active_business_id: selection.active_business_id,
                    active_collaborator_ids: selection.active_collaborator_ids
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Downgrade failed');
            }

            sessionStorage.setItem('userPlan', data.plan);
            if (onUpgradeSuccess) onUpgradeSuccess(data);
            setShowSelectionModal(false);
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedPlan = plans.find(p => p._id === selectedPlanId);

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered className="upgrade-modal" backdrop="static" keyboard={false}>
                <Elements stripe={stripePromise}>
                    <UpgradeModalContent
                        onHide={onHide}
                        loading={loading}
                        error={error}
                        plans={plans}
                        subscription={subscription}
                        selectedPlanId={selectedPlanId}
                        setSelectedPlanId={setSelectedPlanId}
                        paymentMethods={subscription?.payment_methods}
                        defaultPaymentMethodId={subscription?.default_payment_method_id}
                        submitting={submitting}
                        onProcessUpgrade={processUpgrade}
                        selectedPlan={selectedPlan}
                    />
                </Elements>
            </Modal>

            <DowngradeSelectionModal
                show={showSelectionModal}
                onHide={() => setShowSelectionModal(false)}
                data={selectionData}
                onConfirm={handleProcessDowngrade}
                submitting={submitting}
                externalError={error}
            />

            <UpgradeReactivationModal
                show={showReactivationModal}
                onHide={() => setShowReactivationModal(false)}
                data={reactivationData}
                onConfirm={handleProcessReactivation}
                submitting={submitting}
                externalError={error}
            />
        </>
    );
};

export default UpgradeModal;
