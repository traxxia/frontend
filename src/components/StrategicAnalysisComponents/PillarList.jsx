import React from 'react';
import { Users, Shield, Lightbulb, Heart, ChevronUp, ChevronDown, DollarSign, Star, Settings, Database, Activity, BarChart3, Info, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import DiagnosticBox from './DiagnosticBox';
import { StreamingRow } from '../StreamingManager';

export const ResourcesPillar = ({ resources, isExpanded, onToggle, visibleRows, lastRowRef, streamingManager, cardId, isExportActive = () => false }) => {
  const { t } = useTranslation();
  if (!resources) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card resources-card">
        <div className="pillar-header resources-header strategic-analysis--s5" onClick={onToggle}>
          <DollarSign size={22} className="resources-icon" />
          <h3 className="pillar-title">{t("execution_table5_header")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={resources.diagnostic} />
          {resources.capital_priorities && (
             <div className="subsection">
               <h4 className="subsection-title"><Star size={16} className="resources-icon" /> {t("execution_table5_header1")}</h4>
               <table className="data-table">
                 <tbody>
                    {resources.capital_priorities.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          {typeof item === 'string' ? item : (JSON.stringify(item))}
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CulturePillar = ({ culture, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  if (!culture) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card culture-card">
        <div className="pillar-header culture-header strategic-analysis--s5" onClick={onToggle}>
          <Heart size={22} className="culture-icon" />
          <h3 className="pillar-title">{t("sustainability_subtitle_3")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
           <DiagnosticBox diagnostic={culture.diagnostic} />
           {culture.cultural_shifts && (
             <div className="subsection">
                {culture.cultural_shifts.map((shift, idx) => (
                  <div key={idx} className="info-box culture">
                    <strong>{shift.from} → {shift.to}</strong>
                    <p>{shift.rationale}</p>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export const AnalysisDataPillar = ({ analysisData, isExpanded, onToggle, visibleRows, lastRowRef, streamingManager, cardId, isExportActive = () => false }) => {
  const { t } = useTranslation();
  if (!analysisData) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card analysis-data-card">
        <div className="pillar-header analysis-data-header strategic-analysis--s5" onClick={onToggle}>
          <Database size={22} className="analysis-data-icon" />
          <h3 className="pillar-title">{t("execution1_table_header1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={analysisData.diagnostic} />
          {analysisData.recommendations && (
             <div className="table-container">
               <table className="data-table">
                 <tbody>
                    {analysisData.recommendations.map((rec, idx) => (
                      <tr key={idx}>
                        <td>
                          {typeof rec === 'string' ? rec : (JSON.stringify(rec))}
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TechnologyPillar = ({ tech, isExpanded, onToggle, visibleRows, lastRowRef, streamingManager, cardId, isExportActive = () => false }) => {
  const { t } = useTranslation();
  if (!tech) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card technology-card">
        <div className="pillar-header technology-header strategic-analysis--s5" onClick={onToggle}>
          <Settings size={22} className="technology-icon" />
          <h3 className="pillar-title">{t("execution1_table1_header1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={tech.diagnostic} />
          {tech.infrastructure_initiatives && (
            <div className="subsection">
              <h4 className="subsection-title"><Activity size={16} /> {t("execution1_table1_header2")}</h4>
              <table className="data-table">
                <tbody>
                  {tech.infrastructure_initiatives.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        {typeof item === 'string' ? item : (JSON.stringify(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GovernancePillar = ({ governance, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  if (!governance) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card governance-card">
        <div className="pillar-header governance-header strategic-analysis--s5" onClick={onToggle}>
          <Shield size={22} className="governance-icon" />
          <h3 className="pillar-title">{t("sustainability_subtitle_1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
           <DiagnosticBox diagnostic={governance.diagnostic} />
           {governance.decision_delegation && (
              <div className="subsection">
                <h4 className="subsection-title">{t("decision_delegation")}</h4>
                <table className="data-table">
                  <tbody>
                    {governance.decision_delegation.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          {typeof item === 'string' ? item : (
                            <>
                              <strong>{item.decision_type}:</strong> {item.delegate_to}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export const InnovationPillar = ({ innovation, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  if (!innovation) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card innovation-card">
        <div className="pillar-header innovation-header strategic-analysis--s5" onClick={onToggle}>
          <Lightbulb size={22} className="innovation-icon" />
          <h3 className="pillar-title">{t("sustainability_subtitle_2")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
           <DiagnosticBox diagnostic={innovation.diagnostic} />
           {innovation.priority_innovation_bets && (
             <div className="subsection">
               {innovation.priority_innovation_bets.map((bet, idx) => (
                 <div key={idx} className="info-box innovation">
                   <strong>{bet.bet}</strong>
                   <p>{bet.rationale}</p>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

