import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader } from 'lucide-react';

const StrategicAnalysis = ({
  questions = [],
  userAnswers = {},
  businessName = '',
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  strategicData = null,
  selectedBusinessId
}) => {
  const [localStrategicData, setLocalStrategicData] = useState(strategicData);

  useEffect(() => {
    setLocalStrategicData(strategicData);
  }, [strategicData]);

  const renderStrategicContent = () => {
    if (isRegenerating) {
      return (
        <div className="analysis-loading" style={{ padding: '2rem', textAlign: 'center' }}>
          <Loader size={24} className="spinner" />
          <p>Generating strategic analysis...</p>
        </div>
      );
    }

    if (!localStrategicData) {
      return (
        <div className="no-analysis" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No strategic analysis available yet.</p>
          <p className="text-muted">Complete the initial phase questions to generate your strategic analysis.</p>
        </div>
      );
    }

    return (
      <div className="strategic-content">
        {/* Display strategic analysis result as formatted HTML */}
        <div 
          className="strategic-result"
          dangerouslySetInnerHTML={{ 
            __html: typeof localStrategicData === 'string' ? localStrategicData : JSON.stringify(localStrategicData) 
          }}
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        />
      </div>
    );
  };

  return (
    <div className="strategic-analysis-section" style={{ backgroundColor: 'white' }}>
      <div className="section-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#1f2937' }}>Strategic Analysis</h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Strategic framework for {businessName || 'your business'}
          </p>
        </div>
        
        {/* {canRegenerate && onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            style={{
              backgroundColor: isRegenerating ? '#f3f4f6' : '#8b5cf6',
              color: isRegenerating ? '#6b7280' : '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Regenerate strategic analysis"
          >
            {isRegenerating ? (
              <>
                <Loader size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Regenerate
              </>
            )}
          </button>
        )} */}
      </div>
      
      <div className="section-content">
        {renderStrategicContent()}
      </div>
    </div>
  );
};

export default StrategicAnalysis;