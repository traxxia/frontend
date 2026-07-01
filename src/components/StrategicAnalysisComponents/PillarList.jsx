import React from 'react';
import { Users, Shield, Lightbulb, Heart, ChevronUp, ChevronDown, DollarSign, Star, Settings, Database, Activity, BarChart3, Info, CheckCircle, ArrowRight, Target, Clock, Lock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import DiagnosticBox from './DiagnosticBox';
import { StreamingRow } from '../StreamingManager';

const renderSafeItem = (item) => {
  if (!item) return '';
  if (typeof item === 'string' || typeof item === 'number') return item;
  if (typeof item === 'object') {
    if (item.action && item.rationale) return `${item.action}: ${item.rationale}`;
    if (item.gap && item.impact) return `Gap: ${item.gap} | Impact: ${item.impact}`;
    return item.action || item.initiative || item.description || item.rationale || item.gap || Object.values(item).join(' - ');
  }
  return String(item);
};

export const ResourcesPillar = ({ resources, isExpanded, onToggle, visibleRows, lastRowRef, streamingManager, cardId, isExportActive = () => false }) => {
  const { t } = useTranslation();
  if (!resources) return null;

  const renderResourceTable = (title, items, icon) => {
    const dataItems = Array.isArray(items) ? items : [];
    if (dataItems.length === 0) return null;
    
    return (
      <div className="subsection">
        <h4 className="subsection-title">{icon} {title}</h4>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>{t("kpi_table_body")}</th>
                <th>{t("description")}</th>
                <th style={{ width: '25%' }}>{t("strategic_card2_head2")}</th>
              </tr>
            </thead>
            <tbody>
              {dataItems.map((item, idx) => {
                const isString = typeof item === 'string';
                return (
                  <tr key={idx}>
                    <td className="table-value">
                      {isString ? item : renderSafeItem(item.metric || item.item || item.role || item.investment || item.area || item.initiative || item.capability)}
                    </td>
                    <td className="table-value text-gray-dark">
                      {!isString ? renderSafeItem(item.description || item.rationale || item.allocation || item.details || item.reason) : '-'}
                    </td>
                    <td className="table-value success-metric-text">
                      {!isString ? renderSafeItem(item.current_score || item.score || item.value || item.expected_impact || item.scale || item.impact || item.status || item.priority || item.target) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="pillar-container">
      <div className="pillar-card resources-card">
        <div className="pillar-header resources-header clickable-header" onClick={onToggle}>
          <DollarSign size={22} className="resources-icon" />
          <h3 className="pillar-title">{t("execution_table5_header")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={resources.diagnostic} />
          {resources.capital_allocation && (
            <div className="info-box resources mb-4">
              <span className="info-box-text resources"><strong>{t("execution_table2_header4")}:</strong> {resources.capital_allocation}</span>
            </div>
          )}
          {renderResourceTable(t("execution_table5_header1"), resources.capital_priorities || resources.resource_allocation, <Star size={16} className="icon-orange" />)}
          {renderResourceTable(t("execution_table5_header2"), resources.talent_priorities, <Users size={16} className="icon-blue" />)}
          {renderResourceTable(t("execution_table5_header3"), resources.technology_investments, <Settings size={16} className="icon-purple" />)}
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
        <div className="pillar-header culture-header clickable-header" onClick={onToggle}>
          <Heart size={22} className="culture-icon" />
          <h3 className="pillar-title">{t("sustainability_card3")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
           <DiagnosticBox diagnostic={culture.diagnostic} />
           {culture.cultural_shifts && (
             <div className="subsection">
                <h4 className="subsection-title"><Activity size={18} className="icon-green" /> {t("sustainability_card3_header1")}</h4>
                <div className="linkage-grid">
                  {culture.cultural_shifts.map((shift, idx) => (
                    <div key={idx} className="linkage-card culture">
                      <div className="linkage-objective">
                        <span className="badge-blue">{t("from")}: {shift.from}</span>
                      </div>
                      <div className="linkage-arrow">→</div>
                      <div className="linkage-initiative">
                        <span className="badge-purple">{t("to")}: {shift.to}</span>
                      </div>
                      <div className="linkage-kpi text-gray-dark mt-2">
                        {renderSafeItem(shift.rationale)}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
           {culture.change_approach && (
             <div className="subsection mt-4">
               <h4 className="subsection-title"><Users size={18} className="icon-blue" /> {t("sustainability_card3_header2")}</h4>
               <ul className="info-list culture">
                  {Array.isArray(culture.change_approach) ? 
                    culture.change_approach.map((item, idx) => <li key={idx} className="info-list-item">{renderSafeItem(item)}</li>) :
                    <li className="info-list-item">{renderSafeItem(culture.change_approach)}</li>
                  }
               </ul>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};


export const AnalysisDataPillar = ({ analysisData, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  if (!analysisData) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card analysis-data-card">
        <div className="pillar-header analysis-data-header clickable-header" onClick={onToggle}>
          <Database size={22} className="analysis-data-icon" />
          <h3 className="pillar-title">{t("execution1_table_header1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={analysisData.diagnostic} />
          {analysisData.recommendations && (
             <div className="table-container">
               <table className="data-table">
                 <thead>
                   <tr>
                     <th>{t("strategic_card1_head1")}</th>
                     <th>{t("execution_table2_header2")}</th>
                     <th>{t("fullswot_card1_head13")}</th>
                   </tr>
                 </thead>
                 <tbody>
                    {analysisData.recommendations.map((rec, idx) => {
                      const isString = typeof rec === 'string';
                      return (
                        <tr key={idx}>
                          <td className="table-value">{isString ? rec : renderSafeItem(rec.recommendation || rec.item)}</td>
                          <td className="table-value text-gray-dark">{!isString ? renderSafeItem(rec.rationale || rec.details) : '-'}</td>
                          <td className="table-value"><span className="badge-blue">{!isString ? renderSafeItem(rec.impact || rec.priority) : '-'}</span></td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TechnologyPillar = ({ tech, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  if (!tech) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card technology-card">
        <div className="pillar-header technology-header clickable-header" onClick={onToggle}>
          <Settings size={22} className="technology-icon" />
          <h3 className="pillar-title">{t("execution1_table1_header1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={tech.diagnostic} />
          {tech.infrastructure_initiatives && (
            <div className="subsection">
              <h4 className="subsection-title"><Activity size={18} className="icon-blue" /> {t("execution1_table1_header2")}</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>{t("execution1_table3_header1")}</th>
                      <th>{t("execution_table2_header3")}</th>
                      <th style={{ width: '25%' }}>{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tech.infrastructure_initiatives.map((item, idx) => {
                      const isString = typeof item === 'string';
                      return (
                        <tr key={idx}>
                          <td className="table-value">
                            {isString ? item : renderSafeItem(item.initiative || item.item || item.metric)}
                          </td>
                          <td className="table-value">
                            {!isString ? renderSafeItem(item.timeline || item.duration || item.timing) : '-'}
                          </td>
                          <td className="table-value success-criteria-text">
                            {!isString ? renderSafeItem(item.priority || item.status || item.impact || item.value) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tech.platform_priorities && (
            <div className="subsection mt-4">
              <h4 className="subsection-title"><Database size={18} className="icon-purple" /> {t("execution1_table1_header3")}</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>{t("strategic_card1_head1")}</th>
                      <th>{t("description")}</th>
                      <th style={{ width: '25%' }}>{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tech.platform_priorities.map((item, idx) => {
                      const isString = typeof item === 'string';
                      return (
                        <tr key={idx}>
                          <td className="table-value">
                            {isString ? item : renderSafeItem(item.platform || item.initiative || item.item)}
                          </td>
                          <td className="table-value">
                            {!isString ? renderSafeItem(item.description || item.rationale || item.details) : '-'}
                          </td>
                          <td className="table-value success-criteria-text">
                            {!isString ? renderSafeItem(item.status || item.priority || item.timeline) : '-'}
                          </td>
                        </tr>
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


export const GovernancePillar = ({ governance, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  if (!governance) return null;
  return (
    <div className="pillar-container">
      <div className="pillar-card governance-card">
        <div className="pillar-header governance-header clickable-header" onClick={onToggle}>
          <Shield size={22} className="governance-icon" />
          <h3 className="pillar-title">{t("sustainability_card1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
           <DiagnosticBox diagnostic={governance.diagnostic} />
           {governance.decision_delegation && (
              <div className="subsection">
                <h4 className="subsection-title"><Users size={18} className="icon-blue" /> {t("sustainability_card1_header")}</h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("sustainability_card1_table1")}</th>
                        <th>{t("sustainability_card1_table2")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {governance.decision_delegation.map((item, idx) => (
                        <tr key={idx}>
                          <td className="table-value">{renderSafeItem(item.decision_type)}</td>
                          <td className="table-value">{renderSafeItem(item.delegate_to)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
           )}
           {governance.accountability_framework && (
             <div className="subsection mt-4">
                <h4 className="subsection-title"><Shield size={18} className="icon-purple" /> {t("sustainability_card1_header1")}</h4>
                <ul className="info-list governance">
                  {Array.isArray(governance.accountability_framework) ? 
                    governance.accountability_framework.map((item, idx) => <li key={idx} className="info-list-item">{renderSafeItem(item)}</li>) :
                    <li className="info-list-item">{renderSafeItem(governance.accountability_framework)}</li>
                  }
                </ul>
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
        <div className="pillar-header innovation-header clickable-header" onClick={onToggle}>
          <Lightbulb size={22} className="innovation-icon" />
          <h3 className="pillar-title">{t("sustainability_card2")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
           <DiagnosticBox diagnostic={innovation.diagnostic} />
           {innovation.target_portfolio_mix && (
             <div className="subsection">
                <h4 className="subsection-title"><BarChart3 size={18} className="icon-blue" /> {t("sustainability_header1")}</h4>
                <div className="badge-container flex flex-wrap gap-2 mb-4">
                   {Object.entries(innovation.target_portfolio_mix).map(([key, value]) => (
                     <span key={key} className="badge-purple">{key}: {renderSafeItem(value)}</span>
                   ))}
                </div>
             </div>
           )}
           {innovation.priority_innovation_bets && (
             <div className="subsection mt-4">
               <h4 className="subsection-title"><Star size={18} className="icon-orange" /> {t("sustainability_header2")}</h4>
               <div className="linkage-grid">
                 {innovation.priority_innovation_bets.map((bet, idx) => {
                   const isString = typeof bet === 'string';
                   return (
                    <div key={idx} className="linkage-card innovation">
                      <div className="linkage-objective">
                        <strong className="text-gray-dark">{isString ? bet : renderSafeItem(bet.bet || bet.initiative)}</strong>
                      </div>
                      {!isString && bet.rationale && (
                        <div className="linkage-kpi text-gray-dark mt-2">
                          {renderSafeItem(bet.rationale)}
                        </div>
                      )}
                    </div>
                   );
                 })}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};


