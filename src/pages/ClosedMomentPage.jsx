import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore, useBusinessStore } from '../store';
import MenuBar from '../components/MenuBar';
import '../styles/ProjectsTable.css';

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

const getOwnerDetails = (bet, myUserId) => {
  let ownerName = "Unassigned";
  let ownerInitials = "?";

  if (bet.accountable_owner_id) {
    if (String(bet.accountable_owner_id) === String(myUserId)) {
      ownerName = "You";
      const uName = useAuthStore.getState().userName || "You";
      const parts = uName.split(" ").filter(Boolean);
      ownerInitials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0]?.[0] || "?").toUpperCase();
    } else {
      ownerName = bet.accountable_owner || "Unknown";
      const parts = ownerName.split(" ").filter(Boolean);
      ownerInitials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0]?.[0] || "?").toUpperCase();
    }
  }
  return { ownerName, ownerInitials };
};

const ClosedMomentPage = () => {
  const { businessId, cadenceId, momentId } = useParams();
  const navigate = useNavigate();
  const myUserId = useAuthStore(state => state.userId);
  const { selectedBusiness } = useBusinessStore();

  const [cadence, setCadence] = useState(null);
  const [moment, setMoment] = useState(null);
  const [closedBets, setClosedBets] = useState([]);
  const [completedUpdates, setCompletedUpdates] = useState([]);
  const [expandedBetId, setExpandedBetId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

        const [projResponse, compResponse] = await Promise.all([
          axios.get(`${baseUrl}/api/projects?business_id=${businessId}`, { headers }),
          axios.get(`${baseUrl}/api/completed-bet-cadences?business_id=${businessId}&moment_id=${momentId}`, { headers })
        ]);

        const allProjects = projResponse.data.projects || [];
        const fetchedUpdates = compResponse.data || [];
        setCompletedUpdates(fetchedUpdates);

        const cadenceBets = allProjects.filter(p => {
          const cStr = p.review_cadence || p.cadence || "";
          const names = cStr.split(",").map(s => s.trim()).filter(Boolean);
          return names.includes(fetchedCadence.name);
        });

        const matchedBets = cadenceBets.filter(bet =>
          fetchedUpdates.some(cu => cu.bet_id === bet._id && cu.moment_id === momentId)
        );

        setClosedBets(matchedBets);
      } catch (err) {
        console.error("Failed to fetch closed moment data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [businessId, cadenceId, momentId]);

  if (isLoading) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
        <MenuBar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!moment || !cadence) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
        <MenuBar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <p className="text-muted">Moment not found</p>
        </div>
      </div>
    );
  }

  const mDate = new Date(moment.date);
  const formattedDate = mDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  const uniqueDeciders = Array.from(new Set(closedBets.map(b => getOwnerDetails(b, myUserId).ownerInitials).filter(i => i !== "?")));

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      <MenuBar />
      
      {/* Header */}
      <div className="px-4 py-3 border-bottom d-flex align-items-center" style={{ backgroundColor: '#ffffff' }}>
        <button onClick={() => navigate(`/businesspage?tab=cadences`)} className="btn btn-link text-decoration-none p-0 text-dark fw-medium d-flex align-items-center" style={{ fontSize: '14px' }}>
          <ChevronLeft size={16} className="me-1" />
          Back to Cadences
        </button>
      </div>

      <div className="flex-grow-1 mx-auto w-100 p-5" style={{ maxWidth: '1200px', backgroundColor: '#ffffff' }}>
        
        {/* Top Title Section */}
        <div className="d-flex justify-content-between align-items-start mb-5">
          <div>
            <h1 className="fw-bold mb-2" style={{ fontSize: '28px', color: '#0f172a' }}>
              {cadence.name} · {moment.name}
            </h1>
            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '13px' }}>
              <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '10px', padding: '4px 8px' }}>CLOSED</span>
              <span>{formattedDate}</span>
              <span>·</span>
              <span>closed {formattedDate}</span>
              <span>·</span>
              <span>{closedBets.length} bets</span>
              <span>·</span>
              <span>{closedBets.length} outcomes captured</span>
            </div>
          </div>
          
          {/* Decider circles */}
          <div className="d-flex align-items-center" style={{ gap: '-8px' }}>
            {uniqueDeciders.map((initials, idx) => (
              <div 
                key={idx} 
                className="rounded-circle d-flex align-items-center justify-content-center border border-2 border-white shadow-sm"
                style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', color: '#0c71b9', fontSize: '12px', fontWeight: 'bold', marginLeft: idx > 0 ? '-8px' : '0' }}
              >
                {initials}
              </div>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="mb-2">
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>BETS TO REVIEW</span>
        </div>
        
        <div className="border rounded-3" style={{ backgroundColor: '#ffffff', overflow: 'hidden', borderColor: '#e2e8f0' }}>
          <div className="table-responsive">
            <table className="table mb-0 align-middle mom-bet-table">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>BET</th>
                  <th>DECIDER</th>
                  <th>STATUS</th>
                  <th>LEARNING</th>
                </tr>
              </thead>
            <tbody>
              {closedBets.map((bet, idx) => {
                const updateRecord = completedUpdates.find(cu => cu.bet_id === bet._id && cu.moment_id === moment._id);
                const { ownerName, ownerInitials } = getOwnerDetails(bet, myUserId);
                const status = updateRecord?.status || 'ACTIVE';
                const learning = updateRecord?.learning_state || 'Not started';
                
                const isExpanded = expandedBetId === bet._id;
                const hypotheses = Array.isArray(bet.hypotheses_tested) ? bet.hypotheses_tested.filter(h => h && h.trim() !== '') : [];

                return (
                  <React.Fragment key={bet._id}>
                  <tr onClick={() => setExpandedBetId(isExpanded ? null : bet._id)} style={{ cursor: 'pointer', transition: 'background-color 0.15s' }} className="hover-bg-light">
                    <td className="px-4 py-3 border-light" style={{ width: '50px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <ChevronLeft size={16} className="text-muted" style={{ transform: isExpanded ? 'rotate(-90deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
                        <span className="fw-bold" style={{ fontSize: '13px', color: '#0f172a' }}>{idx + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-light">
                      <span className="fw-bold" style={{ fontSize: '14px', color: '#0f172a' }}>
                        {bet.project_name || bet.initiative_name || bet.name || "Unnamed Bet"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-light">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}>
                          {ownerInitials}
                        </div>
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{ownerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-light">
                      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', borderRadius: '4px', padding: '4px 8px', ...getStatusBadgeStyle(status) }}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-light">
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        {learning.charAt(0).toUpperCase() + learning.slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan="5" className="px-4 py-4 border-light border-top-0">
                        <div style={{ maxWidth: '900px' }}>
                          
                          {/* 01 THE BET */}
                          <div className="mb-4">
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#0ea5e9' }}>01 THE BET</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>· from the Bet Ledger</span>
                            </div>
                            
                            <div className="mb-3 p-3 bg-white border rounded" style={{ borderColor: '#e2e8f0' }}>
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>HYPOTHESES TESTED</div>
                              {hypotheses.length > 0 ? (
                                <ul className="list-unstyled mb-0 ms-2">
                                  {hypotheses.map((h, i) => (
                                    <li key={i} className="d-flex align-items-start gap-2 mb-1">
                                      <span style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1' }}>•</span>
                                      <span style={{ fontSize: '13px', color: '#334155' }}>{h}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>None listed</div>
                              )}
                            </div>
                            
                            <div className="row g-3">
                              <div className="col-md-6">
                                <div className="p-3 bg-white border rounded h-100" style={{ borderColor: '#e2e8f0' }}>
                                  <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>CONTINUE IF</div>
                                  <div style={{ fontSize: '13px', color: '#334155' }}>{bet.continue_if || <span className="text-muted fst-italic">Not specified</span>}</div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="p-3 bg-white border rounded h-100" style={{ borderColor: '#e2e8f0' }}>
                                  <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>STOP IF</div>
                                  <div style={{ fontSize: '13px', color: '#334155' }}>{bet.stop_if || <span className="text-muted fst-italic">Not specified</span>}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />
                          
                          {/* 02 INSIGHTS */}
                          <div className="mb-4">
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#0ea5e9' }}>02 INSIGHTS</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>· as read at this Moment</span>
                            </div>
                            <div className="d-flex align-items-start gap-2" style={{ fontSize: '13px', color: '#334155' }}>
                              <CheckCircle2 size={16} fill="#22c55e" color="#ffffff" className="mt-1 flex-shrink-0" />
                              <span>{updateRecord?.additional_info || 'No flags — thesis holds, risks under control.'}</span>
                            </div>
                          </div>
                          
                          <hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />
                          
                          {/* 03 PRE-READ */}
                          <div className="mb-4">
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#0ea5e9' }}>03 PRE-READ</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>· by {ownerName} (decider)</span>
                            </div>
                            
                            <div className="mb-3 p-3 bg-white border rounded" style={{ borderColor: '#e2e8f0' }}>
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>WHAT CHANGED SINCE LAST REVIEW</div>
                              {bet.description ? (
                                <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>{bet.description}</p>
                              ) : (
                                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>— Nothing changed since last review</p>
                              )}
                            </div>
                            
                            <div className="mb-3 p-3 bg-white border rounded" style={{ borderColor: '#e2e8f0' }}>
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>RISKS &amp; BLOCKERS</div>
                              {bet.risks && bet.risks.length > 0 ? (
                                <ul className="list-unstyled mb-0 ms-1">
                                  {bet.risks.map((r, i) => (
                                    <li key={i} className="d-flex align-items-start gap-2 mb-1">
                                      <AlertTriangle size={14} color="#f59e0b" className="mt-1 flex-shrink-0" />
                                      <span style={{ fontSize: '13px', color: '#334155' }}>{r}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>— No risks or blockers</p>
                              )}
                            </div>
                            
                            <div className="p-3 bg-white border rounded" style={{ borderColor: '#e2e8f0' }}>
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '12px' }}>WHERE THE BET STANDS <span className="text-muted fw-normal">· ALSO IN THE TABLE ABOVE</span></div>
                              <div className="row g-4">
                                <div className="col-md-6">
                                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', borderRadius: '4px', padding: '4px 8px', ...getStatusBadgeStyle(bet.status || 'ACTIVE') }}>
                                    {(bet.status || 'ACTIVE').toUpperCase()}
                                  </span>
                                </div>
                                <div className="col-md-6">
                                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Learning State</div>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                                    {bet.learning_state ? (bet.learning_state.charAt(0).toUpperCase() + bet.learning_state.slice(1).toLowerCase()) : 'Not started'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />
                          
                          {/* 04 OUTCOME */}
                          <div className="mb-2">
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', color: '#0ea5e9' }}>04 OUTCOME</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>· captured at moment close</span>
                            </div>
                            
                            <div className="p-4 bg-white border rounded" style={{ borderColor: '#e2e8f0' }}>
                              
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '12px' }}>CONFIRMED STATUS</div>
                              <div className="d-flex flex-wrap gap-2 mb-4">
                                {['ACTIVE', 'AT RISK', 'PAUSED', 'KILLED', 'COMPLETED', 'SCALED'].map(s => {
                                  const isActive = status.toUpperCase() === s;
                                  return (
                                    <div key={s} style={{
                                      padding: '6px 16px',
                                      borderRadius: '20px',
                                      border: isActive ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                      backgroundColor: isActive ? '#f0f9ff' : '#ffffff',
                                      color: isActive ? '#0ea5e9' : '#94a3b8',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      {s.charAt(0) + s.slice(1).toLowerCase()}
                                    </div>
                                  )
                                })}
                              </div>
                              
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>WHY THIS CALL?</div>
                              <p style={{ fontSize: '13px', color: '#334155', marginBottom: '24px' }}>
                                {updateRecord?.status_reason || <span className="text-muted fst-italic">No reason provided.</span>}
                              </p>
                              
                              <hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />
                              
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '12px' }}>CONFIRMED LEARNING</div>
                              <div className="d-flex flex-wrap gap-2 mb-4">
                                {['Not started', 'Testing', 'Validated', 'Invalidated'].map(l => {
                                  const isActive = learning.toLowerCase() === l.toLowerCase();
                                  return (
                                    <div key={l} style={{
                                      padding: '6px 16px',
                                      borderRadius: '20px',
                                      border: isActive ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                      backgroundColor: isActive ? '#f0f9ff' : '#ffffff',
                                      color: isActive ? '#0ea5e9' : '#94a3b8',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      {l}
                                    </div>
                                  )
                                })}
                              </div>
                              
                              <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '8px' }}>WHY THIS CALL?</div>
                              <p style={{ fontSize: '13px', color: '#334155', marginBottom: '0' }}>
                                {updateRecord?.learning_reason || <span className="text-muted fst-italic">No reason provided.</span>}
                              </p>
                              
                            </div>
                            
                            {/* New Commitments */}
                            {Array.isArray(updateRecord?.new_commitments) && updateRecord.new_commitments.length > 0 && (
                              <div className="p-4 mt-3 bg-white border rounded" style={{ borderColor: '#e2e8f0' }}>
                                <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', color: '#475569', marginBottom: '16px' }}>NEW COMMITMENTS <span className="text-muted fw-normal">· DECISIONS WITH KNOWN ETAS</span></div>
                                <ul className="list-unstyled mb-0">
                                  {updateRecord.new_commitments.map((c, i) => (
                                    <li key={i} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: i < updateRecord.new_commitments.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                      <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: '4px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '50%' }}></div>
                                        <span style={{ fontSize: '13px', color: '#334155' }}>{c.text}</span>
                                      </div>
                                      <div className="d-flex align-items-center gap-4 text-muted" style={{ fontSize: '11px' }}>
                                        <span>{c.owner || 'Unassigned'}</span>
                                        <span style={{ width: '60px', textAlign: 'right' }}>{c.date ? new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'No date'}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                          </div>
                          
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
              {closedBets.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No bets were closed for this moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosedMomentPage;
