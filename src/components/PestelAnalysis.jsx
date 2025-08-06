import React, { useState, useEffect, useRef } from 'react';
import { Globe, Loader } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import '../styles/Analytics.css';
import { useTranslation } from "../hooks/useTranslation";

const PestelAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = "Your Business",
  onDataGenerated,
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  pestelData = null
}) => {
  const [pestelAnalysisData, setPestelAnalysisData] = useState(pestelData);
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
      setPestelAnalysisData(null);
      setError(null);
    }
  };

  // Update data when prop changes
  useEffect(() => {
    if (pestelData && pestelData !== pestelAnalysisData) { 
      setPestelAnalysisData(pestelData);
      if (onDataGenerated) {
        onDataGenerated(pestelData);
      }
    }
  }, [pestelData]);

  // Initialize component
  useEffect(() => {
    if (hasInitialized.current) return;
    
    isMounted.current = true;
    hasInitialized.current = true;
    
    if (pestelData) { 
      setPestelAnalysisData(pestelData);
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  if (isLoading || isRegenerating) {
    return (
      <div className="pestel-analysis">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner" />
          <span>
            {isRegenerating
              ? "Regenerating PESTEL analysis..."
              : "Generating PESTEL analysis..."
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pestel-analysis">
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

  if (!pestelAnalysisData) {
    const answeredCount = Object.keys(userAnswers).length;
    return (
      <div className="pestel-analysis">
        <div className="empty-state">
          <Globe size={48} className="empty-icon" />
          <h3>PESTEL Analysis</h3>
          <p>
            {answeredCount < 3
              ? `Answer ${3 - answeredCount} more questions to generate PESTEL analysis.`
              : "PESTEL analysis will be generated automatically after completing the initial phase."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pestel-analysis">
      {/* Header */}
      <div className="pestel-header">
        <div className="pestel-title-section">
          <Globe className="pestel-icon" size={24} />
          <h2 className="pestel-title">PESTEL Analysis</h2>
        </div>
        <RegenerateButton
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          sectionName="PESTEL Analysis"
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
            API Response - PESTEL Analysis
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
          {typeof pestelAnalysisData === 'string' 
            ? pestelAnalysisData 
            : JSON.stringify(pestelAnalysisData, null, 2)
          }
        </pre>
      </div>
    </div>
  );
};

export default PestelAnalysis;