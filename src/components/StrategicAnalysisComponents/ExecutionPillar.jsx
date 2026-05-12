import React from 'react';
import { Settings, ChevronUp, ChevronDown, Calendar, Clock } from 'lucide-react';
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

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  const renderGanttChart = (roadmap) => {
    if (!roadmap || roadmap.length === 0) return null;
    let cumulativeMonths = 0;
    const initiativesWithTimeline = roadmap.map((item, index) => {
      const duration = parseDuration(item.milestone || '1 month');
      const startMonth = cumulativeMonths;
      cumulativeMonths += duration;
      return { ...item, duration, startMonth, endMonth: cumulativeMonths, index };
    });

    const totalDuration = Math.max(12, Math.ceil(cumulativeMonths));

    return (
      <div className="strategic-analysis--s13">
        <div className="strategic-analysis--s14">
          <div className="strategic-analysis--s15">
            <div className="strategic-analysis--s7">
              <div style={{ width: '180px', marginRight: '12px' }} />
              {Array.from({ length: totalDuration + 1 }).map((_, i) => (
                <div key={i} className="strategic-analysis--s8">M{i}</div>
              ))}
            </div>
            
            {initiativesWithTimeline.map((item, idx) => (
              <div key={idx} className="strategic-analysis--s16">
                <div className="strategic-analysis--s17" style={{ width: '180px' }}>
                  <div 
                    className="strategic-analysis--s18" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                  />
                  {item.initiative}
                </div>
                <div className="strategic-analysis--s19">
                  <div 
                    className="strategic-analysis--s6"
                    style={{
                      left: `${(item.startMonth / totalDuration) * 100}%`,
                      width: `${(item.duration / totalDuration) * 100}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }}
                  >
                    <span className="strategic-analysis--s20">
                      {item.duration >= 1 ? item.initiative : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pillar-container">
      <div className="pillar-card execution-card">
        <div className="pillar-header execution-header strategic-analysis--s5" onClick={onToggle}>
          <Settings size={22} className="execution-icon" />
          <h3 className="pillar-title">{t("execution1_table_header1")}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        <div className={`pillar-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <DiagnosticBox diagnostic={execution.diagnostic} />

          {execution.implementation_roadmap && execution.implementation_roadmap.length > 0 && (
            <div className="strategic-analysis--s11">
              <h4 className="strategic-analysis--s12">
                <Calendar size={16} className="execution-icon" /> {t("implementation_roadmap")}
              </h4>
              
              {renderGanttChart(execution.implementation_roadmap)}

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("initiative")}</th>
                      <th>{t("milestone")}</th>
                      <th>{t("owner")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execution.implementation_roadmap.map((item, idx) => {
                      if (idx >= visibleRows && !isExportActive()) return null;
                      return (
                        <StreamingRow 
                          key={idx} 
                          isVisible={true} 
                          isLast={idx === visibleRows - 1} 
                          lastRowRef={lastRowRef}
                        >
                          <td>{item.initiative}</td>
                          <td>{item.milestone}</td>
                          <td>{item.owner}</td>
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

export default ExecutionPillar;
