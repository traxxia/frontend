import React, { useState, useEffect, useRef } from 'react';
import { Shield, Loader } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";

const PortersFiveForces = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  portersData = null
}) => {
  const [portersAnalysisData, setPortersAnalysisData] = useState(portersData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(false);
  const hasInitialized = useRef(false);
  const { t } = useTranslation();

  // Handle regeneration
  const handleRegenerate = async () => {
    if (onRegenerate) {
      onRegenerate();
    } else {
      setPortersAnalysisData(null);
      setError(null);
    }
  };

  // Update data when prop changes
  useEffect(() => {
    if (portersData && portersData !== portersAnalysisData) { 
      setPortersAnalysisData(portersData);
      if (onDataGenerated) {
        onDataGenerated(portersData);
      }
    }
  }, [portersData]);

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;
    
    isMounted.current = true;
    hasInitialized.current = true;
    
    if (portersData) { 
      setPortersAnalysisData(portersData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  if (isLoading || isRegenerating) {
    return (
      <div className="porters-five-forces">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating Porter's Five Forces analysis..."
              : "Generating Porter's Five Forces analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="porters-five-forces">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => {
            setError(null);
            if (onRegenerate) {
              onRegenerate();
            }
          }} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!portersAnalysisData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="porters-five-forces">
        <div className="empty-state">
          <Shield size={48} className="empty-icon" />
          <h3>Porter's Five Forces Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate Porter's Five Forces analysis.`
              : "Porter's Five Forces analysis will be generated automatically after completing the initial phase."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="porters-five-forces">
      {/* Header */}
      <div className="pff-header">
        <div className="pff-title-section">
          <Shield className="pff-icon" size={24} />
          <h2 className="pff-title">Porter's Five Forces Analysis</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="Porter's Five Forces"
          size="medium"
        />
      </div>

      {/* Raw JSON Response Display */}
      <div className="raw-json-container" style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem 0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            API Response - Porter's Five Forces
          </h3>
          <span style={{
            fontSize: '12px',
            color: '#6b7280',
            fontFamily: 'monospace'
          }}>
            JSON
          </span>
        </div>
        
        <pre style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '1rem',
          overflow: 'auto',
          maxHeight: '600px',
          fontSize: '13px',
          lineHeight: '1.4',
          color: '#374151',
          fontFamily: '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {typeof portersAnalysisData === 'string' 
            ? portersAnalysisData 
            : JSON.stringify(portersAnalysisData, null, 2)
          }
        </pre>
      </div>
    </div>
  );
};

export default PortersFiveForces;