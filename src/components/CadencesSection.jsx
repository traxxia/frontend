import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, LineChart, Clock } from 'lucide-react';
import '../styles/CadencesSection.css';

const CadencesSection = ({ cadences = [] }) => {
  const { t } = useTranslation();
  const [evolutionTab, setEvolutionTab] = useState('Status');

  const getIconColorClass = (frequency) => {
    switch (frequency?.toLowerCase()) {
      case 'monthly': return 'monthly';
      case 'quarterly': return 'quarterly';
      case 'annually': return 'annually';
      default: return 'default';
    }
  };

  return (
    <div className="cadences-section">
      <div className="d-flex justify-content-between align-items-center cadences-header">
        <div>
          <div className="cadences-subtitle">CADENCES</div>
          <h2 className="cadences-title">Recurring cadences — the rhythm of the business</h2>
        </div>
        <button className="btn btn-outline-primary d-flex align-items-center gap-2 rounded-pill px-3 py-1 bg-white">
          <Plus size={16} /> New cadence
        </button>
      </div>

      <div className="cadences-card">
        <table className="cadences-table">
          <thead>
            <tr>
              <th>CADENCE</th>
              <th>BETS</th>
              <th>NEXT</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {cadences.length > 0 ? (
              cadences.map((cadence, index) => (
                <tr key={index}>
                  <td>
                    <div className="cadence-info-cell">
                      <div className={`cadence-icon-wrapper ${getIconColorClass(cadence.frequency)}`}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="cadence-name">{cadence.name}</div>
                        <div className="cadence-frequency">{cadence.frequency}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cadence-bets-count">{cadence.betsCount || 0}</span>
                  </td>
                  <td>
                    <span className="cadence-next-date">{cadence.nextDate || 'No dates scheduled'}</span>
                  </td>
                  <td>
                    <span className="cadence-status-pill">{cadence.status || 'NOT SCHEDULED'}</span>
                  </td>
                  <td>
                    <div className="cadence-actions">
                      <button className="btn-schedule">Schedule dates</button>
                      <button className="btn-icon-kebab"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  No cadences found. Click "New cadence" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="evolution-section mt-5">
        <div className="evolution-header">
          <div>
            <div className="cadences-subtitle">EVOLUTION</div>
            <h2 className="cadences-title">How every bet has moved, review by review</h2>
          </div>
          <div className="evolution-filters">
            <button className="evolution-dropdown">
              All cadences <ChevronDownIcon />
            </button>
            <button className="evolution-dropdown">
              All time <ChevronDownIcon />
            </button>
          </div>
        </div>

        <div className="evolution-toggle-group">
          {['Status', 'Learning', 'Insights'].map(tab => (
            <button 
              key={tab}
              className={`evolution-toggle-btn ${evolutionTab === tab ? 'active' : ''}`}
              onClick={() => setEvolutionTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="evolution-empty-state">
          <LineChart size={32} className="empty-state-icon" />
          <p className="empty-state-text">No history yet</p>
        </div>
      </div>
    </div>
  );
};

// Helper for the chevron icon inside the component since we only need it here
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default CadencesSection;
