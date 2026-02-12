import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Spinner, Alert, Button } from 'react-bootstrap';
import {
    CreditCard, Calendar, BarChart3, Zap, ShieldCheck,
    Building2, Users, Check, Plus, ArrowRight, Settings,
    Activity, User, Lock, Briefcase
} from 'lucide-react';
import { MdArrowDownward } from 'react-icons/md';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from './UpgradeModal';
import '../styles/accessmanagement.css';

const SubscriptionTab = ({ onToast }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

    const fetchSubDetails = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/subscription/plan-details`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch subscription details');
            const data = await response.json();
            setSubscription(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubDetails();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">{t('loading_subscription_details') || 'Loading subscription details...'}</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!subscription) return null;

    const { plan, usage, expires_at, available_plans = [], billing_history = [] } = subscription;
    const currentPlanName = plan.toLowerCase();

    const getDaysRemaining = (date) => {
        if (!date) return 0;
        const diff = new Date(date) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const daysRemaining = getDaysRemaining(expires_at);

    const isHigherTier = (pName) => {
        const tiers = ['essential', 'advanced', 'professional'];
        return tiers.indexOf(pName.toLowerCase()) > tiers.indexOf(currentPlanName);
    };

    return (
        <div className="subscription-redesign-wrapper">
            <Row>
                <Col md={11}>

                    {/* Plan Section */}
                    <section id="subscription-plan" className="mb-3">
                        <h5 className="autorenew-title mb-4">{t("subscription_plans") || "Subscription Plans"}</h5>
                        <div className="plan-cards-row">
                            {available_plans.map((p) => {
                                const isCurrent = p.name.toLowerCase() === currentPlanName;
                                const isProfessional = p.name.toLowerCase() === 'professional' || p.name.toLowerCase() === 'advanced';

                                return (
                                    <div key={p._id} className={`plan-card-mockup ${isCurrent ? 'premium-type' : ''}`}>
                                        {isCurrent && (
                                            <div className="check-badge-corner">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        )}
                                        <div className="plan-header-mockup">
                                            <div>
                                                <div className="plan-name-mockup text-capitalize">{t(p.name.toLowerCase()) || p.name}</div>
                                                <div className="plan-subtitle-mockup">
                                                    {isCurrent ? `${daysRemaining} ${t("days_remaining") || "days remaining"}` : `${t("full_access") || "Full access"}`}
                                                </div>
                                            </div>
                                            <div className="plan-price-mockup">
                                                ${p.price}<span className="plan-price-period">/month</span>
                                            </div>
                                        </div>
                                        <div className="plan-card-actions">
                                            {isCurrent ? (
                                                <button className="btn-plan-white" disabled style={{ cursor: 'default' }}>
                                                    {t("current_plan") || "Current Plan"}
                                                </button>
                                            ) : (
                                                <Button
                                                    className="btn-plan-primary"
                                                    onClick={() => setShowUpgradeModal(true)}
                                                >
                                                    {isHigherTier(p.name) ? (t("upgrade") || "Upgrade") : (t("downgrade") || "Downgrade")}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mt-3 pt-4 mb-3 pb-4 border-bottom border-top">
                        <h5 className="autorenew-title">{t("usage_metrics") || "Usage Metrics"}</h5>
                        <Row className="g-4">
                            <Col md={4}>
                                <div className="usage-progress-container">
                                    <div className="usage-metric-item">
                                        <span className="usage-label-text">{t("workspaces") || "Workspaces"}</span>
                                        <span className="usage-value-text">{usage.workspaces.current} / {usage.workspaces.limit}</span>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="usage-progress-container">
                                    <div className="usage-metric-item">
                                        <span className="usage-label-text">{t("collaborators") || "Collaborators"}</span>
                                        <span className="usage-value-text">{usage.collaborators.current} / {usage.collaborators.limit}</span>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="usage-progress-container">
                                    <div className="usage-metric-item">
                                        <span className="usage-label-text">{t("projects") || "Projects"}</span>
                                        <span className="usage-value-text">{usage.projects.current} / {usage.projects.limit === 'unlimited' ? '∞' : usage.projects.limit}</span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </section>

                    {/* Billing History Section */}
                    <section className="mb-5">
                        <h5 className="autorenew-title mb-3">{t("billing_history") || "Billing History"}</h5>
                        <table className="billing-history-table">
                            <thead>
                                <tr>
                                    <th>{t("date") || "Date"}</th>
                                    <th>{t("details") || "Details"}</th>
                                    <th>{t("amount") || "Amount"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billing_history.length > 0 ? billing_history.map((bh, idx) => (
                                    <tr key={idx}>
                                        <td className="billing-date">{new Date(bh.date).toLocaleDateString()}</td>
                                        <td className="text-capitalize">{bh.plan_name} plan</td>
                                        <td className="billing-amount">${bh.amount}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4 text-muted">
                                            {t("no_billing_history") || "No billing history found"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                </Col>
            </Row>

            <UpgradeModal
                show={showUpgradeModal}
                onHide={() => setShowUpgradeModal(false)}
                availablePlans={available_plans}
                currentPlanName={currentPlanName}
                onUpgradeSuccess={(updatedSub) => {
                    setSubscription(updatedSub);
                    if (onToast) onToast(t('plan_updated_success') || 'Plan updated successfully!', 'success');
                }}
            />
        </div>
    );
};

export default SubscriptionTab;
