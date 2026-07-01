import React from 'react';
import { Zap, ChevronUp, ChevronDown, Link2, ArrowRight, Target, Activity, TrendingUp } from 'lucide-react';
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
    if (!linkages || !linkages.objective_to_initiative_map || linkages.objective_to_initiative_map.length === 0) {
      return null;
    }

    return (
      <section className="strategic-page-section">
        <div className="section-headers">
          <Link2 size={24} className="link-icon-blue" />
          <div><h2 className="category-title">{t("execution_table_header1")}</h2></div>
        </div>

        <div className="strategic-linkages-container">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("execution_table_header1")}</th>
                  <th>{t("execution_table_header2")}</th>
                  <th>{t("execution_table_header3")}</th>
                </tr>
              </thead>
              <tbody>
                {linkages.objective_to_initiative_map.map((link, idx) => {
                  return (
                    <tr key={idx}>
                      <td className="table-value">
                        <div className="linkage-objective-title">
                          {renderSafeItem(link.strategic_objective || link.objective)}
                        </div>
                      </td>
                      <td className="table-value">
                        {link.linked_initiatives && link.linked_initiatives.length > 0 && (
                          <ul className="table-list">
                            {link.linked_initiatives.map((initiative, initIdx) => (
                              <li key={initIdx} className="flex-center">
                                <ArrowRight size={10} className="icon-blue" />
                                {renderSafeItem(initiative)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="table-value">
                        <div className="flex-center success-criteria-text">
                          <Target size={12} />
                          {renderSafeItem(link.success_criteria || link.success_kpi)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  };

  const renderStrategicRecommendationsFromAnalyses = () => {
    const getRecommendations = (data) => {
      if (!data) return null;
      return data.pestel_analysis?.strategic_recommendations || 
             data.porter_analysis?.strategic_recommendations || 
             data.strategic_recommendations || data;
    };

    const pestelRecs = getRecommendations(pestelData);
    const portersRecs = getRecommendations(portersData);

    const combinedImmediateActions = [
      ...(pestelRecs?.immediate_actions || []),
      ...(portersRecs?.immediate_actions || [])
    ].filter(a => a && a !== 'N/A');

    const combinedShortTerm = [
      ...(pestelRecs?.short_term_initiatives || []),
      ...(portersRecs?.short_term_initiatives || [])
    ].filter(a => a && a !== 'N/A');

    const combinedLongTerm = [
      ...(pestelRecs?.long_term_strategic_shifts || []),
      ...(portersRecs?.long_term_strategic_shifts || [])
    ].filter(a => a && a !== 'N/A');

    if (combinedImmediateActions.length === 0 && combinedShortTerm.length === 0 && combinedLongTerm.length === 0) {
      return null;
    }

    return (
      <section className="strategic-page-section">
        {combinedImmediateActions.length > 0 && (
          <div className="section-margin-lg">
            <h3 className="pillar-section-title">
              <Zap size={20} className="icon-red" />
              {t('execution_table2_header')}
            </h3>
            <div className="table-container no-margin-padding">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("execution_table2_header1")}</th>
                    <th>{t("execution_table2_header2")}</th>
                    <th>{t("execution_table2_header3")}</th>
                    <th>{t("execution_table2_header5")}</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedImmediateActions.map((action, idx) => (
                    <tr key={idx}>
                      <td className="table-value">{renderSafeItem(action.action)}</td>
                      <td className="table-value text-gray-dark">{renderSafeItem(action.rationale)}</td>
                      <td className="table-value"><span className="badge-blue">{renderSafeItem(action.timeline)}</span></td>
                      <td className="table-value success-metric-text">
                        {action.success_metrics?.map((m, midx) => <div key={midx} className="flex-center"><Target size={10} />{renderSafeItem(m)}</div>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {combinedShortTerm.length > 0 && (
          <div className="section-margin-lg">
            <h3 className="pillar-section-title">
              <Activity size={20} className="icon-orange" />
              {t('execution_table3_header')}
            </h3>
            <div className="table-container no-margin-padding">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("execution_table3_header1")}</th>
                    <th>{t("execution_table3_header2")}</th>
                    <th>{t("execution_table3_header3")}</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedShortTerm.map((init, idx) => (
                    <tr key={idx}>
                      <td className="table-value">{renderSafeItem(init.initiative)}</td>
                      <td className="table-value"><span className="badge-purple">{renderSafeItem(init.strategic_pillar)}</span></td>
                      <td className="table-value text-gray-dark">{renderSafeItem(init.expected_outcome)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderTacticHorizons = () => {
    const horizons = [
      { key: 'immediate_90_days', title: t('execution_table2_header'), icon: <Zap size={18} className="icon-red" /> },
      { key: 'short_term_1_year', title: t('execution_table3_header'), icon: <Activity size={18} className="icon-orange" /> },
      { key: 'long_term_3_5_years', title: t('execution_table4_header'), icon: <TrendingUp size={18} className="icon-purple" /> }
    ];

    return horizons.map(horizon => {
      const items = tactics[horizon.key];
      if (!items || !Array.isArray(items) || items.length === 0) return null;

      return (
        <div key={horizon.key} className="subsection mt-4">
          <h4 className="subsection-title">{horizon.icon} {horizon.title}</h4>
          <ul className="info-list tactics">
            {items.map((item, idx) => (
              <li key={idx} className="info-list-item">{renderSafeItem(item)}</li>
            ))}
          </ul>
        </div>
      );
    });
  };

  return (
    <div className="pillar-container">
      <div className="pillar-card tactics-card">
        <div className="pillar-header tactics-header clickable-header" onClick={onToggle}>
          <Zap size={22} className="tactics-icon" />
          <h3 className="pillar-title">{t("execution_subtitle_1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={tactics.diagnostic} />
          {renderTacticHorizons()}
          {renderStrategicLinkages(strategicLinkages)}
          {renderStrategicRecommendationsFromAnalyses()}
        </div>
      </div>
    </div>
  );
};


export default TacticsPillar;
