import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import {
    Check, Users, Briefcase, LayoutGrid, FileText
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from './UpgradeModal';
import AdminTable from './AdminTable';
import MetricCard from './MetricCard';
import '../styles/accessmanagement.css';
import '../styles/AdminTableStyles.css';

const SubscriptionTab = ({ onToast }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Pagination state for Billing History
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

    // Client-side pagination for billing history
    const totalItems = billing_history.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedHistory = billing_history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const billingColumns = [
        {
            key: 'date',
            label: t('date') || 'Date',
            render: (_, row) => (
                <div>
                    <div className="admin-cell-primary">{new Date(row.date).toLocaleDateString()}</div>
                    <div className="admin-cell-secondary">{new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            )
        },
        {
            key: 'details',
            label: t('details') || 'Details',
            render: (_, row) => (
                <span className="text-capitalize fw-medium">{row.plan_name} plan</span>
            )
        },
        {
            key: 'amount',
            label: t('amount') || 'Amount',
            render: (_, row) => (
                <span className="fw-bold">${row.amount}</span>
            )
        }
    ];

    return (
        <div className="subscription-redesign-wrapper">
            <Row>
                <Col md={12}>

                    {/* Plan Section */}
                    <section id="subscription-plan" className="mb-4">
                        <h5 className="autorenew-title mb-4">{t("subscription_plans") || "Subscription Plans"}</h5>
                        <div className="plan-cards-row">
                            {available_plans.map((p) => {
                                const isCurrent = p.name.toLowerCase() === currentPlanName;

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

                    {/* Usage Metrics Section */}
                    <section className="mt-4 pt-2 mb-4">
                        <h5 className="autorenew-title mb-4">{t("usage_metrics") || "Usage Metrics"}</h5>
                        <div className="admin-metrics-grid">
                            <MetricCard
                                label={t("workspaces") || "Workspaces"}
                                value={`${usage.workspaces.current} / ${usage.workspaces.limit}`}
                                icon={Briefcase}
                                iconColor="blue"
                            />
                            <MetricCard
                                label={t("collaborators") || "Collaborators"}
                                value={`${usage.collaborators.current} / ${usage.collaborators.limit}`}
                                icon={Users}
                                iconColor="purple"
                            />
                            <MetricCard
                                label={t("projects") || "Projects"}
                                value={`${usage.projects.current} / ${usage.projects.limit === 'unlimited' ? '∞' : usage.projects.limit}`}
                                icon={LayoutGrid}
                                iconColor="orange"
                            />
                        </div>
                    </section>

                    {/* Billing History Section */}
                    <section className="mb-5">
                        <AdminTable
                            title={t("billing_history") || "Billing History"}
                            count={totalItems}
                            countLabel={t("Records") || "Records"}
                            columns={billingColumns}
                            data={paginatedHistory}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            loading={loading}
                            emptyMessage={t("no_billing_history") || "No billing history found"}
                        />
                    </section>

                </Col>
            </Row>

            <UpgradeModal
                show={showUpgradeModal}
                onHide={() => setShowUpgradeModal(false)}
                availablePlans={available_plans}
                currentPlanName={currentPlanName}
                paymentMethod={subscription?.payment_method}
                onUpgradeSuccess={(updatedSub) => {
                    setSubscription(updatedSub);
                    if (onToast) onToast(t('plan_updated_success') || 'Plan updated successfully!', 'success');
                }}
            />
        </div>
    );
};

export default SubscriptionTab;
