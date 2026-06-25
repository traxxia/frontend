import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Clock, CheckCircle2, ChevronDown, Flag, AlertTriangle, User, Check, Trash2, Plus, CheckSquare } from 'lucide-react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import { useAuthStore, useBusinessStore, useNotificationStore } from '../store';
import '../styles/execution.css';

const STATUS_OPTIONS = ['ACTIVE', 'AT RISK', 'PAUSED', 'KILLED', 'COMPLETED', 'STALLED'];
const LEARNING_OPTIONS = ['Not started', 'testing', 'validated', 'invalidated'];

const getStatusStyles = (opt, isSelected) => {
  if (!isSelected) {
    return { color: '#64748b', backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontWeight: '400' };
  }
  switch(opt?.toUpperCase()) {
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
  const [originalBetStatus] = useState(bet.status?.toUpperCase() || "ACTIVE");
  const initialStatus = updateInfo?.status?.toUpperCase() || "";
  const [status, setStatus] = useState(initialStatus);
  const [statusReason, setStatusReason] = useState(updateInfo?.status_reason || "");
  const [learningState, setLearningState] = useState(updateInfo?.learning_state?.toLowerCase() || "");
  const [learningReason, setLearningReason] = useState(updateInfo?.learning_reason || "");
  
  const [commitments, setCommitments] = useState(() => {
    const base = bet.commitments && bet.commitments.length > 0
      ? bet.commitments
      : (legacyCommitments || []).map(c => ({ ...c, moment_id: 'legacy' }));
    // Always start with one blank new commitment row for the current moment
    const hasCurrentRow = base.some(c => c.moment_id === momentId && !c.text?.trim());
    if (!hasCurrentRow) {
      return [...base, { id: 'new-' + Date.now(), text: '', owner: '', date: '', checked: false, moment_id: momentId }];
    }
    return base;
  });

  const [hasStatusUpdated, setHasStatusUpdated] = useState(false);
  const [hasLearningUpdated, setHasLearningUpdated] = useState(false);
  
  const hasValidStatus = status && status.trim() !== "";
  const hasValidLearning = learningState && learningState.trim() !== "";
  const isConfirmedLocal = isCompleted || (hasValidStatus && hasValidLearning && hasStatusUpdated && hasLearningUpdated);

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

  const addNewCommitment = () => {
    setCommitments(prev => [...prev, {
      id: 'new-' + Date.now() + Math.random().toString(36).substr(2, 5),
      text: '',
      owner: '',
      date: '',
      checked: false,
      moment_id: momentId
    }]);
    setHasStatusUpdated(true);
  };

  const updateCommitmentField = (id, field, value) => {
    setCommitments(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
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
  
  const curCommitments = commitments.filter(c => c.moment_id === momentId);
  const prevCommitments = commitments.filter(c => c.moment_id !== momentId && c.text && c.text.trim() !== '');

  return (
    <div className="card shadow-sm border-1 mb-4" style={{ borderColor: '#e2e8f0', borderRadius: '8px' }}>
      <div className="card-header bg-white border-bottom-0 py-3 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <span className="fw-bold me-2 text-muted" style={{ fontSize: '13px' }}>#{index + 1}</span> 
          <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>{bet.project_name || bet.initiative_name || bet.name || "Unnamed Bet"}</span>
        </div>
        <div className="d-flex align-items-center gap-3 text-dark fw-medium" style={{ fontSize: '13px' }}>
          <span className="text-dark" style={{ fontSize: '12px', fontWeight: '500' }}>You</span>
          {isConfirmedLocal ? (
            <button className="btn btn-sm text-success fw-bold d-flex align-items-center bg-white border-success rounded px-3 py-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              CONFIRMED
            </button>
          ) : (
            <button className="btn btn-sm text-warning fw-bold d-flex align-items-center bg-white rounded px-3 py-1" style={{ fontSize: '11px', letterSpacing: '0.5px', color: '#d97706', border: '1px solid #fcd34d' }}>
              <span className="me-1">○</span> TO CONFIRM
            </button>
          )}
        </div>
      </div>
      
      <div className="card-body px-4 pb-4 pt-0">
        
        {/* WHAT YOU BROUGHT */}
        <div className="mb-4 rounded" style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center mb-3">
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a', marginRight: '8px' }}>WHAT YOU BROUGHT</span>
            <span style={{ fontSize: '12px', color: '#64748b', marginRight: '8px' }}>proposes</span>
            <span className="d-inline-flex align-items-center justify-content-center" style={{ fontSize: '11px', border: '1px solid', borderRadius: '4px', padding: '2px 8px', marginRight: '8px', ...getStatusStyles(bet.status || "ACTIVE", true) }}>
              {(bet.status || "ACTIVE").toUpperCase()}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>- {bet.learning_state || "Not started"}</span>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '4px' }}>WHAT CHANGED</div>
              <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#94a3b8' }}>{whatChanged.length > 0 ? whatChanged[0] : "No update from the decider yet."}</div>
            </div>
            <div className="col-md-6">
              <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '4px' }}>RISKS & BLOCKERS</div>
              <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#94a3b8' }}>None flagged yet.</div>
            </div>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div style={{ width: '6px', height: '6px', backgroundColor: '#0ea5e9', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a' }}>INSIGHTS</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>- what the history says</span>
          </div>
          <div className="d-flex align-items-center" style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
            <CheckCircle2 size={16} className="me-2" fill="#22c55e" color="#ffffff" />
            No flags — thesis holds, risks under control.
          </div>
        </div>

        {/* OUTCOME */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <div style={{ width: '6px', height: '6px', backgroundColor: '#0ea5e9', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a' }}>OUTCOME</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>- captured by CEO</span>
          </div>
          
          <div className="d-flex flex-column gap-3">
            {/* Box 1: CONFIRMED STATUS */}
            <div className="rounded bg-white" style={{ padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '12px' }}>CONFIRMED STATUS</div>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {STATUS_OPTIONS.map(opt => (
                  <button 
                    key={opt}
                    className="btn btn-sm"
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: '600',
                      padding: '4px 16px',
                      borderRadius: '100px',
                      border: '1px solid',
                      ...getStatusStyles(opt, status === opt)
                    }}
                    onClick={() => { setStatus(opt); setHasStatusUpdated(true); }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {status && status !== originalBetStatus && (
                <div className="d-flex align-items-center mt-2 mb-3 px-3 py-2" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', color: '#b45309', fontSize: '13px', fontWeight: '500' }}>
                  <AlertTriangle size={14} className="me-2" />
                  Committee moved from <span className="fw-bold mx-1">{originalBetStatus.charAt(0).toUpperCase() + originalBetStatus.slice(1).toLowerCase()}</span> to <span className="fw-bold mx-1">{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>
                </div>
              )}
              <hr style={{ borderColor: '#e2e8f0', margin: '0 -16px 12px -16px' }} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>WHY THIS CALL?</div>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={statusReason}
                  onChange={(e) => { setStatusReason(e.target.value); setHasStatusUpdated(true); }}
                  placeholder="Why this status call? The reasoning the committee will want to remember."
                  style={{ fontSize: '13px', resize: 'none', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155' }}
                />
              </div>
            </div>

            {/* Box 2: CONFIRMED LEARNING */}
            <div className="rounded bg-white" style={{ padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '12px' }}>CONFIRMED LEARNING</div>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {LEARNING_OPTIONS.map(opt => (
                  <button 
                    key={opt}
                    className="btn btn-sm"
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: '600',
                      padding: '4px 16px',
                      borderRadius: '100px',
                      border: '1px solid',
                      backgroundColor: learningState === opt.toLowerCase() ? '#ffffff' : '#ffffff',
                      borderColor: learningState === opt.toLowerCase() ? '#0ea5e9' : '#e2e8f0',
                      color: learningState === opt.toLowerCase() ? '#0ea5e9' : '#64748b'
                    }}
                    onClick={() => { setLearningState(opt.toLowerCase()); setHasLearningUpdated(true); }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <hr style={{ borderColor: '#e2e8f0', margin: '0 -16px 12px -16px' }} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>WHY THIS CALL?</div>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={learningReason}
                  onChange={(e) => { setLearningReason(e.target.value); setHasLearningUpdated(true); }}
                  placeholder="Why this learning call? What did this review actually prove or disprove?"
                  style={{ fontSize: '13px', resize: 'none', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155' }}
                />
              </div>
            </div>

            {/* Box 3: PREVIOUS COMMITMENTS */}
            {prevCommitments.length > 0 && (
              <div className="rounded bg-white mb-3" style={{ padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>
                  PREVIOUS COMMITMENTS <span style={{ fontWeight: '400', textTransform: 'none', color: '#64748b' }}>· CONFIRM WHAT GOT DONE</span>
                </div>
                {prevCommitments.map(c => (
                  <div key={c.id} className="d-flex align-items-center mb-2">
                    <button 
                      className="btn p-0 me-2 d-flex align-items-center justify-content-center flex-shrink-0" 
                      style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: c.checked ? '#16a34a' : '#ffffff', border: c.checked ? '1px solid #16a34a' : '1px solid #cbd5e1' }}
                      onClick={() => toggleCommitment(c.id)}
                    >
                      {c.checked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </button>
                    <span style={{ fontSize: '13px', flex: 1, color: '#334155' }}>{c.text}</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ fontSize: '11.5px', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '100px' }}>{c.owner}</span>
                      <span className="badge" style={{ fontSize: '11.5px', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '100px' }}>{c.date ? new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Box 4: NEW COMMITMENTS */}
            <div className="rounded bg-white" style={{ padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>
                NEW COMMITMENTS <span style={{ fontWeight: '400', textTransform: 'none', color: '#64748b' }}>· DECISIONS WITH AN OWNER</span>
              </div>
              
              {curCommitments.map(c => (
                <div key={c.id} className="d-flex align-items-center gap-2 mb-2">
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="What needs to happen?"
                    value={c.text}
                    onChange={(e) => updateCommitmentField(c.id, 'text', e.target.value)}
                    style={{ fontSize: '13px', flex: 1, color: '#0f172a', border: '1px solid #e2e8f0' }}
                  />
                  <select 
                    className="form-select form-select-sm" 
                    style={{ width: '130px', fontSize: '13px', color: c.owner ? '#0f172a' : '#94a3b8', border: '1px solid #e2e8f0' }}
                    value={c.owner}
                    onChange={(e) => updateCommitmentField(c.id, 'owner', e.target.value)}
                  >
                    <option value="">Owner...</option>
                    <option value="You">You</option>
                    {bet.accountable_owner && bet.accountable_owner !== 'You' && (
                      <option value={bet.accountable_owner}>{bet.accountable_owner}</option>
                    )}
                  </select>
                  <input 
                    type="date" 
                    className="form-control form-control-sm" 
                    style={{ width: '140px', fontSize: '13px', color: c.date ? '#0f172a' : '#94a3b8', border: '1px solid #e2e8f0' }}
                    value={c.date ? c.date.substring(0, 10) : ''}
                    onChange={(e) => updateCommitmentField(c.id, 'date', e.target.value)}
                  />
                  <button 
                    className="btn btn-link text-muted p-0 d-flex align-items-center"
                    style={{ fontSize: '18px', lineHeight: 1, textDecoration: 'none' }}
                    onClick={() => removeCommitment(c.id)}
                  >×</button>
                </div>
              ))}

              <button 
                className="btn btn-sm d-flex align-items-center gap-1 mt-3"
                style={{ fontSize: '12px', fontWeight: '600', color: '#475569', border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '5px 12px', backgroundColor: 'transparent' }}
                onClick={addNewCommitment}
              >
                <Plus size={13} strokeWidth={3} /> Add a commitment
              </button>
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
          const isAssigned = names.includes(fetchedCadence.name);
          const isNotDraft = p.status?.toUpperCase() !== "DRAFT";
          return isAssigned && isNotDraft;
        });
        
        // Use global index from allProjects to maintain true bet numbering
        const betsWithGlobalIndex = cadenceBets.map(b => ({
          ...b,
          globalIndex: allProjects.findIndex(p => p._id === b._id) + 1
        }));
        
        setBets(betsWithGlobalIndex);

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
        commitments: updateData.commitments,
        status_reason: updateData.status_reason,
        learning_reason: updateData.learning_reason
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
      const errMsg = err.response?.data?.error || "Failed to save the bet update. Please try again.";
      useNotificationStore.getState().addNotification(errMsg, 'error');
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
        const headers = { Authorization: `Bearer ${token}` };
        
        await axios.post(`${baseUrl}/api/cadences/${cadenceId}/moment/${momentId}/close`, {}, { headers });
        
        navigate('/businesspage?tab=cadences');
      } catch (err) {
        console.error("Failed to close moment", err);
        useNotificationStore.getState().addNotification("Failed to close the moment. Please try again.", "error");
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
        <Link to={`/businesspage?tab=cadences`} className="d-inline-flex align-items-center text-decoration-none mb-4" style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
          <ChevronLeft size={16} className="me-1" strokeWidth={3} /> Back to Cadences
        </Link>

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end pb-3 mb-4" style={{ borderBottom: '1px solid #fde047' }}>
          <div>
            <h1 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '24px', letterSpacing: '-0.5px', fontWeight: '900' }}>{moment ? moment.name : 'Loading...'}</h1>
            <div className="d-flex align-items-center gap-2">
              <span className="d-inline-flex align-items-center justify-content-center text-uppercase" style={{ fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.5px', color: '#b45309', backgroundColor: '#fef3c7', borderRadius: '100px', padding: '3px 8px' }}>
                Needs close
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {moment?.date ? new Date(moment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''} · {moment?.date ? Math.max(0, Math.floor((new Date() - new Date(moment.date)) / (1000 * 60 * 60 * 24))) : 0} days ago · {bets.length} bet{bets.length !== 1 ? 's' : ''} · {Object.values(confirmedBetsMap).filter(Boolean).length}/{bets.length} outcomes
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Avatars */}
            <div className="d-flex">
               {Array.from(new Set(bets.map(b => b.accountable_owner).filter(Boolean))).slice(0, 4).map((owner, idx) => (
                 <div key={idx} className="rounded-circle d-flex align-items-center justify-content-center" 
                      style={{ 
                        width: '32px', height: '32px', 
                        zIndex: 4 - idx, 
                        marginLeft: idx > 0 ? '-10px' : '0', 
                        fontSize: '11px', fontWeight: '700',
                        backgroundColor: '#f0f9ff',
                        color: '#0ea5e9',
                        border: '1px solid #bae6fd' 
                      }}>
                   {owner.substring(0, 2).toUpperCase()}
                 </div>
               ))}
            </div>
            <button className="btn d-flex align-items-center gap-2" style={{ fontSize: '13px', fontWeight: '500', color: '#475569', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              Meeting setup <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Close this moment header */}
        <div className="card shadow-sm border-1 mb-4" style={{ borderColor: '#e2e8f0', borderRadius: '8px' }}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h5 className="fw-bold mb-0" style={{ color: '#0f172a', fontSize: '15px' }}>Close this Moment</h5>
                <button 
                  className="btn fw-bold l d-flex align-items-center" 
                  style={{ 
                    backgroundColor: (bets.length > 0 && Object.values(confirmedBetsMap).filter(Boolean).length === bets.length) ? '#0c71b9' : '#f1f5f9', 
                    color: (bets.length > 0 && Object.values(confirmedBetsMap).filter(Boolean).length === bets.length) ? '#ffffff' : '#6b7280',
                    fontSize: '13.5px', 
                    padding: '8px 20px' 
                  }} 
                  onClick={handleSignAndClose}
                  disabled={bets.length === 0 || Object.values(confirmedBetsMap).filter(Boolean).length !== bets.length}
                >
                  Sign & close <Check size={16} className="ms-2" />
                </button>
              </div>
              <p className="text-muted mb-0" style={{ fontSize: '12.5px', color: '#64748b' }}>Confirm each bet's outcome — Status, Learning, and prior commitments. <span className="fw-bold text-dark">{Object.values(confirmedBetsMap).filter(Boolean).length} of {bets.length}</span> confirmed.</p>
              
              {/* Progress and Pills */}
              {bets.length > 0 && (
                <div className="mt-2">
                  <div className="progress mb-2" style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${bets.length > 0 ? (Object.values(confirmedBetsMap).filter(Boolean).length / bets.length) * 100 : 0}%`, backgroundColor: '#0c71b9', borderRadius: '4px' }}
                    ></div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {bets.map((b) => confirmedBetsMap[b._id] ? (
                      <span key={b._id} className="d-inline-flex align-items-center justify-content-center rounded-pill px-3 py-2 gap-1" style={{ fontSize: '13px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: '600' }}>
                        <span style={{ fontSize: '14px', lineHeight: 1 }}>✓</span> #{b.globalIndex}
                      </span>
                    ) : (
                      <span key={b._id} className="d-inline-flex align-items-center justify-content-center rounded-pill px-2 py-1 gap-1 bg-white" style={{ fontSize: '13px', color: '#0f172a', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                        <span style={{ fontSize: '14px', lineHeight: 1, color: '#94a3b8' }}>○</span> #{b.globalIndex}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top flags to review */}
        {bets.length === 0 ? (
          <div className="alert d-flex align-items-center mb-4" style={{ backgroundColor: '#ffffff', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '12px 16px' }}>
            <CheckCircle2 className="me-2 text-success" size={20} fill="#22c55e" color="#ffffff" />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Nothing flagged this cycle — the agenda looks clean.</span>
          </div>
        ) : (
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
        )}

        {/* REVIEW EACH BET Section */}
        <div className="mb-3">
          <span className="text-muted fw-bold" style={{ fontSize: '11px', letterSpacing: '1px' }}>CONFIRM EACH BET</span>
        </div>

        {isLoading ? (
          <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
        ) : bets.length === 0 ? (
          <div className="card border-1 mb-5" style={{ borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div className="card-body text-center py-5 my-3">
              <CheckSquare size={32} color="#94a3b8" className="mb-3" />
              <h5 className="fw-bold mb-1" style={{ color: '#334155', fontSize: '16px' }}>No bets on this cadence yet</h5>
              <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Tag a bet with <span className="fw-bold text-dark">{cadence?.name || 'this cadence'}</span> and it will show up here for review.</p>
            </div>
          </div>
        ) : (
          bets.map((bet, idx) => {
            const updateInfo = getCompletedData(bet._id);
            const completed = !!(updateInfo && updateInfo.status && updateInfo.status.trim() !== "" && updateInfo.learning_state && updateInfo.learning_state.trim() !== "");
            
            // Extract previous commitments from allCompletedUpdates for this bet
            const legacyCommitments = allCompletedUpdates
              .filter(cu => cu.bet_id === bet._id && cu.moment_id !== momentId && cu.new_commitments)
              .flatMap(cu => {
                let parsed = [];
                try {
                  parsed = JSON.parse(cu.new_commitments);
                } catch (e) {
                  if (cu.new_commitments.trim() !== "" && cu.new_commitments !== "[]") {
                    parsed = [cu.new_commitments];
                  }
                }
                
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return parsed.map((text, i) => {
                    // Try to preserve checked status if it exists in bet.commitments
                    const existing = (bet.commitments || []).find(c => c.text === text);
                    return {
                      id: `${cu._id}_${i}`,
                      text: text, 
                      date: cu.created_at,
                      owner: bet.accountable_owner || 'Unassigned',
                      checked: existing ? !!existing.checked : false 
                    };
                  });
                }
                return [];
              });

            return (
              <BetReviewCard 
                key={bet._id} 
                bet={bet}
                index={bet.globalIndex - 1}
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
