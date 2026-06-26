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

const getStatusBadgeStyle = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE')     return { backgroundColor: '#ffffff', color: '#10b981', border: '1px solid #10b981' };
  if (s === 'AT RISK')    return { backgroundColor: '#ffffff', color: '#ef4444', border: '1px solid #ef4444' };
  if (s === 'PAUSED')     return { backgroundColor: '#ffffff', color: '#f59e0b', border: '1px solid #f59e0b' };
  if (s === 'KILLED')     return { backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #cbd5e1', textDecoration: 'line-through' };
  if (s === 'STALLED')    return { backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #cbd5e1' };
  if (s === 'COMPLETED')  return { backgroundColor: '#ffffff', color: '#0ea5e9', border: '1px solid #0ea5e9' };
  if (s === 'SCALED')     return { backgroundColor: '#ffffff', color: '#8b5cf6', border: '1px solid #8b5cf6' };
  if (s === 'DRAFT')      return { backgroundColor: '#ffffff', color: '#94a3b8', border: '1px solid #e2e8f0' };
  return { backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' };
};

const getLearningBadgeStyle = (learning) => {
  const l = (learning || '').toUpperCase();
  if (l === 'VALIDATED')    return { backgroundColor: '#ffffff', color: '#10b981', border: '1px solid #10b981' };
  if (l === 'TESTING')      return { backgroundColor: '#ffffff', color: '#0ea5e9', border: '1px solid #0ea5e9' };
  if (l === 'INVALIDATED')  return { backgroundColor: '#ffffff', color: '#ef4444', border: '1px solid #ef4444' };
  if (l === 'NOT STARTED')  return { backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #cbd5e1' };
  return { backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' };
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

  const [evolutionCadences, setEvolutionCadences] = useState([]);
  const [selectedEvolutionCadence, setSelectedEvolutionCadence] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  const fetchEvolutionData = async () => {
    if (!businessId) return;
    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      
      const res = await axios.get(`${baseUrl}/api/cadences?business_id=${businessId}&cadence_id=${selectedEvolutionCadence}&time_range=${selectedTimeRange}`, { headers });
      setEvolutionCadences(res.data);
    } catch (err) {
      console.error("Failed to fetch evolution cadences:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvolutionData();
    }, 50);
    return () => clearTimeout(timer);
  }, [businessId, selectedEvolutionCadence, selectedTimeRange]);

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

  // Find stale moments (past dates that have NOT been officially closed via Sign & Close)
  // A notification stays visible until moment.closed === true — which is only set by Sign & Close.
  // completed_bet_cadences records alone do NOT remove the notification.
  const getStaleMoments = () => {
    const staleList = [];
    const now = new Date();

    cadences.forEach(c => {
      if (!c.scheduleDates) return;
      const bets = getBetsForCadence(c.name);
      if (bets.length === 0) return;

      c.scheduleDates.forEach(moment => {
        // Only show notification if the moment has NOT been officially closed
        if (moment.closed) return;

        const mDate = new Date(moment.date);
        if (mDate <= now) {
          // pendingCount = how many bets still have no snapshot for this moment
          // (used purely for the progress label, NOT for dismissing the notification)
          const momentSnapshots = completedUpdates.filter(
            cu => cu.cadence_id?.toString() === c._id?.toString()
              && cu.moment_id === moment._id
          );
          const pendingCount = bets.length - momentSnapshots.length;

          staleList.push({
            cadence: c,
            moment,
            // Show max(0, pending) — once all are filled it shows 0 but notification still stays
            pendingCount: Math.max(0, pendingCount)
          });
        }
      });
    });

    return staleList.sort((a, b) => new Date(a.moment.date) - new Date(b.moment.date));
  };

  const staleMoments = getStaleMoments();

  // Find upcoming moments (dates in the future with bets on agenda)
  const getUpcomingMoments = () => {
    const upcomingList = [];
    const now = new Date();

    cadences.forEach(c => {
      if (!c.scheduleDates) return;
      const bets = getBetsForCadence(c.name);
      if (bets.length === 0) return;

      c.scheduleDates.forEach(moment => {
        if (moment.closed) return;
        const mDate = new Date(moment.date);
        if (mDate > now) {
          // Count bets with no learning state
          const noLearningState = bets.filter(b => !b.learning_state || b.learning_state === '' || b.learning_state === 'Not Started').length;
          upcomingList.push({
            cadence: c,
            moment,
            betsCount: bets.length,
            noLearningStateCount: noLearningState,
            daysUntil: Math.ceil((mDate - now) / (1000 * 60 * 60 * 24))
          });
        }
      });
    });

    return upcomingList.sort((a, b) => new Date(a.moment.date) - new Date(b.moment.date));
  };

  const upcomingMoments = getUpcomingMoments();

  // For the Evolution table
  const allMoments = [];
  evolutionCadences.forEach(c => {
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
        <div className="awaiting-close-container mb-3">
          {staleMoments.map((sm) => (
            <div key={`${sm.cadence._id}-${sm.moment._id}`} className="awaiting-close-card">
              <div className="awaiting-info">
                <span className="awaiting-badge">
                  <span className="dot"></span> AWAITING CLOSE
                </span>
                <span className="awaiting-title">{sm.cadence.name} · {sm.moment.name}</span>
                <span className="awaiting-meta">
                  {new Date(sm.moment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} 
                  {' · '}
                  {sm.pendingCount > 0
                    ? `${sm.pendingCount} bet${sm.pendingCount !== 1 ? 's' : ''} to update`
                    : 'All bets updated — ready to sign & close'
                  }
                </span>
              </div>
              <button 
                className="btn-schedule fw-bold" 
                style={{ backgroundColor: '#0c71b9', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px' }}
                onClick={() => navigate(`/business/${businessId}/cadence/${sm.cadence._id}/moment/${sm.moment._id}`)}
              >
                Close &amp; capture
              </button>
            </div>
          ))}
        </div>
      )}

      {/* UPCOMING MOMENTS SECTION */}
      {upcomingMoments.length > 0 && (
        <div className="upcoming-moments-container mb-5">
          {upcomingMoments.map((um) => (
            <div key={`${um.cadence._id}-${um.moment._id}`} className="upcoming-moment-card">
              <div className="upcoming-info">
                <span className="upcoming-badge">
                  <span className="upcoming-dot"></span>
                  UPCOMING — OPEN TO UPDATE
                </span>
                <span className="upcoming-title">{um.moment.name}</span>
                <span className="upcoming-meta">
                  {new Date(um.moment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  {' · in '}{um.daysUntil} {um.daysUntil === 1 ? 'day' : 'days'}
                  {' · '}{um.betsCount} {um.betsCount === 1 ? 'bet' : 'bets'} on the agenda
                  {um.noLearningStateCount > 0 && ` · ${um.noLearningStateCount} with no learning state yet`}
                </span>
              </div>
              <button
                className="btn-open-moment fw-bold"
                onClick={() => navigate(`/business/${businessId}/cadence/${um.cadence._id}/moment/${um.moment._id}/open`)}
              >
                Open
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
                // hasSchedule is true only when there is an upcoming date OR a stale moment to close
                const isUpcoming = !isStale && nextMoment != null;
                  
                return (
                <tr key={cadence._id || index} style={{ borderLeft: isStale ? '4px solid #ef4444' : (isUpcoming ? '4px solid #0c71b9' : '4px solid transparent') }}>
                  <td>
                    <div className="cadence-info-cell">
                      <div className={`cadence-icon-wrapper ${getIconColorClass(cadence.frequency)}`}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="cadence-name text-dark fw-bold">{cadence.name}</div>
                        <div className="cadence-frequency">{cadence.frequency?.toUpperCase()}</div>
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
                      <span className="cadence-status-pill needs-close">NEEDS CLOSE</span>
                    ) : isUpcoming ? (
                      <span className="cadence-status-pill upcoming">UPCOMING</span>
                    ) : (
                      <span className="cadence-status-pill not-scheduled">NOT SCHEDULED</span>
                    )}
                  </td>
                  <td>
                    <div className="cadence-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        className="me-2 fw-medium px-3 text-white"
                        style={{
                          backgroundColor: '#0c71b9',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                        onClick={() => {
                          const thisCadenceStale = staleMoments.find(sm => sm.cadence._id === cadence._id);
                          if (thisCadenceStale) {
                            navigate(`/business/${businessId}/cadence/${cadence._id}/moment/${thisCadenceStale.moment._id}`);
                          } else if (nextMoment) {
                            navigate(`/business/${businessId}/cadence/${cadence._id}/moment/${nextMoment._id}/open`);
                          } else {
                            openScheduleModal(cadence);
                          }
                        }}
                      >
                        {isStale ? 'Close & capture' : isUpcoming ? 'Open' : 'Schedule dates'}
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
        <div className="evolution-header mb-2 d-flex justify-content-between align-items-center">
          <div>
            <div className="cadences-subtitle" style={{ fontSize: '9px' }}>EVOLUTION</div>
            <h2 className="cadences-title m-0" style={{ fontSize: '15px' }}>How every bet has moved, review by review</h2>
          </div>
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm" 
              style={{ width: 'auto', fontSize: '12px', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: '500' }}
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
            >
              <option value="all">All time</option>
              <option value="last_3_months">Last 3 months</option>
              <option value="last_6_months">Last 6 months</option>
              <option value="last_12_months">Last 12 months</option>
            </select>
            <select 
              className="form-select form-select-sm" 
              style={{ width: 'auto', fontSize: '12px', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: '500' }}
              value={selectedEvolutionCadence}
              onChange={(e) => setSelectedEvolutionCadence(e.target.value)}
            >
              <option value="all">All cadences</option>
              {cadences.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
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

        {allMoments.length === 0 || evolutionCadences.every(c => getBetsForCadence(c.name).length === 0) ? (
          <div className="evolution-empty-state">
            <LineChart size={32} className="empty-state-icon" />
            <p className="empty-state-text">No history yet</p>
          </div>
        ) : (
          <>
            <div className="table-responsive mt-2" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden !important' }}>
            <table className="table align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead className="bg-white text-center" style={{ fontSize: '10px' }}>
                <tr>
                  <th className="text-start align-bottom px-3 py-3" style={{ minWidth: '160px', borderBottom: '1px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BET</th>
                  {allMoments.map((col, i) => {
                    const mDate = new Date(col.moment.date);
                    const now = new Date();
                    const needsClose = !col.moment.closed && mDate <= now;
                    return (
                      <th key={i} className="px-2 py-3" style={{ minWidth: '100px', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #f1f5f9' }}>
                        <div className="fw-bold text-dark" style={{ fontSize: '11px' }}>
                          {col.cadence.name === col.moment.name ? col.moment.name : `${col.cadence.name} · ${col.moment.name}`}
                        </div>
                        <div className="text-muted mb-2" style={{ fontSize: '10px', fontWeight: '500' }}>
                          {mDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        </div>
                        {needsClose ? (
                          <span className="d-inline-block" style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '12px', background: '#fff7ed', color: '#ea580c', fontWeight: 'bold' }}>NEEDS CLOSE</span>
                        ) : col.moment.closed ? (
                          <button className="btn btn-sm d-inline-block px-3 py-0" style={{ fontSize: '10px', borderRadius: '4px', background: '#ffffff', color: '#0ea5e9', border: '1px solid #bae6fd', fontWeight: '600' }} onClick={() => navigate(`/business/${businessId}/cadence/${col.cadence._id}/moment/${col.moment._id}`)}>View</button>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="text-center bg-white" style={{ fontSize: '13px' }}>
                {projects.filter(bet =>
                  // Show any bet that is assigned to at least one cadence that has a moment
                  allMoments.some(col =>
                    getBetsForCadence(col.cadence.name).some(b => b._id === bet._id)
                  )
                ).map((bet, betIndex) => {
                  return (
                    <tr key={bet._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="text-start px-3 py-3 fw-medium" style={{ color: '#475569', fontSize: '12px' }}>
                        <span style={{ color: '#94a3b8' }}>#{betIndex + 1}</span> {bet.project_name || bet.initiative_name || bet.name || "Unnamed Bet"}
                      </td>
                      {allMoments.map((col, i) => {
                        // Is this bet associated with this cadence?
                        const betsForCadence = getBetsForCadence(col.cadence.name);
                        const isAssociated = betsForCadence.some(b => b._id === bet._id);
                        
                        if (!isAssociated) {
                          return <td key={i} className="text-muted" style={{ borderLeft: '1px solid #f1f5f9' }}>—</td>;
                        }
                        
                        if (!col.moment.closed) {
                          return <td key={i} className="text-muted px-2 py-3" style={{ borderLeft: '1px solid #f1f5f9' }}><span style={{ fontStyle: 'italic', fontSize: '12px' }}>TBD</span></td>;
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
                            <td key={i} className="px-2 py-3" style={{ borderLeft: '1px solid #f1f5f9' }}>
                              {evolutionTab === 'Status' ? (() => {
                                const s = updateRecord.status?.toUpperCase() || 'ACTIVE';
                                const badgeStyle = getStatusBadgeStyle(s);
                                return (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.4px', borderRadius: '4px', padding: '2px 6px', ...badgeStyle }}>
                                    {s}
                                  </span>
                                );
                              })() : (() => {
                                const l = updateRecord.learning_state?.toUpperCase() || '';
                                const badgeStyle = getLearningBadgeStyle(l);
                                return (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.4px', borderRadius: '4px', padding: '2px 6px', ...badgeStyle }}>
                                    {l || '—'}
                                  </span>
                                );
                              })()}
                              {arrow}
                            </td>
                          );
                        }

                        return (
                          <td key={i} className="px-2 py-3 text-muted" style={{ borderLeft: '1px solid #f1f5f9' }}>TBD</td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            
          <div className="d-flex align-items-center gap-4 mt-3 ms-2" style={{ fontSize: '13px', color: '#64748b' }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '12px' }}>
                <span className="text-success">▲</span> / <span className="text-danger">▼</span>
              </span>
              <span>Moved at this review</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ border: '1px dashed #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontStyle: 'italic', fontSize: '11px', color: '#64748b', backgroundColor: '#ffffff' }}>TBD</span>
              <span>Upcoming — not captured yet</span>
            </div>
          </div>
          </>
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
