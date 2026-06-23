import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, LineChart, Clock } from 'lucide-react';
import { Dropdown, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store';
import CadenceModal from './CadenceModal';
import ScheduleDatesModal from './ScheduleDatesModal';
import '../styles/CadencesSection.css';
import '../styles/ProjectsTable.css';

const getStatusSeverity = (status) => {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (['COMPLETED', 'SCALED'].includes(s)) return 5;
  if (s === 'ACTIVE') return 4;
  if (s === 'PAUSED') return 3;
  if (s === 'AT RISK') return 2;
  if (['KILLED', 'STALLED'].includes(s)) return 1;
  return 0;
};

const getLearningSeverity = (learning) => {
  if (!learning) return 0;
  const l = learning.toUpperCase();
  if (l === 'VALIDATED') return 4;
  if (l === 'TESTING') return 3;
  if (l === 'NOT STARTED') return 2;
  if (l === 'INVALIDATED') return 1;
  return 0;
};

const CadencesSection = ({ businessId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [evolutionTab, setEvolutionTab] = useState('Status');
  const [cadences, setCadences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [completedUpdates, setCompletedUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState(null);

  const fetchData = async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      
      const config = { headers };

      const [cadResponse, projResponse, compResponse] = await Promise.all([
        axios.get(`${baseUrl}/api/cadences?business_id=${businessId}`, config),
        axios.get(`${baseUrl}/api/projects?business_id=${businessId}`, config),
        axios.get(`${baseUrl}/api/completed-bet-cadences?business_id=${businessId}`, config)
      ]);
      
      setCadences(cadResponse.data);
      setProjects(projResponse.data.projects || []);
      setCompletedUpdates(compResponse.data);
    } catch (err) {
      console.error("Failed to fetch cadences data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce the fetch slightly to bypass React 18 StrictMode double-mounting
    // This prevents both the double network request and the red "(canceled)" errors.
    const timer = setTimeout(() => {
      fetchData();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [businessId]);

  const handleSaveCadence = async (cadenceData) => {
    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };
      const url = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences`;

      if (selectedCadence && selectedCadence._id) {
        await axios.put(`${url}/${selectedCadence._id}`, cadenceData, { headers });
      } else {
        await axios.post(url, { ...cadenceData, business_id: businessId }, { headers });
      }
      fetchData();
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
      fetchData();
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
      fetchData();
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

  const getBetsForCadence = (cadenceName) => {
    return projects.filter(p => {
      const cStr = p.review_cadence || p.cadence || "";
      const names = cStr.split(",").map(s => s.trim()).filter(Boolean);
      return names.includes(cadenceName);
    });
  };

  // Find stale moments (dates in the past that have pending updates)
  const getStaleMoments = () => {
    const staleList = [];
    const now = new Date();
    
    cadences.forEach(c => {
      if (!c.scheduleDates) return;
      const bets = getBetsForCadence(c.name);
      if (bets.length === 0) return; // No bets, nothing to close

      c.scheduleDates.forEach(moment => {
        const mDate = new Date(moment.date);
        if (mDate <= now) {
          // Check if there are any bets not completed
          const momentCompleted = completedUpdates.filter(cu => cu.cadence_id === c._id && cu.moment_id === moment._id);
          const pendingBets = bets.length - momentCompleted.length;
          
          if (pendingBets > 0) {
            staleList.push({
              cadence: c,
              moment,
              pendingCount: pendingBets
            });
          }
        }
      });
    });
    
    return staleList.sort((a, b) => new Date(a.moment.date) - new Date(b.moment.date));
  };

  const staleMoments = getStaleMoments();

  // For the Evolution table
  const allMoments = [];
  cadences.forEach(c => {
    if (c.scheduleDates) {
      c.scheduleDates.forEach(m => {
        allMoments.push({ cadence: c, moment: m });
      });
    }
  });
  allMoments.sort((a, b) => new Date(a.moment.date) - new Date(b.moment.date));

  return (
    <div className="cadences-section">
      {/* AWAITING CLOSE SECTION */}
      {staleMoments.length > 0 && (
        <div className="awaiting-close-container mb-5">
          {staleMoments.map((sm, idx) => (
            <div key={`${sm.cadence._id}-${sm.moment._id}`} className="awaiting-close-card">
              <div className="awaiting-info">
                <span className="awaiting-badge">
                  <span className="dot"></span> AWAITING CLOSE
                </span>
                <span className="awaiting-title">{sm.cadence.name} · {sm.moment.name}</span>
                <span className="awaiting-meta">
                  {new Date(sm.moment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} 
                  {' · '}{sm.pendingCount} bets to update
                </span>
              </div>
              <button 
                className="btn-schedule fw-bold" 
                style={{ backgroundColor: '#0c71b9', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px' }}
                onClick={() => navigate(`/business/${businessId}/cadence/${sm.cadence._id}/moment/${sm.moment._id}`)}
              >
                Close & capture
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center cadences-header">
        <div>
          <div className="cadences-subtitle">CADENCES</div>
          <h2 className="cadences-title">Recurring cadences — the rhythm of the business</h2>
        </div>
        <button 
          className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 py-1 bg-white"
          onClick={openCreateModal}
          style={{ borderColor: '#cbd5e1', color: '#0c71b9', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}
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
                const now = new Date();
                const nextMoment = cadence.scheduleDates && cadence.scheduleDates.length > 0 
                  ? cadence.scheduleDates.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).find(d => new Date(d.date) >= now) 
                  : null;
                
                const betsCount = getBetsForCadence(cadence.name).length;
                const isStale = staleMoments.some(sm => sm.cadence._id === cadence._id);
                const hasSchedule = cadence.scheduleDates && cadence.scheduleDates.length > 0;
                  
                return (
                <tr key={cadence._id || index} style={{ borderLeft: isStale ? '4px solid #ef4444' : (nextMoment ? '4px solid #0c71b9' : '4px solid transparent') }}>
                  <td>
                    <div className="cadence-info-cell">
                      <div className={`cadence-icon-wrapper ${getIconColorClass(cadence.frequency)}`}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="cadence-name text-dark fw-bold">{cadence.name}</div>
                        <div className="cadence-frequency">{cadence.frequency}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cadence-bets-count fw-bold text-dark">{betsCount}</span>
                  </td>
                  <td>
                      {nextMoment ? (
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>{new Date(nextMoment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{nextMoment.name}</div>
                        </div>
                      ) : (
                        <div className="text-muted fst-italic">No dates scheduled</div>
                      )}
                  </td>
                  <td>
                    {isStale ? (
                      <span className="badge bg-danger bg-opacity-10 text-danger fw-bold rounded-pill px-2">NEEDS CLOSE</span>
                    ) : nextMoment ? (
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold rounded-pill px-2">SCHEDULED</span>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-10 text-secondary fw-bold rounded-pill px-2">NOT SCHEDULED</span>
                    )}
                  </td>
                  <td>
                    <div className="cadence-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        className="me-2 fw-medium px-3 text-white rounded-pill"
                        style={{ backgroundColor: '#0c71b9', border: 'none' }}
                        onClick={() => {
                          if (staleMoments.length > 0) {
                            navigate(`/business/${businessId}/cadence/${cadence._id}/moment/${staleMoments[0].moment._id}`);
                          } else if (nextMoment) {
                            navigate(`/business/${businessId}/cadence/${cadence._id}/moment/${nextMoment._id}`);
                          } else {
                            openScheduleModal(cadence);
                          }
                        }}
                      >
                        {hasSchedule ? 'Close & capture' : 'Schedule dates'}
                      </Button>
                      
                      <Dropdown align="end" className="d-inline cadence-dropdown">
                        <Dropdown.Toggle variant="link" className="btn-icon-kebab bg-transparent border-0 m-0 p-0 d-flex align-items-center justify-content-center text-decoration-none shadow-none">
                          <MoreVertical size={16} color="#64748b" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-sm border-0 py-2" style={{ borderRadius: '8px', minWidth: '150px', border: '1px solid #e2e8f0' }}>
                          <Dropdown.Item onClick={() => openScheduleModal(cadence)} className="py-2 px-3 text-dark fw-medium cadence-dropdown-item">
                            Manage dates
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => openEditModal(cadence)} className="py-2 px-3 text-dark fw-medium cadence-dropdown-item">
                            Edit cadence
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDeleteCadence(cadence._id)} className="py-2 px-3 text-danger fw-medium cadence-dropdown-item">
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
            <h2 className="cadences-title" style={{ fontSize: '18px' }}>How every bet has moved, review by review</h2>
          </div>
        </div>

        <div className="evolution-toggle-group">
          {['Status', 'Learning'].map(tab => (
            <button 
              key={tab}
              className={`evolution-toggle-btn fw-bold ${evolutionTab === tab ? 'active text-primary' : 'text-muted'}`}
              onClick={() => setEvolutionTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {projects.filter(bet => completedUpdates.some(cu => cu.bet_id === bet._id)).length === 0 || allMoments.length === 0 ? (
          <div className="evolution-empty-state">
            <LineChart size={32} className="empty-state-icon" />
            <p className="empty-state-text">No history yet</p>
          </div>
        ) : (
          <div className="table-responsive mt-3">
            <table className="table table-bordered align-middle">
              <thead className="bg-light text-center" style={{ fontSize: '12px' }}>
                <tr>
                  <th className="text-start align-bottom p-3" style={{ minWidth: '250px' }}>BET</th>
                  {allMoments.map((col, i) => (
                    <th key={i} className="p-3" style={{ minWidth: '120px' }}>
                      <div className="fw-bold text-dark">{col.cadence.name}</div>
                      <div className="text-muted">{col.moment.name}</div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>
                        {new Date(col.moment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-center" style={{ fontSize: '13px' }}>
                {projects.filter(bet => completedUpdates.some(cu => cu.bet_id === bet._id)).map(bet => {
                  return (
                    <tr key={bet._id}>
                      <td className="text-start p-3 fw-medium">
                        {bet.project_name || bet.initiative_name || bet.name || "Unnamed Bet"}
                      </td>
                      {allMoments.map((col, i) => {
                        // Is this bet associated with this cadence?
                        const betsForCadence = getBetsForCadence(col.cadence.name);
                        const isAssociated = betsForCadence.some(b => b._id === bet._id);
                        
                        if (!isAssociated) {
                          return <td key={i} className="bg-light text-muted">—</td>;
                        }

                        // Check if completed update exists
                        const updateRecord = completedUpdates.find(cu => cu.bet_id === bet._id && cu.moment_id === col.moment._id);
                        
                        if (updateRecord) {
                          let arrow = null;
                          if (i > 0) {
                            let prevRecord = null;
                            for (let j = i - 1; j >= 0; j--) {
                              prevRecord = completedUpdates.find(cu => cu.bet_id === bet._id && cu.moment_id === allMoments[j].moment._id);
                              if (prevRecord) break;
                            }
                            if (prevRecord) {
                              if (evolutionTab === 'Status') {
                                const currSev = getStatusSeverity(updateRecord.status);
                                const prevSev = getStatusSeverity(prevRecord.status);
                                if (currSev > prevSev) arrow = <span className="ms-1 text-success" style={{ fontSize: '10px' }}>▲</span>;
                                if (currSev < prevSev) arrow = <span className="ms-1 text-danger" style={{ fontSize: '10px' }}>▼</span>;
                              } else {
                                const currSev = getLearningSeverity(updateRecord.learning_state);
                                const prevSev = getLearningSeverity(prevRecord.learning_state);
                                if (currSev > prevSev) arrow = <span className="ms-1 text-success" style={{ fontSize: '10px' }}>▲</span>;
                                if (currSev < prevSev) arrow = <span className="ms-1 text-danger" style={{ fontSize: '10px' }}>▼</span>;
                              }
                            }
                          }

                          return (
                            <td key={i} className="p-3">
                              {evolutionTab === 'Status' ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold px-2 py-1">
                                  {updateRecord.status?.toUpperCase() || "ACTIVE"}
                                </span>
                              ) : (
                                <span className="badge bg-info bg-opacity-10 text-info border border-info fw-bold px-2 py-1">
                                  {updateRecord.learning_state?.toUpperCase() || "TESTING"}
                                </span>
                              )}
                              {arrow}
                            </td>
                          );
                        }

                        // Not completed. Is it past or future?
                        const now = new Date();
                        const isPast = new Date(col.moment.date) <= now;
                        
                        if (isPast) {
                          return (
                            <td key={i} className="p-3 text-muted">—</td>
                          );
                        } else {
                          return (
                            <td key={i} className="p-3 text-muted">TBD</td>
                          );
                        }
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default CadencesSection;
