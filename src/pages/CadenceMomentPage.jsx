import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, ChevronDown, Flag, AlertTriangle, User, Check, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import { useAuthStore, useBusinessStore } from '../store';
import '../styles/execution.css';

const STATUS_OPTIONS = ['ACTIVE', 'AT RISK', 'PAUSED', 'KILLED', 'COMPLETED', 'STALLED'];
const LEARNING_OPTIONS = ['Not started', 'testing', 'validated', 'invalidated'];

const getStatusStyles = (opt, isSelected) => {
  if (!isSelected) {
    return { color: '#64748b', backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontWeight: '400' };
  }
  switch(opt) {
    case 'ACTIVE': return { color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#10b981', fontWeight: '600' };
    case 'AT RISK': return { color: '#e11d48', backgroundColor: '#fff1f2', borderColor: '#e11d48', fontWeight: '600' };
    case 'PAUSED': return { color: '#b45309', backgroundColor: '#fffbeb', borderColor: '#f59e0b', fontWeight: '600' };
    case 'KILLED': return { color: '#334155', backgroundColor: '#f8fafc', borderColor: '#64748b', fontWeight: '600' };
    case 'COMPLETED': return { color: '#1d4ed8', backgroundColor: '#eff6ff', borderColor: '#3b82f6', fontWeight: '600' };
    case 'STALLED': 
    case 'SCALED': return { color: '#6d28d9', backgroundColor: '#f5f3ff', borderColor: '#8b5cf6', fontWeight: '600' };
    default: return { color: '#0f172a', backgroundColor: '#f1f5f9', borderColor: '#94a3b8', fontWeight: '600' };
  }
};

const BetReviewCard = ({ bet, isCompleted, updateInfo, onSave, index, legacyCommitments, momentId, onStatusChange }) => {
  const initialStatus = updateInfo?.status || bet.status || "ACTIVE";
  const [status, setStatus] = useState(initialStatus);
  const [statusReason, setStatusReason] = useState(updateInfo?.status_reason || "");
  const [learningState, setLearningState] = useState(updateInfo?.learning_state?.toLowerCase() || bet.learning_state?.toLowerCase() || "testing");
  const [learningReason, setLearningReason] = useState(updateInfo?.learning_reason || "");
  
  const [commitments, setCommitments] = useState(() => {
    if (bet.commitments && bet.commitments.length > 0) return bet.commitments;
    return (legacyCommitments || []).map(c => ({
      ...c,
      moment_id: 'legacy'
    }));
  });
  const [isAddingCommitment, setIsAddingCommitment] = useState(false);
  const [newCommitmentText, setNewCommitmentText] = useState("");

  const [hasStatusUpdated, setHasStatusUpdated] = useState(false);
  const [hasLearningUpdated, setHasLearningUpdated] = useState(false);
  const isConfirmedLocal = isCompleted || (hasStatusUpdated && hasLearningUpdated);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(bet._id, isConfirmedLocal);
    }
  }, [isConfirmedLocal]);

  // Auto-save debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasStatusUpdated || hasLearningUpdated) {
        handleSave();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [status, statusReason, learningState, learningReason, commitments]);

  const toggleCommitment = (id) => {
    setCommitments(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
    setHasStatusUpdated(true); // Treat commitment changes as interaction
  };

  const addNewCommitment = (text) => {
    if (!text.trim()) return;
    setCommitments(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text,
      owner: bet.accountable_owner || 'Unassigned',
      date: new Date().toISOString(),
      checked: false,
      moment_id: momentId
    }]);
    setHasStatusUpdated(true);
  };

  const removeCommitment = (id) => {
    setCommitments(prev => prev.filter(c => c.id !== id));
    setHasStatusUpdated(true);
  };

  const handleSave = async () => {
    await onSave(bet._id, {
      action: "Capture",
      status,
      learning_state: learningState,
      status_reason: statusReason,
      learning_reason: learningReason,
      commitments: commitments
    });
  };

  const whatChanged = bet.description ? [bet.description] : [];
  
  const prevCommitments = commitments.filter(c => c.moment_id !== momentId);
  const curCommitments = commitments.filter(c => c.moment_id === momentId);

  return (
    <div className="card shadow-sm border-1 mb-4" style={{ borderColor: '#e2e8f0', borderRadius: '8px' }}>
      <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <span className="fw-bold me-2" style={{ fontSize: '12px', color: '#0f172a' }}>{index < 9 ? `0${index + 1}` : index + 1}</span> 
          <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{bet.project_name || bet.initiative_name || bet.name || "Unnamed Bet"}</span>
        </div>
        <div className="d-flex align-items-center gap-3 text-dark fw-medium" style={{ fontSize: '13px' }}>
          <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '12px' }}>{(bet.accountable_owner || "Unassigned").toLowerCase()}</span>
          {isConfirmedLocal ? (
            <div className="d-flex align-items-center justify-content-center" style={{ 
              fontSize: '10px', 
              fontWeight: '700', 
              color: '#059669', 
              border: '1px solid #10b981', 
              backgroundColor: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: '4px',
              gap: '6px',
              letterSpacing: '0.5px'
            }}>
              <Check size={12} strokeWidth={3} /> CONFIRMED
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ 
              fontSize: '10px', 
              fontWeight: '700', 
              color: '#d97706', 
              border: '1px solid #f59e0b', 
              backgroundColor: '#ffffff',
              padding: '4px 10px',
              borderRadius: '4px',
              gap: '6px',
              letterSpacing: '0.5px'
            }}>
              <span style={{ fontSize: '12px', lineHeight: 1 }}>○</span> TO CONFIRM
            </div>
          )}
        </div>
      </div>
      <div className="card-body px-4 pb-4">
        {bet.status === "AT RISK" || bet.status === "STALLED" ? (
          <div className="d-flex align-items-center mb-4 gap-2">
            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning px-2 py-1" style={{ fontSize: '10px' }}>FLAGGED: {bet.status}</span>
          </div>
        ) : null}

        <div className="row mb-4">
          <div className="col-md-6">
            <h6 className="text-muted" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>WHAT CHANGED</h6>
            <ul className="text-dark mb-0 ps-3" style={{ fontSize: '13px', lineHeight: '1.6' }}>
              {whatChanged.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            <div className="mt-3">
              <h6 className="text-muted" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>DEPENDS ON PREVIOUS COMMITMENTS</h6>
              <ul className="list-unstyled mb-0" style={{ fontSize: '13px' }}>
                {prevCommitments.map((c) => (
                  <li key={c.id} className="d-flex align-items-center gap-2 mb-1 text-muted">
                    <CheckCircle2 size={14} className={c.checked ? "text-primary" : "text-muted"} />
                    {c.text}
                    <span className="ms-auto" style={{ fontSize: '11px' }}>Make reminder</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <h6 className="text-muted" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>WHAT IS ALIGNING</h6>
            <p className="text-muted" style={{ fontSize: '13px' }}>No notes on this front.</p>
          </div>
        </div>

        {/* Tests / Bets */}
        {bet.hypothesis ? (
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={{ width: '8px', height: '8px', backgroundColor: '#0ea5e9', borderRadius: '2px' }}></div>
              <h6 className="text-muted mb-0" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>HYPOTHESIS</h6>
            </div>
            <div className="border rounded p-3 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <p className="text-muted mb-0" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                {bet.hypothesis}
              </p>
            </div>
          </div>
        ) : null}

        {/* DECISIONS */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <div style={{ width: '8px', height: '8px', backgroundColor: '#0c71b9', borderRadius: '2px' }}></div>
            <h6 className="text-muted mb-0" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>DECISIONS <span className="fw-normal text-muted">- Captured by: PR</span></h6>
          </div>
          
          <div className="border rounded p-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
            {/* Status */}
            <div className="mb-4">
              <h6 className="text-muted mb-3" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>CONFIRM BET STATUS</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {STATUS_OPTIONS.map(opt => (
                  <button 
                    key={opt}
                    className="btn btn-sm rounded-pill px-3"
                    style={{ 
                      fontSize: '12px', 
                      textTransform: 'capitalize',
                      border: '1px solid',
                      ...getStatusStyles(opt, status === opt)
                    }}
                    onClick={() => { setStatus(opt); setHasStatusUpdated(true); }}
                  >
                    {opt.toLowerCase()}
                  </button>
                ))}
              </div>
              {status !== initialStatus && (
                <div className="d-inline-flex align-items-center mb-3" style={{ 
                  fontSize: '11px', 
                  color: '#d97706', // orange-600
                  border: '1px solid #f59e0b', // orange-500
                  backgroundColor: '#fffbeb', // orange-50
                  borderRadius: '50rem',
                  padding: '4px 12px',
                  fontWeight: '500',
                  gap: '6px'
                }}>
                  <AlertTriangle size={12}/> 
                  <span>
                    Committee moved from <span className="fw-bold">{initialStatus.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span> to <span className="fw-bold">{status.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </span>
                </div>
              )}
              <div className="position-relative mt-2">
                <label className="text-muted bg-white px-1 position-absolute" style={{ top: '-8px', left: '10px', fontSize: '10px', fontWeight: '600' }}>WHY THIS CALL?*</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={statusReason}
                  onChange={(e) => { setStatusReason(e.target.value); setHasStatusUpdated(true); }}
                  placeholder="Why this status call? The reasoning the committee will want to remember."
                  style={{ fontSize: '13px', resize: 'none' }}
                />
              </div>
            </div>

            {/* Learning */}
            <div className="mb-4 pt-3 border-top">
              <h6 className="text-muted mb-3" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>CONFIRM BET LEARNING</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {LEARNING_OPTIONS.map(opt => (
                  <button 
                    key={opt}
                    className={`btn btn-sm rounded-pill px-3 ${learningState === opt.toLowerCase() ? 'btn-info text-white fw-bold' : 'btn-outline-secondary'}`}
                    style={{ fontSize: '12px', textTransform: 'capitalize' }}
                    onClick={() => { setLearningState(opt.toLowerCase()); setHasLearningUpdated(true); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="position-relative mt-2">
                <label className="text-muted bg-white px-1 position-absolute" style={{ top: '-8px', left: '10px', fontSize: '10px', fontWeight: '600' }}>WHY THIS CALL?*</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={learningReason}
                  onChange={(e) => { setLearningReason(e.target.value); setHasLearningUpdated(true); }}
                  placeholder="Why this learning call? What did this reveal, securely proof or disprove?"
                  style={{ fontSize: '13px', resize: 'none' }}
                />
              </div>
            </div>

            {/* Previous Commitments */}
            {prevCommitments.length > 0 && (
              <div className="mb-4 pt-3 border-top">
                <h6 className="text-muted mb-3" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  PREVIOUS COMMITMENTS <span className="fw-normal text-muted" style={{ textTransform: 'none' }}>- Confirm what got done</span>
                </h6>
                {prevCommitments.map((c) => (
                  <div key={c.id} className="d-flex align-items-center mb-2">
                    <div 
                      className={`d-flex justify-content-center align-items-center me-3 ${c.checked ? 'bg-success border-success' : 'bg-white border-secondary'}`}
                      style={{ width: '18px', height: '18px', border: '1px solid', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => toggleCommitment(c.id)}
                    >
                      {c.checked && <Check size={12} color="white" />}
                    </div>
                    <span className={c.checked ? "text-dark" : "text-muted"} style={{ fontSize: '13px', flex: 1 }}>{c.text}</span>
                    <div className="d-flex align-items-center gap-3">
                      <span className="text-muted" style={{ fontSize: '12px' }}>{c.owner}</span>
                      <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: '11px' }}>
                        {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Commitments */}
            <div className="pt-3 border-top">
              <h6 className="text-muted mb-3" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                NEW COMMITMENTS <span className="fw-normal text-muted" style={{ textTransform: 'none' }}>- Decisions with an owner</span>
              </h6>
              {curCommitments.map(c => (
                <div key={c.id} className="d-flex align-items-center mb-2 group">
                  <span className="text-dark" style={{ fontSize: '13px', flex: 1 }}>{c.text}</span>
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted" style={{ fontSize: '12px' }}>{c.owner}</span>
                    <button className="btn btn-link text-danger p-0 border-0 bg-transparent" onClick={() => removeCommitment(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              {isAddingCommitment ? (
                <div className="position-relative mb-3 mt-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter commitment..."
                    value={newCommitmentText}
                    onChange={(e) => setNewCommitmentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addNewCommitment(newCommitmentText);
                        setNewCommitmentText('');
                        setIsAddingCommitment(false);
                      }
                    }}
                    autoFocus
                    style={{ fontSize: '13px' }}
                  />
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-sm btn-primary" onClick={() => {
                      addNewCommitment(newCommitmentText);
                      setNewCommitmentText('');
                      setIsAddingCommitment(false);
                    }}>Save</button>
                    <button className="btn btn-sm btn-light" onClick={() => setIsAddingCommitment(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 mt-2 bg-white text-muted" 
                  style={{ fontSize: '12px', borderStyle: 'dashed', borderRadius: '8px' }}
                  onClick={() => setIsAddingCommitment(true)}
                >
                  <Plus size={14} /> Add a commitment
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const CadenceMomentPage = () => {
  const navigate = useNavigate();
  const { businessId, cadenceId, momentId } = useParams();
  const { selectedBusiness } = useBusinessStore();
  const businessName = selectedBusiness?.business_name || "Business";
  
  const [cadence, setCadence] = useState(null);
  const [moment, setMoment] = useState(null);
  const [bets, setBets] = useState([]);
  const [completedUpdates, setCompletedUpdates] = useState([]);
  const [allCompletedUpdates, setAllCompletedUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmedBetsMap, setConfirmedBetsMap] = useState({});

  const handleBetStatusChange = (betId, isConf) => {
    setConfirmedBetsMap(prev => ({ ...prev, [betId]: isConf }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = useAuthStore.getState().token;
        const headers = { Authorization: `Bearer ${token}` };
        const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

        const cadenceRes = await axios.get(`${baseUrl}/api/cadences/${cadenceId}`, { headers });
        const fetchedCadence = cadenceRes.data;
        setCadence(fetchedCadence);
        
        const matchedMoment = fetchedCadence.scheduleDates?.find(d => d._id === momentId);
        setMoment(matchedMoment);

        const projectsRes = await axios.get(`${baseUrl}/api/projects?business_id=${businessId}`, { headers });
        const allProjects = projectsRes.data.projects || [];
        
        const cadenceBets = allProjects.filter(p => {
          const cStr = p.review_cadence || p.cadence || "";
          const names = cStr.split(",").map(s => s.trim()).filter(Boolean);
          return names.includes(fetchedCadence.name);
        });
        
        // Sort bets by creation date or ID to ensure stable ordering
        const sortedBets = cadenceBets.sort((a, b) => (a.created_at || a._id).localeCompare(b.created_at || b._id));
        setBets(sortedBets);

        const completedRes = await axios.get(`${baseUrl}/api/completed-bet-cadences?business_id=${businessId}&cadence_id=${cadenceId}`, { headers });
        setAllCompletedUpdates(completedRes.data);
        const momentCompleted = completedRes.data.filter(c => c.moment_id === momentId);
        setCompletedUpdates(momentCompleted);

      } catch (err) {
        console.error("Error fetching cadence moment data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (businessId && cadenceId) {
      fetchData();
    }
  }, [businessId, cadenceId, momentId]);

  const handleCaptureUpdate = async (betId, updateData) => {
    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

      // Update Project
      await axios.patch(`${baseUrl}/api/projects/${betId}`, {
        status: updateData.status,
        learning_state: updateData.learning_state,
        commitments: updateData.commitments
      }, { headers });

      // Record Update
      const recordData = {
        bet_id: betId,
        cadence_id: cadenceId,
        moment_id: momentId,
        business_id: businessId,
        action: updateData.action,
        status: updateData.status,
        learning_state: updateData.learning_state,
        status_reason: updateData.status_reason,
        learning_reason: updateData.learning_reason,
        new_commitments: JSON.stringify(updateData.commitments.filter(c => c.moment_id === momentId).map(c => c.text))
      };
      
      const newRecordRes = await axios.post(`${baseUrl}/api/completed-bet-cadences`, recordData, { headers });
      
      setCompletedUpdates(prev => {
        const filtered = prev.filter(p => p.bet_id !== betId);
        return [...filtered, newRecordRes.data];
      });
      setBets(prev => prev.map(b => b._id === betId ? { ...b, status: updateData.status, learning_state: updateData.learning_state } : b));
    } catch (err) {
      console.error("Error saving cadence update:", err);
    }
  };

  const getCompletedData = (betId) => completedUpdates.find(cu => cu.bet_id.toString() === betId.toString());
  
  const handleSignAndClose = async () => {
    // Check if all bets are confirmed
    const allConfirmed = bets.length > 0 && bets.every(b => confirmedBetsMap[b._id]);
    
    if (allConfirmed) {
      try {
        const token = useAuthStore.getState().token;
        const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        // Optionally update moment status via cadence API if supported
        // Redirect to cadences
        navigate('/businesspage?tab=cadences');
      } catch (err) {
        console.error("Failed to close moment", err);
      }
    } else {
      alert("Please confirm all bets before signing and closing this moment.");
    }
  };

  return (
    <div className="execution-page-container min-vh-100 pb-5">
      <div className="adv-sticky-header">
        <MenuBar />
      </div>

      <div className="container py-4" style={{ maxWidth: '1000px' }}>
        <Link to={`/businesspage?tab=cadences`} className="text-muted text-decoration-none mb-4 d-inline-block" style={{ fontSize: '13px' }}>
          <ArrowLeft size={14} className="me-1" /> Back to Cadences
        </Link>

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
          <div>
            <h1 className="h4 fw-bold mb-2 text-dark">{moment ? moment.name : 'Loading...'}</h1>
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-warning bg-opacity-10 text-warning fw-bold border border-warning" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>NEEDS CLOSE</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>{moment?.date ? new Date(moment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''}</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>20 days ago</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>{bets.length} bets</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>{completedUpdates.length}/{bets.length} confirmed</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            {/* Avatars */}
            <div className="d-flex me-2">
               {Array.from(new Set(bets.map(b => b.accountable_owner).filter(Boolean))).slice(0, 4).map((owner, idx) => (
                 <div key={idx} className={`bg-primary text-white rounded-circle d-flex align-items-center justify-content-center border border-white`} 
                      style={{ width: '32px', height: '32px', zIndex: 4 - idx, marginLeft: idx > 0 ? '-10px' : '0', fontSize: '10px', fontWeight: 'bold' }}>
                   {owner.substring(0, 2).toUpperCase()}
                 </div>
               ))}
            </div>
            <button className="btn btn-outline-secondary btn-sm fw-medium d-flex align-items-center gap-1">
              Meeting setup <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Close this moment header */}
        <div className="card shadow-sm border-1 mb-4" style={{ borderColor: '#e2e8f0', borderRadius: '8px' }}>
          <div className="card-body p-4 d-flex justify-content-between align-items-center">
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h5 className="fw-bold mb-0" style={{ color: '#0f172a', fontSize: '15px' }}>Close this Moment</h5>
                <button className="btn fw-bold text-white rounded-pill d-flex align-items-center" style={{ backgroundColor: '#0c71b9', fontSize: '12px', padding: '6px 16px' }} onClick={handleSignAndClose}>
                  Sign & close <CheckCircle2 size={14} className="ms-1" />
                </button>
              </div>
              <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Every bet is confirmed — sign to lock the snapshot.</p>
              
              {/* Progress and Pills */}
              <div className="mt-3">
                <div className="progress mb-2" style={{ height: '3px', backgroundColor: '#e2e8f0' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: `${bets.length > 0 ? (Object.values(confirmedBetsMap).filter(Boolean).length / bets.length) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {bets.map((b, idx) => confirmedBetsMap[b._id] ? (
                    <span key={b._id} className="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                      ✓ #{idx + 1}
                    </span>
                  ) : (
                    <span key={b._id} className="badge bg-light text-muted border border-secondary rounded-pill px-2 py-1" style={{ fontSize: '10px', opacity: 0.6 }}>
                      #{idx + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top flags to review */}
        <div className="card shadow-sm border-1 mb-5" style={{ borderColor: '#e2e8f0', borderRadius: '8px' }}>
          <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
            <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '15px' }}>Top flags to review</h5>
          </div>
          <div className="card-body px-4 pb-4">
            <ul className="list-unstyled mb-0">
              {bets.filter(b => b.status === "AT RISK" || b.status === "STALLED").length > 0 ? (
                bets.filter(b => b.status === "AT RISK" || b.status === "STALLED").map(flaggedBet => (
                  <li key={flaggedBet._id} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                    <Flag size={14} className="text-danger mt-1 me-2 flex-shrink-0" fill="currentColor" />
                    <div>
                      <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>{flaggedBet.project_name || flaggedBet.initiative_name || flaggedBet.name}</span>
                      <span className="text-muted mx-2">—</span>
                      <span className="text-muted" style={{ fontSize: '13px' }}>This bet is flagged as {flaggedBet.status}. Please review its progress closely.</span>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-muted fst-italic" style={{ fontSize: '13px' }}>No immediate flags to review for this moment.</div>
              )}
            </ul>
          </div>
        </div>

        {/* REVIEW EACH BET Section */}
        <div className="mb-3">
          <span className="text-muted fw-bold" style={{ fontSize: '11px', letterSpacing: '1px' }}>REVIEW EACH BET</span>
        </div>

        {isLoading ? (
          <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
        ) : bets.length === 0 ? (
          <div className="text-center py-5 text-muted">No bets are associated with this cadence.</div>
        ) : (
          bets.map((bet, idx) => {
            const completed = !!getCompletedData(bet._id);
            const updateInfo = getCompletedData(bet._id);
            
            // Extract previous commitments from allCompletedUpdates for this bet
            const legacyCommitments = allCompletedUpdates
              .filter(cu => cu.bet_id === bet._id && cu.moment_id !== momentId && cu.new_commitments)
              .map(cu => ({ 
                id: cu._id,
                text: cu.new_commitments, 
                date: cu.created_at,
                owner: bet.accountable_owner || 'Unassigned',
                checked: false 
              }));

            return (
              <BetReviewCard 
                key={bet._id} 
                bet={bet}
                index={idx}
                isCompleted={completed} 
                updateInfo={updateInfo} 
                onSave={handleCaptureUpdate}
                legacyCommitments={legacyCommitments}
                momentId={momentId}
                onStatusChange={handleBetStatusChange}
              />
            );
          })
        )}

      </div>
    </div>
  );
};

export default CadenceMomentPage;
