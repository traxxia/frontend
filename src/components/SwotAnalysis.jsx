import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import '../styles/analysis-components.css';
import '../styles/EssentialPhase.css';
import { Target, Loader, TrendingUp, TrendingDown, AlertTriangle, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useAnalysisStore } from "../store";
import AnalysisEmptyState from './AnalysisEmptyState';
import { checkMissingQuestionsAndRedirect, ANALYSIS_TYPES } from '../services/missingQuestionsService';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { StreamingRow } from './StreamingManager';
import { STREAMING_CONFIG } from '../hooks/streamingConfig';

const SwotAnalysis = ({
  analysisResult: propAnalysisResult,
  businessName,
  onRegenerate,
  isRegenerating: propIsRegenerating,
  canRegenerate = true,
  questions,
  userAnswers,
  selectedBusinessId,
  onRedirectToBrief,
  hideImproveButton = false,
  streamingManager,
  cardId,
  isExpanded = true,
}) => {
  const { t } = useTranslation();
  
  const {
    swotAnalysis: storeAnalysisResult,
    isRegenerating: isTypeRegenerating,
    regenerateIndividualAnalysis
  } = useAnalysisStore();

  const analysisResult = propAnalysisResult || storeAnalysisResult;
  const isRegenerating = propIsRegenerating || isTypeRegenerating('swot');

  const [errorMessage, setErrorMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    swotAnalysis: true
  });
  
  const [visibleRows, setVisibleRows] = useState(0);

  const handleRedirectToBrief = (missingQuestionsData = null) => {
    if (onRedirectToBrief) {
      onRedirectToBrief(missingQuestionsData);
    }
  };

  const handleMissingQuestionsCheck = async () => {
    const analysisConfig = ANALYSIS_TYPES.swot;
    await checkMissingQuestionsAndRedirect(
      'swot',
      selectedBusinessId,
      handleRedirectToBrief,
      {
        displayName: analysisConfig.displayName,
        customMessage: analysisConfig.customMessage
      }
    );
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        await onRegenerate();
      } catch (error) {
        console.error('Error in SWOT regeneration:', error);
        setErrorMessage(error.message || 'Failed to regenerate analysis');
      }
    } else {
      await regenerateIndividualAnalysis('swot', questions, userAnswers, selectedBusinessId);
    }
  };

  const isSwotDataIncomplete = (data) => {
    return !data || data === '' || (typeof data === 'string' && data.trim() === '');
  };

  const parseAnalysisResult = (result) => {
    if (!result) return null;
    if (typeof result === 'object' && result !== null) return result;
    
    let cleanedResult = result.trim();
    if (cleanedResult.startsWith('```json') || cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    cleanedResult = cleanedResult.replace(/^`+|`+$/g, '').trim();

    try {
      let parsed = JSON.parse(cleanedResult);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed;
    } catch (parseError) {
      console.error('JSON parse failed fallback required');
      return null;
    }
  };

  let swotData = parseAnalysisResult(analysisResult);

  const parseSwotItems = (content) => {
    if (!content) return [];
    const contentStr = String(content).trim();
    const items = contentStr
      .split(/(?<=[.!?])\s+/)
      .filter(item => item.trim().length > 10)
      .map((item, index) => ({
        item: item.trim(),
        id: index + 1
      }));
    return items.length > 0 ? items : [{ item: contentStr, id: 1 }];
  };

  const getSwotIcon = (type) => {
    switch (type) {
      case 'strengths': return <TrendingUp size={16} />;
      case 'weaknesses': return <TrendingDown size={16} />;
      case 'opportunities': return <Target size={16} />;
      case 'threats': return <AlertTriangle size={16} />;
      default: return <Zap size={16} />;
    }
  };

  const getSwotTypeColor = (type) => {
    switch (type) {
      case 'strengths': return 'high-intensity';
      case 'weaknesses': return 'medium-intensity';
      case 'opportunities': return 'high-intensity';
      case 'threats': return 'low-intensity';
      default: return 'medium-intensity';
    }
  };

  const prepareSwotTableData = () => {
    const tableData = [];
    if (swotData) {
      const swotTypes = [
        { key: 'strengths', label: 'Strengths', data: swotData.strengths },
        { key: 'weaknesses', label: 'Weaknesses', data: swotData.weaknesses },
        { key: 'opportunities', label: 'Opportunities', data: swotData.opportunities },
        { key: 'threats', label: 'Threats', data: swotData.threats }
      ];
      swotTypes.forEach(type => {
        if (type.data) {
          const items = parseSwotItems(type.data);
          items.forEach(item => {
            tableData.push({
              type: type.key,
              label: type.label,
              item: item.item,
              id: item.id
            });
          });
        }
      });
    }
    return tableData;
  };

  const swotTableData = prepareSwotTableData();

  // Unified streaming logic
  useEffect(() => {
    if (isRegenerating) {
      setVisibleRows(0);
    } else if (swotTableData.length > 0) {
      // ONLY stream if specifically requested (via regenerate button)
      if (!streamingManager?.shouldStream(cardId)) {
        setVisibleRows(swotTableData.length);
        return;
      }

      const interval = setInterval(() => {
        setVisibleRows(prev => {
          if (prev < swotTableData.length) return prev + 1;
          clearInterval(interval);
          streamingManager?.stopStreaming(cardId);
          return prev;
        });
      }, STREAMING_CONFIG.ROW_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isRegenerating, swotTableData.length, streamingManager, cardId]);

  const { lastRowRef } = useAutoScroll(streamingManager, cardId, isExpanded, visibleRows);

  if (isRegenerating && visibleRows === 0) {
    return (
      <div className="porters-container">
        <div className="loading-state">
          <Loader size={24} className="loading-spinner modern-animate-spin" />
          <span>Regenerating SWOT Analysis...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || (isSwotDataIncomplete(analysisResult) && Object.keys(userAnswers).length > 0)) {
    return (
      <div className="porters-container">
        <AnalysisEmptyState
          analysisType="swot"
          analysisDisplayName="SWOT Analysis"
          icon={Target}
          onImproveAnswers={handleMissingQuestionsCheck}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
          userAnswers={userAnswers}
          minimumAnswersRequired={3}
          showImproveButton={false}
          showRegenerateButton={false}
        />
      </div>
    );
  }

  return (
    <div className="porters-container"
      data-analysis-type="swot"
      data-analysis-name="SWOT Analysis"
      data-analysis-order="1">

      {swotData && swotTableData.length > 0 && (
        <div className="section-container">
          <div className="table-container">
            <table className="data-table forces-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {swotTableData.slice(0, visibleRows).map((row, index) => (
                  <StreamingRow 
                    key={`${row.type}-${index}`}
                    isVisible={true}
                    isLast={index === visibleRows - 1}
                    lastRowRef={lastRowRef}
                    isStreaming={streamingManager?.shouldStream(cardId)}
                  >
                    <td>
                      <div className="force-name">
                        {getSwotIcon(row.type)}
                        <span>{row.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getSwotTypeColor(row.type)}`}>
                        {row.label}
                      </span>
                    </td>
                    <td className="implications-cell">
                      {row.item}
                    </td>
                  </StreamingRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwotAnalysis;
