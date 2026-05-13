import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
const AnalysisError = ({
  error,
  onRetry,
  title = "Analysis Error",
  showRetryButton = true
}) => {
  const handleRetry = e => {
    e.preventDefault();
    e.stopPropagation();
    if (onRetry) {
      onRetry();
    }
  };
  return <div className="error-state">
      <div className="error-icon">
        <AlertTriangle size={48} color="#ef4444" />
      </div>
      <h3>{title}</h3>
      <p>{error}</p>
      {showRetryButton && onRetry && useAuthStore.getState().userRole !== "viewer" && <button type="button" onClick={handleRetry} className="retry-button">
          <RefreshCw size={16} className="analysis-error--s1" />
          Retry Analysis
        </button>}
    </div>;
};
export default AnalysisError;
