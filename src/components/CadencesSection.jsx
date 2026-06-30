import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MoreVertical, LineChart, Clock } from 'lucide-react';
import { Dropdown, Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store';
import CadenceModal from './CadenceModal';
import ScheduleDatesModal from './ScheduleDatesModal';
import '../styles/CadencesSection.css';
import '../styles/ProjectsTable.css';
import '../styles/EvolutionTable.css';

const getStatusSeverity = (status) => {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (['COMPLETED', 'SCALED'].includes(s)) return 3;
  if (s === 'ACTIVE') return 2;
  if (['AT RISK', 'PAUSED', 'KILLED', 'STALLED'].includes(s)) return 1;
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

const getStatusBadgeClass = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE') return 'evolution-badge-status-active';
  if (s === 'AT RISK') return 'evolution-badge-status-at-risk';
  if (s === 'PAUSED') return 'evolution-badge-status-paused';
  if (s === 'KILLED') return 'evolution-badge-status-killed';
  if (s === 'STALLED') return 'evolution-badge-status-stalled';
  if (s === 'COMPLETED') return 'evolution-badge-status-completed';
  if (s === 'SCALED') return 'evolution-badge-status-scaled';
  if (s === 'DRAFT') return 'evolution-badge-status-draft';
  return 'evolution-badge-default';
};

const getLearningBadgeClass = (learning) => {
  const l = (learning || '').toUpperCase();
  if (l === 'VALIDATED') return 'evolution-badge-learning-validated';
  if (l === 'TESTING') return 'evolution-badge-learning-testing';
  if (l === 'INVALIDATED') return 'evolution-badge-learning-invalidated';
  if (l === 'NOT STARTED') return 'evolution-badge-learning-not-started';
  return 'evolution-badge-default';
};

const CadencesSection = ({ businessId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userRole = useAuthStore(state => state.userRole);
  const myUserId = useAuthStore(state => state.userId);
  const userName = useAuthStore(state => state.userName);
  const isAdmin = ['super_admin', 'company_admin', 'admin'].includes(userRole);
  const [evolutionTab, setEvolutionTab] = useState('Status');
  const [cadences, setCadences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [completedUpdates, setCompletedUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cadenceToDelete, setCadenceToDelete] = useState(null);

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

  const handleDeleteCadenceClick = (cadenceId) => {
    setCadenceToDelete(cadenceId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCadence = async () => {
    if (!cadenceToDelete) return;
    try {
      const token = useAuthStore.getState().token;
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences/${cadenceToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      setShowDeleteModal(false);
      setCadenceToDelete(null);
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
      const isAssociated = names.includes(cadenceName);
      if (!isAssociated) return false;

      if (userRole === 'collaborator') {
        const isOwner = String(p.accountable_owner_id) === String(myUserId) ||
                        (p.accountable_owner && userName && String(p.accountable_owner).trim().toLowerCase() === String(userName).trim().toLowerCase());
        return isOwner;
      }
      return true;
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
      if (userRole === 'collaborator' && bets.length === 0) return;

      const unclosedMoments = c.scheduleDates.filter(m => !m.closed).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (unclosedMoments.length === 0) return;

      const moment = unclosedMoments[0];
      const mDate = new Date(moment.date);
      mDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (mDate <= today) {
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

    return staleList.sort((a, b) => new Date(a.moment.date) - new Date(b.moment.date));
  };

  const staleMoments = getStaleMoments();
  console.log("Debug: staleMoments", staleMoments);

  // Find upcoming moments (dates in the future with bets on agenda)
  const getUpcomingMoments = () => {
    const upcomingList = [];
    const now = new Date();

    cadences.forEach(c => {
      if (!c.scheduleDates) return;
      const bets = getBetsForCadence(c.name);
      if (userRole === 'collaborator' && bets.length === 0) return;

      const unclosedMoments = c.scheduleDates.filter(m => !m.closed).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (unclosedMoments.length === 0) return;

      const moment = unclosedMoments[0];
      const mDate = new Date(moment.date);
      mDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((mDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0 && daysUntil <= 7) {
        // Count bets with no learning state
        const noLearningState = bets.filter(b => !b.learning_state || b.learning_state === '' || b.learning_state === 'Not Started').length;
        upcomingList.push({
          cadence: c,
          moment,
          betsCount: bets.length,
          noLearningStateCount: noLearningState,
          daysUntil
        });
      }
    });

    return upcomingList.sort((a, b) => new Date(a.moment.date) - new Date(b.moment.date));
  };

  const upcomingMoments = getUpcomingMoments();
  console.log("Debug: upcomingMoments", upcomingMoments);

  // For the Evolution table
  const allMoments = [];
  evolutionCadences.forEach(c => {
    if (userRole === 'collaborator' && getBetsForCadence(c.name).length === 0) {
      return;
    }
    if (c.scheduleDates) {
      c.scheduleDates.forEach(m => {
        allMoments.push({ cadence: c, moment: m });
      });
    }
  });
  allMoments.sort((a, b) => new Date(a.moment.date) - new Date(b.moment.date));

  const displayedCadences = userRole === 'collaborator' 
    ? cadences.filter(c => getBetsForCadence(c.name).length > 0)
    : cadences;

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
        {userRole !== 'collaborator' && (
          <button 
            className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 py-1 bg-white"
            onClick={openCreateModal}
            style={{ borderColor: '#cbd5e1', color: '#0c71b9', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}
          >
            <Plus size={16} /> New cadence
          </button>
        )}
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
            ) : displayedCadences.length > 0 ? (
              displayedCadences.map((cadence, index) => {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const nextMoment = cadence.scheduleDates && cadence.scheduleDates.length > 0 
                  ? cadence.scheduleDates.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).find(d => {
                      const dDate = new Date(d.date);
                      dDate.setHours(0, 0, 0, 0);
                      return dDate >= now;
                    }) 
                  : null;
                
                const betsCount = getBetsForCadence(cadence.name).length;
                const staleMomentObj = staleMoments.find(sm => sm.cadence._id === cadence._id);
                const isStale = !!staleMomentObj;
                let diffDays = -1;
                if (nextMoment) {
                  const targetDate = new Date(nextMoment.date);
                  targetDate.setHours(0, 0, 0, 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
                }

                const isNeedsClose = isStale || (nextMoment != null && diffDays <= 0);
                const isUpcoming = !isNeedsClose && nextMoment != null && diffDays <= 7;
                const isScheduled = !isNeedsClose && nextMoment != null && diffDays > 7;
                
                const displayMoment = isStale ? staleMomentObj.moment : nextMoment;
                  
                return (
                <tr key={cadence._id || index} style={{ borderLeft: isNeedsClose ? '4px solid #ef4444' : ((isUpcoming || isScheduled) ? '4px solid #0c71b9' : '4px solid transparent') }}>
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
                      {displayMoment ? (
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>{new Date(displayMoment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{displayMoment.name}</div>
                        </div>
                      ) : (
                        <div className="text-muted fst-italic">No dates scheduled</div>
                      )}
                  </td>
                  <td>
                    {isNeedsClose ? (
                      <span className="cadence-status-pill needs-close">NEEDS CLOSE</span>
                    ) : isUpcoming ? (
                      <span className="cadence-status-pill upcoming">UPCOMING</span>
                    ) : isScheduled ? (
                      <span className="cadence-status-pill scheduled" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.5px' }}>SCHEDULED</span>
                    ) : (
                      <span className="cadence-status-pill not-scheduled">NOT SCHEDULED</span>
                    )}
                  </td>
                  <td>
                    <div className="cadence-actions">
                      {(() => {
                        let btnText = 'Schedule dates';
                        let btnVariant = 'primary';
                        let btnBg = '#0c71b9';
                        let btnColor = '#ffffff';
                        let bColor = 'transparent';

                        if (isNeedsClose) {
                          btnText = 'Close & capture';
                        } else if (isUpcoming) {
                          btnText = 'Open';
                        } else if (isScheduled) {
                          btnText = 'Open';
                          btnVariant = 'outline-primary';
                          btnBg = '#ffffff';
                          btnColor = '#0c71b9';
                          bColor = '#0c71b9';
                        }

                        return (
                          <Button
                            variant={btnVariant}
                            size="sm"
                            className="me-2 fw-medium px-3"
                            style={{
                              backgroundColor: btnBg,
                              color: btnColor,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: bColor,
                              borderRadius: '6px',
                              fontSize: '13px',
                            }}
                            onClick={() => {
                              const thisCadenceStale = staleMoments.find(sm => sm.cadence._id === cadence._id);
                              if (thisCadenceStale) {
                                navigate(`/business/${businessId}/cadence/${cadence._id}/moment/${thisCadenceStale.moment._id}`);
                              } else if (nextMoment && diffDays <= 0) {
                                navigate(`/business/${businessId}/cadence/${cadence._id}/moment/${nextMoment._id}`);
                              } else if (nextMoment) {
                                navigate(`/business/${businessId}/cadence/${cadence._id}/moment/${nextMoment._id}/open`);
                              } else {
                                openScheduleModal(cadence);
                              }
                            }}
                          >
                            {btnText}
                          </Button>
                        );
                      })()}
                      
                      {isAdmin && (
                        <Dropdown align="end" className="d-inline cadence-dropdown">
                          <Dropdown.Toggle variant="link" className="btn-icon-kebab bg-transparent border-0 m-0 p-0 d-flex align-items-center justify-content-center text-decoration-none shadow-none">
                            <MoreVertical size={16} color="#64748b" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0 py-2" style={{ borderRadius: '8px', minWidth: '150px', border: '1px solid #e2e8f0' }}>
                            {cadence.scheduleDates && cadence.scheduleDates.length > 0 && (
                              <Dropdown.Item onClick={() => openScheduleModal(cadence)} className="py-2 px-3 text-dark fw-medium cadence-dropdown-item">
                                Manage dates
                              </Dropdown.Item>
                            )}
                            <Dropdown.Item onClick={() => openEditModal(cadence)} className="py-2 px-3 text-dark fw-medium cadence-dropdown-item">
                              Edit cadence
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleDeleteCadenceClick(cadence._id)} className="py-2 px-3 text-danger fw-medium cadence-dropdown-item">
                              Delete cadence
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </div>
                  </td>
                </tr>
              )})
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  {userRole === 'collaborator' ? 'No cadences found.' : 'No cadences found. Click "New cadence" to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="evolution-section mt-5">
        <div className="evolution-header mb-2 d-flex justify-content-between align-items-center">
          <div>
            <div className="cadences-subtitle evolution-subtitle">EVOLUTION</div>
            <h2 className="cadences-title m-0 evolution-title">How every bet has moved, review by review</h2>
          </div>
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm evolution-select" 
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
            >
              <option value="all">All time</option>
              <option value="last_3_months">Last 3 months</option>
              <option value="last_6_months">Last 6 months</option>
              <option value="last_12_months">Last 12 months</option>
            </select>
            <select 
              className="form-select form-select-sm evolution-select" 
              value={selectedEvolutionCadence}
              onChange={(e) => setSelectedEvolutionCadence(e.target.value)}
            >
              <option value="all">All cadences</option>
              {displayedCadences.map(c => (
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
            <div className="table-responsive mt-2 evolution-table-container">
            <table className="table align-middle mb-0 evolution-table">
              <thead className="bg-white text-center evolution-table-head">
                <tr>
                  <th className="text-start align-bottom px-3 py-3 evolution-bet-col">BET</th>
                  {allMoments.map((col, i) => {
                    const mDate = new Date(col.moment.date);
                    mDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const needsClose = !col.moment.closed && mDate <= today;
                    return (
                      <th key={i} className="px-2 py-3 evolution-moment-col">
                        <div className="fw-bold text-dark evolution-moment-title">
                          {col.cadence.name === col.moment.name ? col.moment.name : `${col.cadence.name} · ${col.moment.name}`}
                        </div>
                        <div className="text-muted mb-2 evolution-moment-date">
                          {mDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        </div>
                        {needsClose ? (
                          <span className="d-inline-block evolution-needs-close">NEEDS CLOSE</span>
                        ) : col.moment.closed ? (
                          <button 
                            className="ev-col-view"  onClick={() => navigate(`/business/${businessId}/cadence/${col.cadence._id}/moment/${col.moment._id}/closed`)}
                          >
                            View
                          </button>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="text-center bg-white evolution-table-body">
                {projects.filter(bet =>
                  // Show any bet that is assigned to at least one cadence that has a moment
                  allMoments.some(col =>
                    getBetsForCadence(col.cadence.name).some(b => b._id === bet._id)
                  )
                ).map((bet, betIndex) => {
                  return (
                    <tr key={bet._id} className="evolution-bet-row">
                      <td className="text-start px-3 py-1 fw-medium evolution-bet-name">
                        <span className="evolution-bet-index">#{betIndex + 1}</span> {bet.project_name || bet.initiative_name || bet.name || "Unnamed Bet"}
                      </td>
                      {allMoments.map((col, i) => {
                        // Is this bet associated with this cadence?
                        const betsForCadence = getBetsForCadence(col.cadence.name);
                        const isAssociated = betsForCadence.some(b => b._id === bet._id);
                        
                        if (!isAssociated) {
                          return <td key={i} className="text-muted evolution-cell-empty">—</td>;
                        }
                        
                        if (!col.moment.closed) {
                          return <td key={i} className="text-muted px-2 py-3 evolution-cell-empty"><span className="evolution-tbd">TBD</span></td>;
                        }

                        // Check if completed update exists
                        const updateRecord = completedUpdates.find(cu => cu.bet_id === bet._id && cu.moment_id === col.moment._id);
                        
                        if (updateRecord) {
                          let arrow = null;
                          let prevRecord = null;
                          if (i > 0) {
                            for (let j = i - 1; j >= 0; j--) {
                              prevRecord = completedUpdates.find(cu => cu.bet_id === bet._id && cu.moment_id === allMoments[j].moment._id);
                              if (prevRecord) break;
                            }
                          }
                          
                          if (!prevRecord) {
                            prevRecord = { status: 'ACTIVE', learning_state: 'TESTING' };
                          }

                          if (prevRecord) {
                            if (evolutionTab === 'Status') {
                              const currSev = getStatusSeverity(updateRecord.status);
                              const prevSev = getStatusSeverity(prevRecord.status);
                              if (currSev > prevSev) arrow = <span className="ms-1 text-success evolution-arrow-up">▲</span>;
                              if (currSev < prevSev) arrow = <span className="ms-1 text-danger evolution-arrow-down">▼</span>;
                            } else {
                              const currSev = getLearningSeverity(updateRecord.learning_state);
                              const prevSev = getLearningSeverity(prevRecord.learning_state);
                              if (currSev > prevSev) arrow = <span className="ms-1 text-success evolution-arrow-up">▲</span>;
                              if (currSev < prevSev) arrow = <span className="ms-1 text-danger evolution-arrow-down">▼</span>;
                            }
                          }

                          return (
                            <td key={i} className="px-2 py-3 evolution-cell">
                              {evolutionTab === 'Status' ? (() => {
                                const s = updateRecord.status?.toUpperCase() || 'ACTIVE';
                                const badgeClass = getStatusBadgeClass(s);
                                return (
                                  <span className={`evolution-badge ${badgeClass}`}>
                                    {s}
                                  </span>
                                );
                              })() : (() => {
                                const l = updateRecord.learning_state?.toUpperCase() || '';
                                const badgeClass = getLearningBadgeClass(l);
                                return (
                                  <span className={`evolution-badge ${badgeClass}`}>
                                    {l || '—'}
                                  </span>
                                );
                              })()}
                              {arrow}
                            </td>
                          );
                        }

                        return (
                          <td key={i} className="px-2 py-3 text-muted evolution-cell-empty">TBD</td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            
          <div className="d-flex align-items-center gap-4 mt-3 ms-2 evolution-legend">
            <div className="d-flex align-items-center gap-2">
              <span className="evolution-legend-arrows">
                <span className="text-success">▲</span> / <span className="text-danger">▼</span>
              </span>
              <span>Moved at this review</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="evolution-legend-tbd">TBD</span>
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

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5 fw-bold text-dark">Delete Cadence</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3 text-secondary">
          Are you sure you want to delete this cadence? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} className="fw-medium px-4" style={{ backgroundColor: '#f1f5f9', border: 'none', color: '#475569' }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteCadence} className="fw-medium px-4">
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default CadencesSection;
