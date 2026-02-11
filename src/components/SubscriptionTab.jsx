import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Spinner, Alert, Button } from 'react-bootstrap';
import { CreditCard, Calendar, BarChart3, Zap, ShieldCheck, Building2, Users } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import UpgradeModal from './UpgradeModal';

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

    const { plan, usage, expires_at } = subscription;
    const isEssential = plan.toLowerCase() === 'essential';

    const getProgressVariant = (current, limit) => {
        const ratio = current / limit;
        if (ratio >= 1) return 'danger';
        if (ratio >= 0.8) return 'warning';
        return 'primary';
    };

    return (
        <div className="access-management-container minimal">
            <div className="access-content">
                <div className="access-header-minimal mb-4 d-flex justify-content-between align-items-start">
                    <div>
                        <h2 className="minimal-page-title">{t("subscription")}</h2>
                        <p className="minimal-page-subtitle text-muted">
                            {t("subscription_subtitle") || "Manage your subscription plan and monitor usage metrics."}
                        </p>
                    </div>
                    {isEssential && (
                        <Button
                            variant="primary"
                            onClick={() => setShowUpgradeModal(true)}
                            className="d-flex align-items-center gap-2 px-4 py-2 fw-bold add-user-btn"
                            style={{ borderRadius: '8px' }}
                        >
                            <Zap size={18} />
                            {t('upgrade_now')}
                        </Button>
                    )}
                </div>

                <div className="compact-summary-row mb-4">
                    <div className="summary-item">
                        <span className="summary-label">{t("plan") || "Plan"}:</span>
                        <span className="summary-value-minimal text-capitalize">{plan}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                        <span className="summary-label">{expires_at ? t('renews_on') : t('no_expiration')}:</span>
                        <span className="summary-value-minimal">
                            {expires_at ? new Date(expires_at).toLocaleDateString() : "-"}
                        </span>
                    </div>
                </div>

                <Row className="mt-4">
                    <Col md={4} className="mb-4">
                        <Card className="h-100 border-0 shadow-sm p-4" style={{ borderRadius: '12px', background: '#fff' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-muted text-uppercase small fw-bold mb-0">Workspaces</h6>
                                <Building2 size={20} className="text-primary" />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-2">
                                <h3 className="mb-0 fw-bold">{usage.workspaces.current}</h3>
                                <span className="text-muted">/ {usage.workspaces.limit}</span>
                            </div>
                            <ProgressBar
                                now={(usage.workspaces.current / usage.workspaces.limit) * 100}
                                variant={getProgressVariant(usage.workspaces.current, usage.workspaces.limit)}
                                className="rounded-pill"
                                style={{ height: '8px' }}
                            />
                        </Card>
                    </Col>

                    <Col md={4} className="mb-4">
                        <Card className="h-100 border-0 shadow-sm p-4" style={{ borderRadius: '12px', background: '#fff' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-muted text-uppercase small fw-bold mb-0">Collaborators</h6>
                                <Users size={20} className="text-primary" />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-2">
                                <h3 className="mb-0 fw-bold">{usage.collaborators.current}</h3>
                                <span className="text-muted">/ {usage.collaborators.limit}</span>
                            </div>
                            <ProgressBar
                                now={(usage.collaborators.current / usage.collaborators.limit) * 100}
                                variant={getProgressVariant(usage.collaborators.current, usage.collaborators.limit)}
                                className="rounded-pill"
                                style={{ height: '8px' }}
                            />
                        </Card>
                    </Col>

                    <Col md={4} className="mb-4">
                        <Card className="h-100 border-0 shadow-sm p-4" style={{ borderRadius: '12px', background: '#fff' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-muted text-uppercase small fw-bold mb-0">Projects</h6>
                                <BarChart3 size={20} className="text-primary" />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-2">
                                <h3 className="mb-0 fw-bold">{usage.projects.current}</h3>
                                <span className="text-muted">/ {usage.projects.limit}</span>
                            </div>
                            <ProgressBar
                                now={(usage.projects.current / usage.projects.limit) * 100}
                                variant={getProgressVariant(usage.projects.current, usage.projects.limit)}
                                className="rounded-pill"
                                style={{ height: '8px' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <UpgradeModal
                    show={showUpgradeModal}
                    onHide={() => setShowUpgradeModal(false)}
                    onUpgradeSuccess={(updatedSub) => {
                        setSubscription(updatedSub);
                        if (onToast) onToast(t('upgrade_successful') || 'Upgrade successful!', 'success');
                    }}
                />
            </div>
        </div>
    );
};

export default SubscriptionTab;
