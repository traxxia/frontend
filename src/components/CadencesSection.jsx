import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, LineChart, Clock } from 'lucide-react';
import { Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { useAuthStore } from '../store';
import CadenceModal from './CadenceModal';
import ScheduleDatesModal from './ScheduleDatesModal';
import '../styles/CadencesSection.css';

const CadencesSection = ({ businessId }) => {
  const { t } = useTranslation();
  const [evolutionTab, setEvolutionTab] = useState('Status');
  const [cadences, setCadences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState(null);

  const fetchCadences = async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences?business_id=${businessId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCadences(response.data);
    } catch (err) {
      console.error("Failed to fetch cadences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCadences();
  }, [businessId]);

  const handleSaveCadence = async (cadenceData) => {
    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };
      const url = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences`;

      if (selectedCadence && selectedCadence._id) {
        // Update
        await axios.put(`${url}/${selectedCadence._id}`, cadenceData, { headers });
      } else {
        // Create
        await axios.post(url, { ...cadenceData, business_id: businessId }, { headers });
      }
      fetchCadences();
    } catch (err) {
      console.error("Failed to save cadence:", err);
    }
  };

  const handleScheduleDates = async (updatedCadence) => {
    try {
      const token = useAuthStore.getState().token;
      await axios.put(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences/${updatedCadence._id}`, {
        scheduleDates: updatedCadence.scheduleDates
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCadences();
    } catch (err) {
      console.error("Failed to save schedule dates:", err);
    }
  };

  const handleDeleteCadence = async (cadenceId) => {
    if (!window.confirm("Are you sure you want to delete this cadence?")) return;
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences/${cadenceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCadences();
    } catch (err) {
      console.error("Failed to delete cadence:", err);
    }
  };

  const openCreateModal = () => {
    setSelectedCadence(null);
    setShowCadenceModal(true);
  };

  const openEditModal = (cadence) => {
    setSelectedCadence(cadence);
    setShowCadenceModal(true);
  };

  const openScheduleModal = (cadence) => {
    setSelectedCadence(cadence);
    setShowScheduleModal(true);
  };

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
        <button 
          className="btn btn-outline-primary d-flex align-items-center gap-2 rounded-pill px-3 py-1 bg-white"
          onClick={openCreateModal}
        >
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
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">Loading cadences...</td>
              </tr>
            ) : cadences.length > 0 ? (
              cadences.map((cadence, index) => {
                const nextDateObj = cadence.scheduleDates && cadence.scheduleDates.length > 0 
                  ? cadence.scheduleDates.sort((a, b) => new Date(a.date) - new Date(b.date)).find(d => new Date(d.date) >= new Date()) || cadence.scheduleDates[cadence.scheduleDates.length - 1]
                  : null;
                  
                return (
                <tr key={cadence._id || index}>
                  <td>
                    <div className="cadence-info-cell" onClick={() => openEditModal(cadence)} style={{ cursor: 'pointer' }}>
                      <div className={`cadence-icon-wrapper ${getIconColorClass(cadence.frequency)}`}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="cadence-name text-primary fw-medium">{cadence.name}</div>
                        <div className="cadence-frequency text-uppercase" style={{ fontSize: '11px' }}>{cadence.frequency}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cadence-bets-count">{cadence.betsCount || 0}</span>
                  </td>
                  <td>
                    <span className="cadence-next-date">
                      {nextDateObj ? (
                        <>
                          <div className="fw-medium text-dark">{new Date(nextDateObj.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{nextDateObj.name}</div>
                        </>
                      ) : 'No dates scheduled'}
                    </span>
                  </td>
                  <td>
                    <span className={`cadence-status-pill ${nextDateObj ? 'needs-close' : ''}`}>
                      {nextDateObj ? 'NEEDS CLOSE' : 'NOT SCHEDULED'}
                    </span>
                  </td>
                  <td>
                    <div className="cadence-actions">
                      <button className="btn-schedule" onClick={() => openScheduleModal(cadence)}>Schedule dates</button>
                      <Dropdown align="end" className="d-inline">
                        <Dropdown.Toggle as="button" className="btn-icon-kebab bg-transparent border-0 m-0 p-0 d-flex align-items-center justify-content-center">
                          <MoreVertical size={16} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-sm border-0" style={{ borderRadius: '8px', minWidth: '150px' }}>
                          <Dropdown.Item onClick={() => openEditModal(cadence)} className="py-2 px-3 text-dark fw-medium" style={{ fontSize: '14px' }}>
                            Edit cadence
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDeleteCadence(cadence._id)} className="py-2 px-3 text-danger fw-medium" style={{ fontSize: '14px' }}>
                            Delete cadence
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              )})
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

      <CadenceModal 
        show={showCadenceModal} 
        onHide={() => setShowCadenceModal(false)} 
        onSave={handleSaveCadence}
        businessId={businessId}
        existingCadence={selectedCadence}
      />

      <ScheduleDatesModal
        show={showScheduleModal}
        onHide={() => setShowScheduleModal(false)}
        onSave={handleScheduleDates}
        cadence={selectedCadence}
      />
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
