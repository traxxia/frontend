import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const AnalysisError = ({
  error,
  onRetry,
  title = "Analysis Error",
  showRetryButton = true
}) => {
  const handleRetry = (e) => {
    // Prevent default behavior and event bubbling
    e.preventDefault();
    e.stopPropagation();

    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="error-state">
      <div className="error-icon">
        <AlertTriangle size={48} color="#ef4444" />
      </div>
      <h3>{title}</h3>
      <p>{error}</p>
      {showRetryButton && onRetry && sessionStorage.getItem("userRole") !== "viewer" && (
        <button
          type="button"
          onClick={handleRetry}
          className="retry-button"
        >
          <RefreshCw size={16} style={{ marginRight: '5px' }} />
          Retry Analysis
        </button>
      )}
    </div>
  );
};

export default AnalysisError;