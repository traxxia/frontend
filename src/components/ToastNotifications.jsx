import React from "react";
import { Toast } from "react-bootstrap";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const ToastNotifications = ({
  showLockToast,
  setShowLockToast,
  showProjectLockToast,
  setShowProjectLockToast,
  showFinalizeToast,
  setShowFinalizeToast,
  showLaunchToast,
  setShowLaunchToast,
  showValidationToast,
  setShowValidationToast,
  validationMessage,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Validation Toast */}
      <div className="validation-toast-wrapper">
        <Toast
          show={showValidationToast}
          onClose={() => setShowValidationToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="validation-toast-body">
            <AlertTriangle size={18} />
            <span>{validationMessage}</span>
          </Toast.Body>
        </Toast>
      </div>

      {/* Rankings Locked Toast */}
      <div className="rankings-toast-wrapper">
        <Toast show={showLockToast} onClose={() => setShowLockToast(false)}>
          <Toast.Body className="rankings-toast-body">
            <CheckCircle size={18} />
            <span>{t("Your_rankings_have_been_locked")}</span>
          </Toast.Body>
        </Toast>
      </div>

      {/* Project Lock Toast */}
      <div className="project-lock-toast-wrapper">
        <Toast
          show={showProjectLockToast}
          onClose={() => setShowProjectLockToast(false)}
        >
          <Toast.Body className="project-lock-toast-body">
            <CheckCircle size={18} />
            <span>{t("Project_creation_locked_Continue_ranking")}</span>
          </Toast.Body>
        </Toast>
      </div>

      {/* Finalize Toast */}
      <div className="finalize-toast-wrapper">
        <Toast
          show={showFinalizeToast}
          onClose={() => setShowFinalizeToast(false)}
        >
          <Toast.Body className="finalize-toast-body">
            <CheckCircle size={18} />
            <span>{t("Prioritization_complete_Add_detailed_planning")}</span>
          </Toast.Body>
        </Toast>
      </div>

      {/* Launch Toast */}
      <div className="launch-toast-wrapper">
        <Toast show={showLaunchToast} onClose={() => setShowLaunchToast(false)}>
          <Toast.Body className="launch-toast-body">
            <CheckCircle size={18} />
            <span>{t("Projects_launched_Ready_for_execution.")}</span>
          </Toast.Body>
        </Toast>
      </div>
    </>
  );
};

export default ToastNotifications;