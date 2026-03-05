import React from "react";
import { AlertTriangle } from "lucide-react";
import "../styles/ErrorModal.css";

const ErrorModal = ({ show, handleClose, title, message, buttonText }) => {
    if (!show) return null;

    return (
        <div className="error-modal-overlay">
            <div className="error-modal-container">
                <div className="error-modal-icon">
                    <AlertTriangle size={36} color="white" strokeWidth={3} />
                </div>
                <h5 className="mb-2">
                    {title || "Login Failed"}
                </h5>
                <p className="mb-3">
                    {message || "Invalid credentials, please try again."}
                </p>
                <button
                    className="btn-try-again px-5 py-2 fw-semibold"
                    onClick={handleClose}
                >
                    {buttonText || "Try Again"}
                </button>
            </div>
        </div>
    );
};

export default ErrorModal;
