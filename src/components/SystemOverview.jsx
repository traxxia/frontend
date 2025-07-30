import React from 'react';
import { RefreshCw, TrendingUp, Building2, Users, HelpCircle, Activity } from 'lucide-react';

const SystemOverview = ({ systemStats, onRefresh }) => {
  if (!systemStats) {
    return (
      <div className="overview-loading">
        <p>Loading system overview...</p>
      </div>
    );
  }

  const { system_statistics, company_breakdown } = systemStats;

  return (
    <div className="system-overview">
      <div className="overview-header">
        <h2>System Overview</h2>
        <button className="refresh-btn" onClick={onRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon companies">
            <Building2 size={24} />
          </div>
          <div className="metric-content">
            <h3>{system_statistics.companies.total}</h3>
            <p>Total Companies</p>
            <span className="metric-sub">{system_statistics.companies.active} active</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon users">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>{system_statistics.users.total}</h3>
            <p>Total Users</p>
            <span className="metric-sub">{system_statistics.users.active} active</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon questions">
            <HelpCircle size={24} />
          </div>
          <div className="metric-content">
            <h3>{system_statistics.content.global_questions}</h3>
            <p>Global Questions</p>
            <span className="metric-sub">Active questions</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon engagement">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <h3>{system_statistics.engagement.total_sessions}</h3>
            <p>Total Sessions</p>
            <span className="metric-sub">{system_statistics.engagement.total_answers} answers</span>
          </div>
        </div>
      </div>

      {/* Company Breakdown */}
      <div className="company-breakdown">
        <h3>Company Breakdown</h3>
        <div className="company-list">
          {company_breakdown.map(company => (
            <div key={company._id} className="company-item">
              <div className="company-info">
                <h4>{company.company_name}</h4>
                <span className="company-code">{company.company_code}</span>
              </div>
              <div className="company-stats">
                <span className="user-count">{company.user_count} users</span>
                <span className={`status ${company.status}`}>{company.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="engagement-overview">
        <h3>System Engagement</h3>
        <div className="engagement-stats">
          <div className="stat-item">
            <span className="stat-label">Average Answers per User</span>
            <span className="stat-value">{system_statistics.engagement.avg_answers_per_user}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Phase Results Generated</span>
            <span className="stat-value">{system_statistics.engagement.phase_results}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Answers</span>
            <span className="stat-value">{system_statistics.engagement.total_answers}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;