import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/PlanLimitModal.css';

const PlanLimitModal = ({ show, onHide, title, message, subMessage }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

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
                        {title || t('plan_limit_reached') || "Plan Limit Reached"}
                    </h4>
                    <div className="plan-limit-divider mx-auto my-3"></div>
                </div>

                <div className="plan-limit-modal-body px-4 pb-4 text-center">
                    <h5 className="mb-3">
                        {message || t('upgrade_to_create_more') || "Upgrade to Create More Businesses"}
                    </h5>
                    <p className="text-muted mb-4">
                        {subMessage || t('essential_plan_limit_msg') || "You have reached the limit of 1 business on the Essential plan. Please upgrade your plan to create more businesses."}
                    </p>

                    <div className="d-grid gap-2 mb-3">
                        <Button
                            variant="primary"
                            size="lg"
                            className="upgrade-btn-premium"
                            onClick={() => {
                                onHide();
                                navigate('/admin?tab=subscription');
                            }}
                        >
                            {t('upgrade_plan') || "Upgrade Plan"}
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
