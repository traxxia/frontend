import React from 'react';
import { Settings, ChevronUp, ChevronDown, Calendar, Clock, BarChart3, Users, Target, Link2, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import DiagnosticBox from './DiagnosticBox';
import { StreamingRow } from '../StreamingManager';
import { parseDuration } from './strategicUtils';

const ExecutionPillar = ({ 
  execution, 
  isExpanded, 
  onToggle, 
  visibleRows, 
  lastRowRef, 
  streamingManager, 
  cardId,
  isExportActive = () => false
}) => {
  const { t } = useTranslation();
  if (!execution) return null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderGanttChart = (roadmap) => {
    if (!roadmap || roadmap.length === 0) return null;
    let cumulativeMonths = 0;
    const initiativesWithTimeline = roadmap.map((item, index) => {
      const duration = parseDuration(item.milestone || '1 month');
      const startMonth = cumulativeMonths;
      cumulativeMonths += duration;
      return { ...item, duration, startMonth, endMonth: cumulativeMonths, index };
    });

    const totalTimeline = Math.max(12, Math.ceil(cumulativeMonths));

    return (
      <div className="gantt-container">
        <div className="timeline-card">
          <h3 className="timeline-card-title">{t("execution1_table2_header2")} ({Math.ceil(cumulativeMonths)} {t("months") || "months"})</h3>
          <div className="gantt-scroll-wrapper">
            <div className="gantt-min-width-container">
              <div className="gantt-timeline-header">
                <div style={{ width: '180px', marginRight: '12px' }} />
                {Array.from({ length: totalTimeline }).map((_, i) => (
                  <div key={i} className="gantt-timeline-month">M{i+1}</div>
                ))}
              </div>
              <div className="gantt-relative-container">
                {initiativesWithTimeline.map((item, idx) => (
                  <div key={idx} className="gantt-row">
                    <div className="gantt-label-container" style={{ width: '180px' }}>
                      <div className="gantt-dot" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {item.initiative}
                    </div>
                    <div className="gantt-bar-track">
                      <div 
                        className="gantt-bar"
                        style={{
                          left: `${(item.startMonth / totalTimeline) * 100}%`,
                          width: `${(item.duration / totalTimeline) * 100}%`,
                          backgroundColor: COLORS[idx % COLORS.length]
                        }}
                      >
                        <span className="gantt-bar-label">{Math.round(item.duration)}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderKPISection = (title, icon, metrics, badgeClass) => {
    if (!metrics || metrics.length === 0) return null;
    return (
      <div className="subsection">
        <h5 className="subsection-title">
          {icon}
          {title}
        </h5>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("kpi_table_body")}</th>
                <th>{t("kpi_table_body1")}</th>
                <th>{t("execution1_table3_header4")}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, idx) => (
                <tr key={idx}>
                  <td className="table-value">{m.metric}</td>
                  <td className="table-value"><span className={`badge ${badgeClass}`}>{m.target}</span></td>
                  <td className="table-value"><div className="flex-center"><Users size={12} />{m.owner}</div></td>
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
      <div className="pillar-card execution-card">
        <div className="pillar-header execution-header clickable-header" onClick={onToggle}>
          <Settings size={22} className="execution-icon" />
          <h3 className="pillar-title">{t("execution1_table2_header1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={execution.diagnostic} />

          {execution.implementation_roadmap && execution.implementation_roadmap.length > 0 && (
            <div className="gantt-margin-bottom">
              <h4 className="subsection-title">
                <Calendar size={18} className="execution-icon" /> {t("execution1_table3_header1")}
              </h4>
              
              {renderGanttChart(execution.implementation_roadmap)}

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("execution_table3_header1")}</th>
                      <th>{t("execution1_table3_header2")}</th>
                      <th>{t("execution1_table3_header3")}</th>
                      <th>{t("execution1_table3_header4")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execution.implementation_roadmap.map((item, idx) => (
                      <tr key={idx}>
                        <td className="table-value">{item.initiative}</td>
                        <td className="table-value">{item.milestone}</td>
                        <td className="table-value"><div className="flex-center"><Calendar size={12} />{item.target_date}</div></td>
                        <td className="table-value"><div className="flex-center"><Users size={12} />{item.owner}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {execution.kpi_dashboard && (
            <div className="subsection">
              <h4 className="subsection-title"><BarChart3 size={18} className="execution-icon" /> {t("kpi_dashboard")}</h4>
              {execution.kpi_dashboard.review_cadence && (
                <div className="info-box execution">
                  <Clock size={16} className="execution-icon" />
                  <span className="info-box-text execution">{t("review_cadence")}: {execution.kpi_dashboard.review_cadence}</span>
                </div>
              )}
              {renderKPISection(t("kpi_table_header"), <TrendingUp size={14} className="icon-blue" />, execution.kpi_dashboard.adoption_metrics, "adoption")}
              {renderKPISection(t("kpi_table1_header"), <Link2 size={14} className="icon-purple" />, execution.kpi_dashboard.network_metrics, "network")}
              {renderKPISection(t("kpi_table2_header"), <Activity size={14} className="icon-orange" />, execution.kpi_dashboard.operational_metrics, "operational")}
              {renderKPISection(t("kpi_table3_header"), <DollarSign size={14} className="icon-green" />, execution.kpi_dashboard.financial_metrics, "financial")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionPillar;
