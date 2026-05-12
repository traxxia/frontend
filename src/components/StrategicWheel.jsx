import React, { useState } from 'react';
import { Target, BarChart3, Users, Activity, Zap, TrendingUp, Shield, Star, Eye, Settings, Grid, PieChart } from 'lucide-react';
const StrategicWheel = ({
  pillarsData,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState('wheel');
  if (!pillarsData || Object.keys(pillarsData).length === 0) {
    return null;
  }
  const pillarsArray = Object.entries(pillarsData);
  const totalPillars = pillarsArray.length;
  const segmentColors = ['#e74c3c', '#f39c12', '#f1c40f', '#27ae60', '#16a085', '#3498db', '#9b59b6', '#e67e22', '#34495e'];
  const getPillarIcon = pillarKey => {
    const icons = {
      strategy: Target,
      tactics: BarChart3,
      resources: Users,
      analysis_and_data: Activity,
      technology_and_digitization: Zap,
      execution: TrendingUp,
      governance: Shield,
      innovation: Star,
      culture: Eye
    };
    return icons[pillarKey] || Settings;
  };
  const formatPillarName = pillarKey => {
    return pillarKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const getScoreColor = score => {
    if (score >= 7) return '#10b981';
    if (score >= 5) return '#f59e0b';
    return '#ef4444';
  };
  const getPriorityColor = priority => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };
  const segmentAngle = 360 / totalPillars;
  const radius = 180;
  const innerRadius = 65;
  const centerX = 220;
  const centerY = 220;
  const createSegmentPath = index => {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
    const x1 = centerX + innerRadius * Math.cos(startAngle);
    const y1 = centerY + innerRadius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(startAngle);
    const y2 = centerY + radius * Math.sin(startAngle);
    const x3 = centerX + radius * Math.cos(endAngle);
    const y3 = centerY + radius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(endAngle);
    const y4 = centerY + innerRadius * Math.sin(endAngle);
    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} L ${x2} ${y2} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`;
  };
  const getTextPosition = index => {
    const angle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
    const textRadius = (radius + innerRadius) / 2 + 10;
    return {
      x: centerX + textRadius * Math.cos(angle),
      y: centerY + textRadius * Math.sin(angle)
    };
  };
  const getIconPosition = index => {
    const angle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
    const iconRadius = innerRadius + 20;
    return {
      x: centerX + iconRadius * Math.cos(angle),
      y: centerY + iconRadius * Math.sin(angle)
    };
  };
  const renderTableView = () => {
    return <div className="table-container strategic-wheel--s1">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Pillar</th>
                            <th>Recommendations</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pillarsArray.map(([pillarKey, pillar]) => {
            const IconComponent = getPillarIcon(pillarKey);
            return <tr key={pillarKey}>
                                    <td className="table-value">
                                        <div className="pillar-name">
                                            <IconComponent size={16} />
                                            {formatPillarName(pillarKey)}
                                        </div>
                                    </td>
                                    <td className="table-value">
                                        {pillar.recommendations && pillar.recommendations.length > 0 && <div className="recommendations-list">
                                                {pillar.recommendations.map((rec, idx) => <div key={idx} className="recommendation-item">
                                                        <div className="rec-header">
                                                            <span className="rec-text">{rec.action}</span>
                                                            <span className="priority-badge" style={{
                        backgroundColor: getPriorityColor(rec.priority)
                      }}>
                                                                {rec.priority}
                                                            </span>
                                                        </div>

                                                        <div className="rec-details">
                                                            {rec.timeline && <div className="detail-item">
                                                                    <span className="detail-label">Timeline:</span> {rec.timeline}
                                                                </div>}

                                                            {rec.expected_impact && <div className="detail-item">
                                                                    <span className="detail-label">Impact:</span> {rec.expected_impact}
                                                                </div>}

                                                            {rec.resources_required && rec.resources_required.length > 0 && <div className="detail-item">
                                                                    <span className="detail-label">Resources:</span> {rec.resources_required.join(', ')}
                                                                </div>}
                                                        </div>
                                                    </div>)}
                                            </div>}
                                    </td>
                                </tr>;
          })}
                    </tbody>
                </table>
            </div>;
  };
  return <div className={`strategic-wheel-container ${className} strategic-wheel--s2`}>
            {}
            <div className="strategic-wheel--s3">
                <button onClick={() => setViewMode('wheel')} style={{
        backgroundColor: viewMode === 'wheel' ? '#3b82f6' : 'transparent',
        color: viewMode === 'wheel' ? 'white' : '#64748b'
      }} className="strategic-wheel--s4">
                    <PieChart size={16} />
                    Wheel View
                </button>
                <button onClick={() => setViewMode('table')} style={{
        backgroundColor: viewMode === 'table' ? '#3b82f6' : 'transparent',
        color: viewMode === 'table' ? 'white' : '#64748b'
      }} className="strategic-wheel--s4">
                    <Grid size={16} />
                    Table View
                </button>
            </div>

            {viewMode === 'wheel' ? <>
                    <div className="strategic-wheel--s5">
                        <svg viewBox="0 0 440 440" className="strategic-wheel--s6">
                            {}
                            {pillarsArray.map(([pillarKey, pillarData], index) => {
            const IconComponent = getPillarIcon(pillarKey);
            const textPos = getTextPosition(index);
            const iconPos = getIconPosition(index);
            const score = pillarData.current_state?.assessment_score || 0;
            return <g key={pillarKey}>
                                        {}
                                        <path d={createSegmentPath(index)} fill={segmentColors[index % segmentColors.length]} stroke="#fff" strokeWidth="2" opacity="0.8" onMouseEnter={e => e.target.style.opacity = '1'} onMouseLeave={e => e.target.style.opacity = '0.8'} className="strategic-wheel--s7" />

                                        {}
                                        <text x={textPos.x} y={textPos.y - 12} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="bold" className="strategic-wheel--s8">
                                            {formatPillarName(pillarKey).split(' ').map((word, i) => <tspan key={i} x={textPos.x} dy={i === 0 ? 0 : 10}>
                                                    {word}
                                                </tspan>)}
                                        </text>

                                        {}
                                        <text x={textPos.x} y={textPos.y + 18} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="bold" className="strategic-wheel--s8">
                                            {score}/10
                                        </text>
                                    </g>;
          })}

                            {}
                            <circle cx={centerX} cy={centerY} r={innerRadius} fill="#2c3e50" stroke="#fff" strokeWidth="3" />

                            {}
                            <text x={centerX} y={centerY - 5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">
                                STRATEGIC
                            </text>
                            <text x={centerX} y={centerY + 10} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="bold">
                                PILLARS
                            </text>
                        </svg>
                    </div>
                </> : renderTableView()}
        </div>;
};
export default StrategicWheel;