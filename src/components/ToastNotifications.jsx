import React from "react";
import { Toast } from "react-bootstrap";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useUIStore } from "../store/uiStore";

const ToastNotifications = () => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="global-toast-container" 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isWarning = toast.type === "warning";
        const isInfo = toast.type === "info";

        let Icon = AlertTriangle;
        let bodyClass = "validation-toast-body";

        if (isSuccess) {
          Icon = CheckCircle;
          bodyClass = "validation-toast-body-success";
        } else if (isWarning) {
          Icon = AlertTriangle;
          bodyClass = "validation-toast-body-warning";
        } else if (isInfo) {
          Icon = Info;
          bodyClass = "validation-toast-body-info";
        }

        return (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              show={true}
              onClose={() => removeToast(toast.id)}
              delay={toast.duration || 3000}
              autohide={Boolean(toast.duration && toast.duration > 0)}
            >
              <Toast.Body className={bodyClass}>
                <Icon size={18} />
                <span style={{ whiteSpace: "pre-line" }}>{toast.message}</span>
              </Toast.Body>
            </Toast>
          </div>
        );
      })}
    </div>
  );
};

export default ToastNotifications;