import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/PlanLimitModal.css';

const PlanLimitModal = ({ show, onHide, onAction, title, message, subMessage, plan = '', limit = 1, isAdmin = true }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const handleAction = () => {
        const currentPath = location.pathname;
        const targetPath = currentPath.includes('/super-admin') ? '/super-admin' : '/admin';
        
        onHide();
        if (onAction) onAction();
        
        if (isAdmin) {
            // Increased delay to ensure modal backdrop and state cleanup before navigation
            setTimeout(() => {
                navigate(`${targetPath}?tab=subscription`);
            }, 300);
        }
    };

    const displayTitle = title || (isAdmin ? (t('plan_limit_reached') || "Plan Limit Reached") : (t('Action Restricted') || "Action Restricted"));
    const displayMessage = message || (isAdmin ? (t('upgrade_to_create_more') || "Upgrade Plan to Create More") : (t('company_business_limit_reached') || "Business Limit Reached"));
    const displaySubMessage = subMessage || (isAdmin 
        ? t('plan_workspace_limit_msg', { plan, limit })
        : (t('contact_admin_to_upgrade') || "Please contact your administrator to upgrade the plan."));
    const displayButtonText = isAdmin ? (t('upgrade_plan') || "Upgrade Plan") : (t('ok') || "OK");

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            contentClassName="plan-limit-modal-content"
            dialogClassName="plan-limit-modal-dialog"
        >
            <Modal.Body className="p-0">
                <div className="plan-limit-modal-header text-center pt-4 pb-2 px-4">
                    <div className="plan-limit-icon-wrapper mb-3">
                        <div className="plan-limit-icon-circle">
                            <AlertTriangle size={32} className="text-warning" />
                        </div>
                    </div>
                    <h4 className="plan-limit-title mb-2">
                        {displayTitle}
                    </h4>
                    <div className="plan-limit-divider mx-auto my-3"></div>
                </div>

                <div className="plan-limit-modal-body px-4 pb-4 text-center">
                    <h5 className="mb-3">
                        {displayMessage}
                    </h5>
                    <p className="text-muted mb-4">
                        {displaySubMessage}
                    </p>

                    <div className="d-grid gap-2 mb-3">
                        <Button
                            variant="primary"
                            size="lg"
                            className="upgrade-btn-premium"
                            onClick={handleAction}
                        >
                            {displayButtonText}
                        </Button>
                        <Button
                            variant="link"
                            className="text-muted text-decoration-none"
                            onClick={onHide}
                        >
                            {t('cancel')}
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default PlanLimitModal;
