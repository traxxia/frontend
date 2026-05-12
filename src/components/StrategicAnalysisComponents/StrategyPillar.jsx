import React from 'react';
import { Target, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import DiagnosticBox from './DiagnosticBox';
import { StreamingRow } from '../StreamingManager';

const StrategyPillar = ({ 
  strategy, 
  isExpanded, 
  onToggle, 
  visibleRows, 
  lastRowRef, 
  streamingManager, 
  cardId 
}) => {
  const { t } = useTranslation();
  if (!strategy) return null;

  return (
    <div className="pillar-container">
      <div className="pillar-card strategy-card">
        <div className="pillar-header strategy-header strategic-analysis--s5" onClick={onToggle}>
          <Target size={22} className="strategy-icon" />
          <h3 className="pillar-title">{t("strategy_where_to_compete")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={strategy.diagnostic} />

          {strategy.where_to_compete && strategy.where_to_compete.length > 0 && strategy.where_to_compete[0] !== 'N/A' && (
            <div className="subsection">
              <h4 className="subsection-title">
                <ArrowRight size={16} className="strategy-icon" />
                {t("strategy_subsection_1")}
              </h4>
              <div className="table-container">
                <table className="data-table">
                  <tbody>
                    {strategy.where_to_compete.map((item, idx) => {
                      if (idx >= visibleRows) return null;
                      return (
                        <StreamingRow 
                          key={idx} 
                          isVisible={true} 
                          isLast={idx === visibleRows - 1} 
                          lastRowRef={lastRowRef} 
                          isStreaming={streamingManager?.shouldStream(cardId)}
                        >
                          <td className="subsection-list-item">
                            <strong>{item.position}:</strong> {item.description}
                          </td>
                        </StreamingRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {strategy.how_to_compete && strategy.how_to_compete.length > 0 && strategy.how_to_compete[0] !== 'N/A' && (
            <div className="subsection">
              <h4 className="subsection-title">
                <ArrowRight size={16} className="strategy-icon" />
                {t("how_to_compete")}
              </h4>
              <div className="table-container">
                <table className="data-table">
                  <tbody>
                    {strategy.how_to_compete.map((item, idx) => {
                      const rowIndex = (strategy.where_to_compete?.length || 0) + idx;
                      if (rowIndex >= visibleRows) return null;
                      return (
                        <StreamingRow 
                          key={idx} 
                          isVisible={true} 
                          isLast={rowIndex === visibleRows - 1} 
                          lastRowRef={lastRowRef} 
                          isStreaming={streamingManager?.shouldStream(cardId)}
                        >
                          <td className="subsection-list-item">
                            <strong>{item.approach}:</strong> {item.description}
                          </td>
                        </StreamingRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyPillar;
