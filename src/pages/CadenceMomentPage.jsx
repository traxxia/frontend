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

const BetReviewCard = ({ bet, isCompleted, updateInfo, onSave, index, legacyCommitments, momentId, onStatusChange, eligibleOwners, isReadOnly }) => {
  
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

  // Auto-save debounce for text and commitments
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasStatusUpdated || hasLearningUpdated) {
        handleSave();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [statusReason, learningReason, commitments]);

  // Immediate save when clicking discrete options (status, learningState)
  useEffect(() => {
    if (hasStatusUpdated || hasLearningUpdated) {
      handleSave();
    }
  }, [status, learningState]);

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
    <div id={`bet-card-${bet._id}`} className="card shadow-sm border-1 mb-3" style={{ borderColor: '#e2e8f0', borderRadius: '8px', scrollMarginTop: '100px' }}>
      <div className="card-header bg-white border-bottom-0 py-2 px-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <span className="fw-bold me-2 text-muted" style={{ fontSize: '12px' }}>#{index + 1}</span> 
          <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{bet.project_name || bet.initiative_name || bet.name || "Unnamed Bet"}</span>
        </div>
        <div className="d-flex align-items-center gap-2 text-dark fw-medium" style={{ fontSize: '12px' }}>
          <span className="text-dark" style={{ fontSize: '11px', fontWeight: '500' }}>You</span>
          {isConfirmedLocal ? (
            <button className="btn btn-sm text-success fw-bold d-flex align-items-center bg-white border-success rounded px-2 py-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
              CONFIRMED
            </button>
          ) : (
            <button className="btn btn-sm text-warning fw-bold d-flex align-items-center bg-white rounded px-2 py-1" style={{ fontSize: '10px', letterSpacing: '0.5px', color: '#d97706', border: '1px solid #fcd34d' }}>
              <span className="me-1">○</span> TO CONFIRM
            </button>
          )}
        </div>
      </div>
      
      <div className="card-body px-3 pb-3 pt-0">
        
        {/* WHAT YOU BROUGHT */}
        <div className="mb-3 rounded" style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center mb-2">
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a', marginRight: '8px' }}>WHAT YOU BROUGHT</span>
            <span style={{ fontSize: '11px', color: '#64748b', marginRight: '8px' }}>proposes</span>
            <span className="d-inline-flex align-items-center justify-content-center" style={{ fontSize: '10px', border: '1px solid', borderRadius: '4px', padding: '2px 6px', marginRight: '8px', ...getStatusStyles(bet.status || "ACTIVE", true) }}>
              {(bet.status || "ACTIVE").toUpperCase()}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>- {bet.learning_state || "Not started"}</span>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '2px' }}>WHAT CHANGED</div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8' }}>{whatChanged.length > 0 ? whatChanged[0] : "No update from the decider yet."}</div>
            </div>
            <div className="col-md-6">
              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '2px' }}>RISKS & BLOCKERS</div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8' }}>None flagged yet.</div>
            </div>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div style={{ width: '5px', height: '5px', backgroundColor: '#0ea5e9', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a' }}>INSIGHTS</span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>- what the history says</span>
          </div>
          <div className="d-flex align-items-center" style={{ fontSize: '12px', fontWeight: '600', color: '#059669' }}>
            <CheckCircle2 size={14} className="me-2" fill="#22c55e" color="#ffffff" />
            No flags — thesis holds, risks under control.
          </div>
        </div>

        {/* OUTCOME */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <div style={{ width: '5px', height: '5px', backgroundColor: '#0ea5e9', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a' }}>OUTCOME</span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>- captured by CEO</span>
          </div>
          
          <div className="d-flex flex-column gap-2">
            {/* Box 1: CONFIRMED STATUS */}
            <div className="rounded bg-white" style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>CONFIRMED STATUS</div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {STATUS_OPTIONS.map(opt => (
                  <button 
                    key={opt}
                    className="btn btn-sm"
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: '600',
                      padding: '3px 12px',
                      borderRadius: '100px',
                      border: '1px solid',
                      opacity: isReadOnly ? 0.6 : 1,
                      cursor: isReadOnly ? 'not-allowed' : 'pointer',
                      ...getStatusStyles(opt, status === opt)
                    }}
                    onClick={() => { if (!isReadOnly) { setStatus(opt); setHasStatusUpdated(true); } }}
                    disabled={isReadOnly}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {status && status !== originalBetStatus && (
                <div className="d-flex align-items-center mt-2 mb-2 px-2 py-1" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', color: '#b45309', fontSize: '11px', fontWeight: '500' }}>
                  <AlertTriangle size={12} className="me-2" />
                  Committee moved from <span className="fw-bold mx-1">{originalBetStatus.charAt(0).toUpperCase() + originalBetStatus.slice(1).toLowerCase()}</span> to <span className="fw-bold mx-1">{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>
                </div>
              )}
              <hr style={{ borderColor: '#e2e8f0', margin: '0 -12px 10px -12px' }} />
              <div>
                <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '6px' }}>WHY THIS CALL?</div>
                <textarea 
                  className="form-control form-control-sm" 
                  rows="2" 
                  value={statusReason}
                  onChange={(e) => { setStatusReason(e.target.value); setHasStatusUpdated(true); }}
                  onBlur={() => { if (hasStatusUpdated || hasLearningUpdated) handleSave(); }}
                  placeholder="Why this status call? The reasoning the committee will want to remember."
                  disabled={isReadOnly}
                  style={{ fontSize: '12px', resize: 'none', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155', opacity: isReadOnly ? 0.6 : 1 }}
                />
              </div>
            </div>

            {/* Box 2: CONFIRMED LEARNING */}
            <div className="rounded bg-white" style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>CONFIRMED LEARNING</div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {LEARNING_OPTIONS.map(opt => (
                  <button 
                    key={opt}
                    className="btn btn-sm"
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: '600',
                      padding: '3px 12px',
                      borderRadius: '100px',
                      border: '1px solid',
                      opacity: isReadOnly ? 0.6 : 1,
                      cursor: isReadOnly ? 'not-allowed' : 'pointer',
                      backgroundColor: learningState === opt.toLowerCase() ? '#ffffff' : '#ffffff',
                      borderColor: learningState === opt.toLowerCase() ? '#0ea5e9' : '#e2e8f0',
                      color: learningState === opt.toLowerCase() ? '#0ea5e9' : '#64748b'
                    }}
                    onClick={() => { if (!isReadOnly) { setLearningState(opt.toLowerCase()); setHasLearningUpdated(true); } }}
                    disabled={isReadOnly}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <hr style={{ borderColor: '#e2e8f0', margin: '0 -12px 10px -12px' }} />
              <div>
                <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '6px' }}>WHY THIS CALL?</div>
                <textarea 
                  className="form-control form-control-sm" 
                  rows="2" 
                  value={learningReason}
                  onChange={(e) => { setLearningReason(e.target.value); setHasLearningUpdated(true); }}
                  onBlur={() => { if (hasStatusUpdated || hasLearningUpdated) handleSave(); }}
                  placeholder="Why this learning call? What did this review actually prove or disprove?"
                  disabled={isReadOnly}
                  style={{ fontSize: '12px', resize: 'none', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155', opacity: isReadOnly ? 0.6 : 1 }}
                />
              </div>
            </div>

            {/* Box 3: PREVIOUS COMMITMENTS */}
            {prevCommitments.length > 0 && (
              <div className="rounded bg-white mb-2" style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                  PREVIOUS COMMITMENTS <span style={{ fontWeight: '400', textTransform: 'none', color: '#64748b' }}>· CONFIRM WHAT GOT DONE</span>
                </div>
                {prevCommitments.map(c => (
                  <div key={c.id} className="d-flex align-items-center mb-2">
                    <button 
                      className="btn p-0 me-2 d-flex align-items-center justify-content-center flex-shrink-0" 
                      style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: c.checked ? '#16a34a' : '#ffffff', border: c.checked ? '1px solid #16a34a' : '1px solid #cbd5e1', opacity: isReadOnly ? 0.6 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                      onClick={() => toggleCommitment(c.id)}
                      disabled={isReadOnly}
                    >
                      {c.checked && <Check size={10} color="#ffffff" strokeWidth={3} />}
                    </button>
                    <span style={{ fontSize: '12px', flex: 1, color: '#334155' }}>{c.text}</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge" style={{ fontSize: '10px', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '100px' }}>{c.owner}</span>
                      <span className="badge" style={{ fontSize: '10px', fontWeight: '500', color: '#64748b', backgroundColor: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '100px' }}>{c.date ? new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Box 4: NEW COMMITMENTS */}
            <div className="rounded bg-white" style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                NEW COMMITMENTS <span style={{ fontWeight: '400', textTransform: 'none', color: '#64748b' }}>· DECISIONS WITH AN OWNER</span>
              </div>
              
              {curCommitments.map(c => (
                <div key={c.id} className="d-flex align-items-center gap-2 mb-2">
                  <input 
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="What needs to happen?"
                    value={c.text}
                    onChange={(e) => updateCommitmentField(c.id, 'text', e.target.value)}
                    disabled={isReadOnly}
                    style={{ fontSize: '12px', flex: 1, color: '#0f172a', border: '1px solid #e2e8f0', opacity: isReadOnly ? 0.6 : 1, height: '32px' }}
                  />
                  <select 
                    className="form-select form-select-sm" 
                    style={{ width: '130px', fontSize: '12px', color: c.owner ? '#0f172a' : '#94a3b8', border: '1px solid #e2e8f0', opacity: isReadOnly ? 0.6 : 1, height: '32px', paddingTop: '2px', paddingBottom: '2px' }}
                    value={c.owner}
                    onChange={(e) => updateCommitmentField(c.id, 'owner', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Owner...</option>
                    {eligibleOwners?.map(owner => (
                      <option key={owner._id || owner.id} value={owner.name}>{owner.name}</option>
                    ))}
                  </select>
                  <input 
                    type="date" 
                    className="form-control form-control-sm" 
                    style={{ width: '130px', fontSize: '12px', color: c.date ? '#0f172a' : '#94a3b8', border: '1px solid #e2e8f0', opacity: isReadOnly ? 0.6 : 1, height: '32px' }}
                    value={c.date ? c.date.substring(0, 10) : ''}
                    onChange={(e) => updateCommitmentField(c.id, 'date', e.target.value)}
                    disabled={isReadOnly}
                  />
                  <button 
                    className="btn btn-link text-muted p-0 d-flex align-items-center"
                    style={{ fontSize: '16px', lineHeight: 1, textDecoration: 'none', opacity: isReadOnly ? 0.4 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                    onClick={() => removeCommitment(c.id)}
                    disabled={isReadOnly}
                  >×</button>
                </div>
              ))}

              <button 
                className="btn btn-sm d-flex align-items-center gap-1 mt-2"
                style={{ fontSize: '11px', fontWeight: '600', color: isReadOnly ? '#94a3b8' : '#475569', border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '4px 10px', backgroundColor: 'transparent', cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                onClick={addNewCommitment}
                disabled={isReadOnly}
              >
                <Plus size={12} strokeWidth={3} /> Add a commitment
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const MeetingSetupPanel = ({
  cadence,
  eligibleOwners,
  betsCount,
  initialAudience,
  initialAgenda,
  onSave,
  onClose
}) => {
  const [audience, setAudience] = useState(initialAudience || []);
  const [agenda, setAgenda] = useState(initialAgenda || []);

  // Sync state if initial props change (e.g. from backend load)
  useEffect(() => {
    setAudience(initialAudience || []);
    setAgenda(initialAgenda || []);
  }, [initialAudience, initialAgenda]);

  const toggleAudience = (ownerId) => {
    setAudience(prev => prev.includes(ownerId) ? prev.filter(id => id !== ownerId) : [...prev, ownerId]);
  };

  const handleDone = () => {
    onSave(audience, agenda, false);
    onClose();
  };

  const handleSetDefault = () => {
    onSave(audience, agenda, true);
    // Notification will be triggered by saveMeetingSetup
  };

  return (
    <div className="mb-3 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div className="row g-3">
        {/* Left Column: Audience */}
        <div className="col-md-6">
          <div className="bg-white rounded p-3 p-md-4 h-100 shadow-sm d-flex flex-column" style={{ border: '1px solid #e2e8f0' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: '#1e3a8a', textTransform: 'uppercase' }}>
                Audience
              </span>
              <button className="btn btn-link p-0 text-decoration-none fw-bold" style={{ fontSize: '13px', color: '#0c71b9' }} onClick={handleDone}>
                Close
              </button>
            </div>
            
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              {audience.map(ownerId => {
                const owner = eligibleOwners.find(o => (o._id || o.id) === ownerId);
                if (!owner) return null;
                return (
                  <span key={ownerId} className="d-inline-flex align-items-center rounded-pill px-2 py-1 bg-white" style={{ fontSize: '13px', color: '#0f172a', border: '1px solid #e2e8f0' }}>
                    {owner.name}
                  </span>
                );
              })}
              {audience.length === 0 && <span className="text-muted" style={{ fontSize: '13px', color: '#94a3b8' }}>No one selected</span>}
              {audience.length > 0 && <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#94a3b8', marginLeft: '4px' }}>Series default</span>}
            </div>

            <div className="mb-4 flex-grow-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {eligibleOwners.map(owner => {
                const id = owner._id || owner.id;
                return (
                  <div key={id} className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <input 
                        type="checkbox" 
                        className="form-check-input me-2 mt-0 shadow-none" 
                        checked={audience.includes(id)}
                        onChange={() => toggleAudience(id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', borderColor: '#cbd5e1' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{owner.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{owner.email || owner.role}</span>
                  </div>
                );
              })}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
              <button className="btn btn-link p-0 text-decoration-none" style={{ fontSize: '13px', color: '#0c71b9', fontWeight: '500' }} onClick={handleSetDefault}>
                Set as default for all {cadence?.name}
              </button>
              <button className="btn fw-bold btn-sm" style={{ backgroundColor: '#0c71b9', color: '#ffffff', fontSize: '13px', padding: '6px 16px', borderRadius: '6px' }} onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Agenda */}
        <div className="col-md-6">
          <div className="bg-white rounded p-3 p-md-4 h-100 shadow-sm d-flex flex-column" style={{ border: '1px solid #e2e8f0' }}>
            <div className="mb-3 d-flex align-items-center">
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: '#1e3a8a', textTransform: 'uppercase' }}>
                Other Agenda Items <span style={{ fontWeight: '400', textTransform: 'none', color: '#94a3b8' }}>(optional)</span>
              </span>
            </div>
            <p className="mb-3" style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              The {betsCount} bet{betsCount !== 1 ? 's' : ''} below are on the agenda automatically. Add anything extra here.
            </p>

            {agenda.map((item, idx) => (
              <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                <input 
                  type="text"
                  className="form-control form-control-sm shadow-none"
                  value={item}
                  onChange={(e) => {
                    const newAgenda = [...agenda];
                    newAgenda[idx] = e.target.value;
                    setAgenda(newAgenda);
                  }}
                  onBlur={() => onSave(audience, agenda, false)}
                  style={{ fontSize: '13px', flex: 1, color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px' }}
                />
                <button 
                  className="btn btn-link p-0 d-flex align-items-center justify-content-center"
                  style={{ fontSize: '16px', width: '20px', height: '20px', lineHeight: 1, textDecoration: 'none', color: '#64748b' }}
                  onClick={() => {
                    const newAgenda = agenda.filter((_, i) => i !== idx);
                    setAgenda(newAgenda);
                    onSave(audience, newAgenda, false);
                  }}
                >×</button>
              </div>
            ))}

            <button 
              className="btn btn-sm d-flex align-items-center gap-1 mt-2 align-self-start"
              style={{ fontSize: '13px', fontWeight: '600', color: '#0c71b9', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '6px 12px', backgroundColor: '#ffffff' }}
              onClick={() => setAgenda([...agenda, ''])}
            >
              <Plus size={14} strokeWidth={2.5} /> Add item
            </button>
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
  const [eligibleOwners, setEligibleOwners] = useState([]);
  const [isSigningAndClosing, setIsSigningAndClosing] = useState(false);
  const [showMeetingSetup, setShowMeetingSetup] = useState(false);
  const [momentAudience, setMomentAudience] = useState([]);
  const [momentAgenda, setMomentAgenda] = useState([]);

  // Ensure tooltips are initialized
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl));
    return () => tooltipList.map(t => t.dispose());
  }, [bets]);

  const saveMeetingSetup = async (newAudience, newAgenda, updateDefault = false) => {
    setMomentAudience(newAudience);
    setMomentAgenda(newAgenda);

    try {
      const token = useAuthStore.getState().token;
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

      const updatedScheduleDates = cadence.scheduleDates.map(d => 
        d._id === momentId ? { ...d, audience: newAudience, agenda: newAgenda } : d
      );

      const updatePayload = { scheduleDates: updatedScheduleDates };
      if (updateDefault) {
        updatePayload.defaultAudience = newAudience;
      }

      await axios.put(`${baseUrl}/api/cadences/${cadenceId}`, updatePayload, { headers });
      
      setCadence(prev => ({ 
        ...prev, 
        scheduleDates: updatedScheduleDates,
        ...(updateDefault && { defaultAudience: newAudience })
      }));
    } catch (err) {
      console.error("Error saving meeting setup:", err);
      useNotificationStore.getState().addNotification("Failed to save meeting setup", "error");
    }
  };

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

        const ownersRes = await axios.get(`${baseUrl}/api/businesses/${businessId}/eligible-owners`, { headers }).catch(e => {
          console.error("Error fetching owners:", e);
          return { data: { eligible_owners: [] } };
        });
        const fetchedOwners = ownersRes.data.eligible_owners || [];
        setEligibleOwners(fetchedOwners);

        setMomentAudience(matchedMoment?.audience || fetchedCadence.defaultAudience || []);
        setMomentAgenda(matchedMoment?.agenda || []);

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

      // ─── Save ONLY to the snapshot collection ───────────────────────────────
      // The live projects document is intentionally NOT updated here.
      // Original bet data remains unchanged until Sign & Close is clicked.
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
        new_commitments: JSON.stringify(
          updateData.commitments.filter(c => c.moment_id === momentId).map(c => c.text)
        )
      };

      const newRecordRes = await axios.post(
        `${baseUrl}/api/completed-bet-cadences`,
        recordData,
        { headers }
      );

      // Update the local snapshot state so UI stays in sync
      setCompletedUpdates(prev => {
        const filtered = prev.filter(p => p.bet_id?.toString() !== betId.toString());
        return [...filtered, newRecordRes.data];
      });
    } catch (err) {
      console.error("Error saving cadence update:", err);
      const errMsg = err.response?.data?.error || "Failed to save the bet update. Please try again.";
      useNotificationStore.getState().addNotification(errMsg, 'error');
    }
  };

  const getCompletedData = (betId) => completedUpdates.find(cu => cu.bet_id.toString() === betId.toString());
  
  const handleSignAndClose = async () => {
    const allConfirmed = bets.length > 0 && bets.every(b => confirmedBetsMap[b._id]);

    if (!allConfirmed) {
      alert("Please confirm all bets before signing and closing this moment.");
      return;
    }

    setIsSigningAndClosing(true);
    try {
      const token = useAuthStore.getState().token;
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const headers = { Authorization: `Bearer ${token}` };

      // ─── Step 1: Promote each snapshot → live project ───────────────────────
      // This is the ONLY moment the original projects collection is updated.
      const promotionPromises = bets.map(bet => {
        const snapshot = completedUpdates.find(
          cu => cu.bet_id?.toString() === bet._id.toString()
        );
        if (!snapshot) return Promise.resolve();

        const projectUpdate = {};
        if (snapshot.status)          projectUpdate.status          = snapshot.status;
        if (snapshot.learning_state)  projectUpdate.learning_state  = snapshot.learning_state;
        if (snapshot.status_reason)   projectUpdate.status_reason   = snapshot.status_reason;
        if (snapshot.learning_reason) projectUpdate.learning_reason = snapshot.learning_reason;

        if (Object.keys(projectUpdate).length === 0) return Promise.resolve();

        return axios.patch(
          `${baseUrl}/api/projects/${bet._id}`,
          { ...projectUpdate, is_cadence_update: true },
          { headers }
        );
      });

      await Promise.all(promotionPromises);

      // ─── Step 2: Mark the moment as closed ──────────────────────────────────
      await axios.post(
        `${baseUrl}/api/cadences/${cadenceId}/moment/${momentId}/close`,
        {},
        { headers }
      );

      navigate('/businesspage?tab=cadences');
    } catch (err) {
      console.error("Failed to sign and close moment:", err);
      const errMsg = err.response?.data?.error || "Failed to close the moment. Please try again.";
      useNotificationStore.getState().addNotification(errMsg, 'error');
      setIsSigningAndClosing(false);
    }
  };

  const flaggedBets = bets.map(b => {
    let severity = b.flag_severity;
    if (!severity) {
      const status = (b.status || '').toUpperCase();
      if (status === 'AT RISK' || status === 'STALLED') severity = 1;
      else if (status === 'PAUSED') severity = 2;
      else severity = 3;
    }
    let dotColor = '#98a2b3';
    if (severity === 1 || severity === '1' || severity === 'red') dotColor = '#d92d20';
    else if (severity === 2 || severity === '2' || severity === 'orange') dotColor = '#f79009';
    else if (severity === 3 || severity === '3' || severity === 'green') dotColor = '#12b76a';
    else dotColor = '#98a2b3';
    
    const defaultInsight = (severity === 3 || severity === '3' || severity === 'green') 
      ? "Review progress and commitments for this bet." 
      : `This bet is currently ${b.status || 'ACTIVE'}.`;
    const insightText = b.top_flag_insight || b.description || defaultInsight;

    return { ...b, computed_severity: severity, dotColor, insightText };
  }).sort((a, b) => {
    const sevA = a.computed_severity ? parseInt(a.computed_severity) || 99 : 99;
    const sevB = b.computed_severity ? parseInt(b.computed_severity) || 99 : 99;
    return sevA - sevB;
  });

  const totalOpenCommitments = bets.reduce((acc, bet) => {
    const legacyCommitments = allCompletedUpdates
      .filter(cu => cu.bet_id?.toString() === bet._id?.toString() && cu.moment_id !== momentId)
      .flatMap(cu => {
        try {
          return cu.new_commitments ? JSON.parse(cu.new_commitments) : [];
        } catch(e) {
          return [];
        }
      });
      
    // Add current commitments
    const currentPrevCommitments = (bet.commitments || []).filter(c => c.moment_id !== momentId && c.text && c.text.trim() !== '' && !c.checked);
    
    return acc + legacyCommitments.length + currentPrevCommitments.length;
  }, 0);

  return (
    <div className="execution-page-container min-vh-100 pb-5">
      <div className="adv-sticky-header">
        <MenuBar />
      </div>

      <div className="container py-3" style={{ maxWidth: '1000px' }}>
        <Link to={`/businesspage?tab=cadences`} className="d-inline-flex align-items-center text-decoration-none mb-3" style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
          <ChevronLeft size={14} className="me-1" strokeWidth={3} /> Back to Cadences
        </Link>

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end pb-2 mb-3" style={{ borderBottom: '1px solid #fde047' }}>
          <div>
            <h1 className="fw-bold mb-1" style={{ color: '#0f172a', fontSize: '22px', letterSpacing: '-0.5px', fontWeight: '900' }}>{moment ? moment.name : 'Loading...'}</h1>
            <div className="d-flex align-items-center gap-2">
              <span className="d-inline-flex align-items-center justify-content-center text-uppercase" style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.5px', color: '#b45309', backgroundColor: '#fef3c7', borderRadius: '100px', padding: '2px 6px' }}>
                Needs close
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
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
             <button 
              className="btn btn-sm d-flex align-items-center gap-2" 
              style={{ fontSize: '12px', fontWeight: '500', color: showMeetingSetup ? '#0c71b9' : '#475569', backgroundColor: '#ffffff', border: showMeetingSetup ? '1px solid #0c71b9' : '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              onClick={() => setShowMeetingSetup(!showMeetingSetup)}
            >
              Meeting setup <ChevronDown size={13} style={{ transform: showMeetingSetup ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>
        </div>

        {/* Meeting Setup Panel */}
        {showMeetingSetup && (
          <MeetingSetupPanel 
            cadence={cadence}
            eligibleOwners={eligibleOwners}
            betsCount={bets.length}
            initialAudience={momentAudience}
            initialAgenda={momentAgenda}
            onSave={saveMeetingSetup}
            onClose={() => setShowMeetingSetup(false)}
          />
        )}

        {/* Close this moment header */}
        {(() => {
          const confirmedCount = Object.values(confirmedBetsMap).filter(Boolean).length;
          const allConfirmed = bets.length > 0 && confirmedCount === bets.length;
          return (
            <div
              className="card shadow-sm border-1 mb-3"
              style={{
                borderColor: allConfirmed ? '#86efac' : '#e2e8f0',
                borderRadius: '8px',
                backgroundColor: allConfirmed ? '#f0fdf4' : '#ffffff',
                transition: 'background-color 0.3s ease, border-color 0.3s ease'
              }}
            >
              <div className="card-body py-2 px-3 d-flex justify-content-between align-items-center">
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h5 className="fw-bold mb-0" style={{ color: '#0f172a', fontSize: '14px' }}>Close this Moment</h5>
                    <button
                      className="btn btn-sm fw-bold d-flex align-items-center"
                      style={{
                        backgroundColor: allConfirmed ? '#0c71b9' : '#f1f5f9',
                        color: allConfirmed ? '#ffffff' : '#6b7280',
                        fontSize: '12px',
                        padding: '6px 16px',
                        minWidth: '120px',
                        justifyContent: 'center'
                      }}
                      onClick={handleSignAndClose}
                      disabled={bets.length === 0 || !allConfirmed || isSigningAndClosing}
                    >
                      {isSigningAndClosing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '13px', height: '13px', borderWidth: '2px' }} />
                          Closing...
                        </>
                      ) : (
                        <>Sign &amp; close <Check size={16} className="ms-2" /></>
                      )}
                    </button>
                  </div>

                  {allConfirmed ? (
                    <p className="mb-0" style={{ fontSize: '11px', color: '#15803d', fontWeight: '500' }}>
                      Every bet is confirmed — sign to lock the snapshot.
                    </p>
                  ) : (
                    <p className="text-muted mb-0" style={{ fontSize: '11px', color: '#64748b' }}>
                      Confirm each bet's outcome — Status, Learning, and prior commitments.{' '}
                      <span style={{ fontWeight: '700', color: '#0c71b9' }}>
                        {confirmedCount} of {bets.length} confirmed.
                      </span>
                    </p>
                  )}

                  {/* Progress and Pills */}
                  {bets.length > 0 && (
                    <div className="mt-2">
                      <div className="progress mb-2" style={{ height: '4px', backgroundColor: allConfirmed ? '#bbf7d0' : '#e2e8f0', borderRadius: '4px' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${bets.length > 0 ? (confirmedCount / bets.length) * 100 : 0}%`,
                            backgroundColor: allConfirmed ? '#16a34a' : '#0c71b9',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease, background-color 0.3s ease'
                          }}
                        ></div>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {bets.map((b) => confirmedBetsMap[b._id] ? (
                          <span
                            key={b._id}
                            className="d-inline-flex align-items-center justify-content-center rounded-pill px-3 py-1 gap-1"
                            style={{ fontSize: '12px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: '600' }}
                          >
                            <span style={{ fontSize: '13px', lineHeight: 1 }}>✓</span> #{b.globalIndex}
                          </span>
                        ) : (
                          <span
                            key={b._id}
                            className="d-inline-flex align-items-center justify-content-center rounded-pill px-2 py-1 gap-1 bg-white"
                            style={{ fontSize: '12px', color: '#0f172a', border: '1px solid #e2e8f0', fontWeight: '600' }}
                          >
                            <span style={{ fontSize: '13px', lineHeight: 1, color: '#94a3b8' }}>○</span> #{b.globalIndex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TOP FLAGS TO REVIEW ──────────────────────────────── */}
        <div className="card shadow-sm mb-3" style={{ borderColor: '#eaecf0', borderRadius: '8px', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
          <div className="card-header bg-white border-0 pt-3 pb-0 px-3">
            <h5 className="mb-0" style={{ fontSize: '14px', fontWeight: '600', color: '#101828' }}>Top flags to review</h5>
          </div>
          <div className="card-body px-3 pb-2">
            {flaggedBets.length > 0 || totalOpenCommitments > 0 ? (
              <>
                <ul className="list-unstyled mb-0">
                  {flaggedBets.map(bet => {
                    return (
                      <li key={bet._id} className="d-flex align-items-center justify-content-between mb-2 pb-2" style={{ borderBottom: '1px solid #eaecf0' }}>
                        <div className="d-flex align-items-center pe-3">
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: bet.dotColor, marginRight: '12px', flexShrink: 0 }}></span>
                          <div style={{ lineHeight: '1.4' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#344054' }}>
                              #{bet.globalIndex} {bet.project_name || bet.initiative_name || bet.name}
                            </span>
                            <span style={{ color: '#98a2b3', fontSize: '13px', margin: '0 6px' }}>—</span>
                            <span style={{ fontSize: '13px', color: '#667085' }}>
                              {bet.insightText}
                            </span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-link p-0 text-decoration-none d-flex align-items-center flex-shrink-0" 
                          style={{ fontSize: '12px', fontWeight: '600', color: '#0073ea' }}
                          onClick={() => {
                            const el = document.getElementById(`bet-card-${bet._id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                        >
                          Open <span className="ms-1">&rarr;</span>
                        </button>
                      </li>
                    );
                  })}

                  {totalOpenCommitments > 0 && (
                    <li className="d-flex align-items-center justify-content-between mb-2 pb-2" style={{ borderBottom: '1px solid #eaecf0' }}>
                      <div className="d-flex align-items-center pe-3">
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#98a2b3', marginRight: '12px', flexShrink: 0 }}></span>
                        <div style={{ lineHeight: '1.4' }}>
                          <span style={{ fontSize: '13px', color: '#667085' }}>
                            {totalOpenCommitments} {totalOpenCommitments === 1 ? 'commitment' : 'commitments'} from previous reviews still open.
                          </span>
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
                <div style={{ fontSize: '11px', color: '#98a2b3', fontStyle: 'italic', marginTop: '6px' }}>
                  Ranked by severity. Open any bet below for its full set of insights.
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center mt-2" style={{ color: '#027a48', backgroundColor: '#ecfdf3', border: '1px solid #a6f4c5', padding: '8px 12px', borderRadius: '8px' }}>
                <CheckCircle2 className="me-2" size={16} />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Nothing flagged this cycle — the agenda looks clean.</span>
              </div>
            )}
          </div>
        </div>

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
                eligibleOwners={eligibleOwners}
                isReadOnly={isSigningAndClosing}
              />
            );
          })
        )}

      </div>
    </div>
  );
};

export default CadenceMomentPage;
