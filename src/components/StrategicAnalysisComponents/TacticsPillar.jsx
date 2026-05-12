import React from 'react';
import { Zap, ChevronUp, ChevronDown, Link2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import DiagnosticBox from './DiagnosticBox';
import { StreamingRow } from '../StreamingManager';

const TacticsPillar = ({ 
  tactics, 
  isExpanded, 
  onToggle, 
  strategicLinkages,
  pestelData,
  portersData,
  visibleRows,
  lastRowRef,
  streamingManager,
  cardId,
  isExportActive = () => false
}) => {
  const { t } = useTranslation();
  if (!tactics) return null;

  const renderStrategicLinkages = (linkages) => {
    if (!linkages || !linkages.objective_to_initiative_map) return null;
    return (
      <div className="linkage-section">
        <h4 className="subsection-title">
          <Link2 size={16} className="tactics-icon" />
          {t("strategic_linkages")}
        </h4>
        <div className="linkage-grid">
          {linkages.objective_to_initiative_map.map((link, idx) => (
            <div key={idx} className="linkage-card">
              <div className="linkage-objective">
                <strong>{t("objective")}:</strong> {link.objective}
              </div>
              <div className="linkage-arrow">↓</div>
              <div className="linkage-initiative">
                <strong>{t("initiative")}:</strong> {link.initiative}
              </div>
              <div className="linkage-kpi">
                <strong>{t("kpi")}:</strong> {link.success_kpi}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendationSection = (title, items, IconComponent) => {
    if (!items || items.length === 0 || items[0] === 'N/A') return null;
    return (
      <div className="subsection">
        <h4 className="subsection-title">
          <IconComponent size={16} className="tactics-icon" />
          {title}
        </h4>
        <div className="table-container">
          <table className="data-table">
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="subsection-list-item">
                    {typeof item === 'string' ? item : (
                      <>
                        <strong>{item.action || item.initiative || item.shift}:</strong> {item.rationale || item.expected_outcome || item.transformation_required}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="pillar-container">
      <div className="pillar-card tactics-card">
        <div className="pillar-header tactics-header strategic-analysis--s5" onClick={onToggle}>
          <Zap size={22} className="tactics-icon" />
          <h3 className="pillar-title">{t("execution_subtitle_1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={tactics.diagnostic} />
          {renderStrategicLinkages(strategicLinkages)}
          <div className="external-recommendations">
            {pestelData && renderRecommendationSection(t("pestel_recommendations"), pestelData.pestel_analysis?.strategic_recommendations?.immediate_actions, AlertTriangle)}
            {portersData && renderRecommendationSection(t("porters_recommendations"), portersData.porter_analysis?.strategic_recommendations?.immediate_actions, AlertTriangle)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticsPillar;
