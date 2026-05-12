import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import '../styles/observatory.css';
import {
  Telescope, BarChart3, MessageSquare, Globe, TrendingUp,
  ChevronDown, ChevronRight, Clock, Cpu, Zap, ExternalLink,
  Search, X
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// ── Helpers ──────────────────────────────────────────────────────────
function getAuthHeaders() {
  try {
    // Auth store is persisted to sessionStorage (see authStore.js)
    const raw = sessionStorage.getItem('auth-storage')
      || localStorage.getItem('auth-storage')
      || '{}';
    const token = JSON.parse(raw)?.state?.token || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ── Cost Estimation ─────────────────────────────────────────────────────
// Cost per 1M tokens in USD (Input, Output)
const COST_RATES = {
  'gpt-4o-mini': { input: 0.150, output: 0.600 },
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'claude-3-5-sonnet-20240620': { input: 3.00, output: 15.00 },
  'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama3-70b-8192': { input: 0.59, output: 0.79 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  'gemma2-9b-it': { input: 0.20, output: 0.20 },
  'sonar-pro': { input: 3.00, output: 15.00 },
  'sonar': { input: 1.00, output: 1.00 },
  'openai/gpt-oss-120b': { input: 0.60, output: 0.60 },
  // ── Gemini Family (Google) ──
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 3.50, output: 10.50 },
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-pro': { input: 3.50, output: 10.50 },
  'gemini-3.0-flash': { input: 0.05, output: 0.20 },
  'gemini-3-flash': { input: 0.05, output: 0.20 },
  'gemini-3.0-pro': { input: 2.50, output: 7.50 },
  'gemini': { input: 0.075, output: 0.30 }, // Catch-all fallback for Gemini
  // ── DeepSeek ──
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-coder': { input: 0.14, output: 0.28 },
  // ── GPT-5 Family ──
  'gpt-5-nano': { input: 0.05, output: 0.40 },
  'gpt-5-mini': { input: 0.25, output: 2.00 },
  'gpt-5': { input: 1.25, output: 10.00 },
  'gpt-5.1': { input: 1.25, output: 10.00 },
  'gpt-5.2': { input: 1.75, output: 14.00 },
  'gpt-5.2-pro': { input: 21.00, output: 168.00 },
};

function calculateCost(modelId, usage) {
  if (!modelId || !usage) return null;
  const model = modelId.toLowerCase().trim();
  
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (promptTokens + completionTokens);

  // Find rate entry
  let r = COST_RATES[model];
  if (!r) {
    const entry = Object.entries(COST_RATES).find(([k]) => model.includes(k) || k.includes(model));
    if (entry) r = entry[1];
  }

  if (!r) {
    console.warn(`[Observatory] No cost rate found for model: "${model}"`);
    return null;
  }

  // Fallback: If both are 0 but we have total_tokens, use the input rate as an estimate
  if (promptTokens === 0 && completionTokens === 0 && totalTokens > 0) {
    return (totalTokens / 1000000) * r.input;
  }
  
  return ((promptTokens / 1000000) * r.input) + ((completionTokens / 1000000) * r.output);
}

function CostBadge({ model, usage }) {
  const cost = calculateCost(model, usage);
  if (cost === null) {
    console.log(`[Observatory] Cost calculation returned null for model: ${model}`);
    return null;
  }
  
  if (cost === 0 && (usage?.prompt_tokens > 0 || usage?.completion_tokens > 0)) {
    console.warn(`[Observatory] Cost is 0 but tokens are present! Model: ${model}, Usage:`, usage);
  }
  return (
    <span className="obs-badge obs-badge--cost">
      ${cost < 0.01 ? cost.toFixed(5) : cost.toFixed(4)}
    </span>
  );
}

function ProviderBadge({ provider }) {
  const cls = `obs-badge obs-badge--provider-${(provider || 'unknown').toLowerCase()}`;
  return <span className={cls}>{provider || '—'}</span>;
}

function StatusBadge({ status }) {
  const cls = status === 'success' ? 'obs-badge obs-badge--success'
    : status === 'error' ? 'obs-badge obs-badge--error'
      : 'obs-badge obs-badge--quota';
  return <span className={cls}>{status || '—'}</span>;
}

function TokenDisplay({ usage }) {
  if (!usage) return <span className="obs-tokens__total">—</span>;
  return (
    <span className="obs-tokens">
      <span className="obs-tokens__in">↑{(usage.prompt_tokens || 0).toLocaleString()}</span>
      <span className="obs-tokens__sep">·</span>
      <span className="obs-tokens__out">↓{(usage.completion_tokens || 0).toLocaleString()}</span>
      <span className="obs-tokens__sep">=</span>
      <span className="obs-tokens__total">{(usage.total_tokens || 0).toLocaleString()} tokens</span>
    </span>
  );
}

function PromptBlock({ label, content, variant }) {
  if (!content) return null;
  return (
    <div className="obs-prompt-block">
      <div className={`obs-prompt-block__label obs-prompt-block__label--${variant}`}>
        {label}
      </div>
      <div className="obs-prompt-block__content">{content}</div>
    </div>
  );
}

// ── Prompt Inspector ──────────────────────────────────────────────────
function PromptInspector({ entry, onClose }) {
  if (!entry) return (
    <div className="obs-inspector">
      <div className="obs-empty">
        <Search size={32} />
        <span>Click any interaction to inspect prompts</span>
      </div>
    </div>
  );

  return (
    <div className="obs-inspector">
      <div className="obs-inspector__header">
        <div className="obs-inspector__title">
          <Telescope size={15} /> Prompt Inspector
        </div>
        <div className="obs-inspector__chips">
          <ProviderBadge provider={entry.llm_provider} />
          <span className="obs-badge obs-badge--stage">{entry.stage || entry.model || '—'}</span>
          <StatusBadge status={entry.status} />
          {onClose && (
            <button className="obs-export-btn" onClick={onClose} style={{ padding: '4px 8px' }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="obs-inspector__body">
        {/* Meta */}
        <div className="obs-meta-row">
          <span><Clock size={12} /> {fmtTime(entry.timestamp)}</span>
          <span style={{ color: 'var(--obs-text-dim)', fontStyle: 'italic' }}>{relativeTime(entry.timestamp)}</span>
          {entry.latency_ms && <span><Zap size={12} /> {entry.latency_ms.toLocaleString()}ms</span>}
          {entry.model && <span><Cpu size={12} /> {entry.model}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <TokenDisplay usage={entry.token_usage} />
          <CostBadge model={entry.model || entry.stage} usage={entry.token_usage} />
        </div>

        <PromptBlock label="🔧 System Prompt" content={entry.system_prompt} variant="system" />
        <PromptBlock label="💬 User Input" content={entry.user_prompt || entry.user_input} variant="user" />
        <PromptBlock label="🤖 LLM Response" content={entry.llm_response || entry.assistant_response} variant="response" />

        {/* Crawl sources */}
        {entry.crawl_details?.citations?.length > 0 && (
          <div className="obs-prompt-block">
            <div className="obs-prompt-block__label obs-prompt-block__label--crawl">
              🌐 Crawl Sources ({entry.crawl_details.citations.length})
            </div>
            <div className="obs-prompt-block__content">
              <ul className="obs-sources-list">
                {entry.crawl_details.citations.map((url, i) => (
                  <li key={i}>
                    <ExternalLink size={10} style={{ color: 'var(--obs-cyan)', flexShrink: 0 }} />
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────
function SessionCard({ session, onSelectEntry, selectedEntry }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadEntries = useCallback(async () => {
    if (entries.length || loading) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/superadmin/sessions/${session._id}`, { headers: getAuthHeaders() });
      setEntries(r.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [session._id, entries.length, loading]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadEntries();
  };

  return (
    <div className={`obs-card ${selectedEntry && entries.find(e => e._id === selectedEntry?._id) ? 'selected' : ''}`}>
      <div className="obs-card__header" onClick={toggle}>
        <div style={{ flex: 1 }}>
          <div className="obs-card__title">🏢 {session.business_name || 'Unnamed Business'}</div>
          <div className="obs-card__sub">
            <Clock size={10} />{fmtTime(session.first_call)}
            <span>·</span>
            <span>{session.call_count} calls</span>
            <span>·</span>
            <span>{(session.total_tokens || 0).toLocaleString()} tokens</span>
          </div>
        </div>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      {open && (
        <div className="obs-timeline">
          {loading && <div className="obs-empty" style={{ padding: '16px' }}><div className="obs-spinner" /></div>}
          {!loading && entries.map((e, i) => (
            <div
              key={e._id}
              className={`obs-timeline-item ${selectedEntry?._id === e._id ? 'active' : ''}`}
              onClick={() => onSelectEntry(e)}
            >
              <div className="obs-timeline-item__num">{i + 1}</div>
              <div className="obs-timeline-item__info">
                <div className="obs-timeline-item__stage">{e.stage}</div>
                <div className="obs-timeline-item__meta">
                  <ProviderBadge provider={e.llm_provider} /> · {(e.token_usage?.total_tokens || 0).toLocaleString()} tokens · <CostBadge model={e.model || e.stage} usage={e.token_usage} />
                </div>
              </div>
              <div className="obs-timeline-item__time">{relativeTime(e.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Analysis Tab ──────────────────────────────────────────────────────
function AnalysisTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/superadmin/sessions`, { headers: getAuthHeaders() })
      .then(r => setSessions(r.data.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="obs-body">
      {/* Sidebar */}
      <div className="obs-sidebar">
        <div className="obs-section-title">Sessions</div>
        {loading && <div className="obs-empty"><div className="obs-spinner" /></div>}
        {!loading && sessions.length === 0 && (
          <div className="obs-no-data">No sessions yet. Log in with the Observatory Account and create a business.</div>
        )}
        {sessions.map(s => (
          <SessionCard key={s._id} session={s} onSelectEntry={setSelectedEntry} selectedEntry={selectedEntry} />
        ))}
      </div>
      {/* Main */}
      <div className="obs-main">
        <PromptInspector entry={selectedEntry} onClose={selectedEntry ? () => setSelectedEntry(null) : null} />
      </div>
    </div>
  );
}

// ── Chat Log Card ─────────────────────────────────────────────────────
function ChatLogCard({ log, selected, onSelect }) {
  return (
    <div className={`obs-card ${selected ? 'selected' : ''}`} style={{ cursor: 'pointer' }}>
      <div className="obs-card__header" onClick={() => onSelect(log)}>
        <div style={{ flex: 1 }}>
          <div className="obs-card__title">
            {log.business_name || 'No Business'} · <span style={{ fontWeight: 400, fontSize: 12 }}>{log.page_context?.current_page || 'Unknown Page'}</span>
          </div>
          <div className="obs-card__sub">
            <Clock size={10} /> {fmtTime(log.timestamp)}
            <span style={{ color: 'var(--obs-text-dim)', fontStyle: 'italic' }}>{relativeTime(log.timestamp)}</span>
            <span>·</span>
            <span>{(log.token_usage?.total_tokens || 0).toLocaleString()} tokens</span>
            <span>·</span>
            <CostBadge model={log.model} usage={log.token_usage} />
            {log.latency_ms && <><span>·</span><span>{log.latency_ms}ms</span></>}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--obs-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            "{log.user_input || '—'}"
          </div>
        </div>
        <StatusBadge status={log.status} />
      </div>
    </div>
  );
}

// ── Chat Tab ──────────────────────────────────────────────────────────
function ChatTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({ business_id: '', page: '', date_from: '', date_to: '', status: '' });
  const [businesses, setBusinesses] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    axios.get(`${API}/api/superadmin/chat-logs?${params}`, { headers: getAuthHeaders() })
      .then(r => setLogs(r.data.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, []);

  // Derive businesses from loaded logs for filter dropdown
  useEffect(() => {
    const biz = {};
    logs.forEach(l => { if (l.business_id && l.business_name) biz[l.business_id] = l.business_name; });
    setBusinesses(Object.entries(biz).map(([id, name]) => ({ id, name })));
  }, [logs]);

  return (
    <div className="obs-body" style={{ display: 'flex' }}>

      {/* Main: list + inspector split view */}
      <div className="obs-main" style={{ flex: 1, display: 'grid', gridTemplateColumns: selectedLog ? '350px 1fr' : '1fr', gap: 20, overflow: 'hidden', padding: 0 }}>

        {/* Left: Chat List */}
        <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading && <div className="obs-empty"><div className="obs-spinner" /></div>}
          {!loading && logs.length === 0 && (
            <div className="obs-empty">
              <MessageSquare size={32} />
              <span>No chat logs yet. Use the AI Assistant on the Observatory Account.</span>
            </div>
          )}
          {!loading && logs.map(log => (
            <ChatLogCard key={log._id} log={log} selected={selectedLog?._id === log._id} onSelect={setSelectedLog} />
          ))}
        </div>

        {/* Right: Inspector */}
        {selectedLog && (
          <div style={{ overflowY: 'auto', padding: '20px 20px 20px 0' }}>
            <PromptInspector
              entry={{
                ...selectedLog,
                system_prompt: selectedLog.system_prompt,
                user_input: selectedLog.user_input,
                llm_response: selectedLog.assistant_response,
                stage: selectedLog.page_context?.current_page,
                model: selectedLog.model,
              }}
              onClose={() => setSelectedLog(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Removed old cost estimation location

// ── Stats Tab ─────────────────────────────────────────────────────────
function StatsTab() {
  const [modelStats, setModelStats] = useState([]);
  const [stageStats, setStageStats] = useState([]);
  const [chatStats, setChatStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/superadmin/stats/models`, { headers: getAuthHeaders() }),
      axios.get(`${API}/api/superadmin/stats/stages`, { headers: getAuthHeaders() }),
      axios.get(`${API}/api/superadmin/stats/chat-usage`, { headers: getAuthHeaders() }),
    ]).then(([m, s, c]) => {
      setModelStats(m.data.data || []);
      setStageStats(s.data.data || []);
      setChatStats(c.data.data || null);
    }).catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="obs-empty"><div className="obs-spinner" /></div>;

  // Aggregated calculations
  const totalCalls = modelStats.reduce((acc, curr) => acc + (curr.call_count || 0), 0);
  const totalTokens = modelStats.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
  const maxStageCount = Math.max(...stageStats.map(s => s.count || 0), 1);
  const maxModelTokens = Math.max(...modelStats.map(m => m.total_tokens || 0), 1);

  return (
    <div className="obs-main" style={{ width: '100%', padding: '24px 32px' }}>

      {/* Top Level KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>

        {/* KPI 1 */}
        <div className="obs-card" style={{ padding: 20, border: '1px solid var(--obs-border-strong)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--obs-accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={14} /> Total API Calls
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--obs-text)' }}>
            {totalCalls.toLocaleString()}
          </div>
        </div>

        {/* KPI 2 */}
        <div className="obs-card" style={{ padding: 20, border: '1px solid var(--obs-border-strong)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--obs-green)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} /> Total Tokens Used
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--obs-text)' }}>
            {totalTokens.toLocaleString()}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="obs-card" style={{ padding: 20, border: '1px solid var(--obs-border-strong)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--obs-cyan)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={14} /> AI Chat Turns
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--obs-text)' }}>
            {(chatStats?.totals?.total_turns || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>

        {/* Model usage */}
        <div>
          <div className="obs-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Cpu size={14} color="var(--obs-accent)" /> Model Token Distribution
          </div>
          <div className="obs-card">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--obs-border)', background: 'var(--obs-card-hover)' }}>
                  {['Model', 'Usage Share', 'Est. Cost', 'Latency'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--obs-text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modelStats.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, color: 'var(--obs-text-dim)', textAlign: 'center' }}>No data yet</td></tr>
                )}
                {modelStats.map((r, i) => {
                  const pct = Math.max((r.total_tokens / maxModelTokens) * 100, 2);
                  const cost = calculateCost(r._id?.model, r);
                  
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--obs-border)', transition: 'background 0.2s' }} className="obs-tr-hover">
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ProviderBadge provider={r._id?.provider} />
                          <span style={{ color: 'var(--obs-text)', fontWeight: 500 }}>{r._id?.model || '—'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--obs-text-muted)', marginTop: 4 }}>{r.call_count} calls</div>
                      </td>
                      <td style={{ padding: '14px 16px', width: '30%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--obs-accent)', fontWeight: 600 }}>{r.total_tokens.toLocaleString()} tokens</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--obs-prompt-bg)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 3 }} />
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {cost !== null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ color: 'var(--obs-green)', fontWeight: 600 }}>${cost.toFixed(4)} total</span>
                            <span style={{ fontSize: 11, color: 'var(--obs-text-muted)' }}>${(cost / r.call_count).toFixed(5)} / call</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--obs-text-dim)', fontSize: 11 }}>Unknown Pricing</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--obs-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {r.avg_latency_ms ? `${Math.round(r.avg_latency_ms)}ms` : '—'}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stage breakdown */}
        <div>
          <div className="obs-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <BarChart3 size={14} color="var(--obs-green)" /> ML Stage Activity
          </div>
          <div className="obs-card">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--obs-border)', background: 'var(--obs-card-hover)' }}>
                  {['Stage', 'Volume', 'Avg Tokens'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--obs-text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stageStats.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 24, color: 'var(--obs-text-dim)', textAlign: 'center' }}>No data yet</td></tr>
                )}
                {stageStats.map((r, i) => {
                  const pct = Math.max((r.count / maxStageCount) * 100, 2);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--obs-border)' }}>
                      <td style={{ padding: '14px 16px' }}><span className="obs-badge obs-badge--stage">{r._id}</span></td>
                      <td style={{ padding: '14px 16px', width: '35%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--obs-green)', fontWeight: 600 }}>{r.count} calls</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--obs-prompt-bg)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 3 }} />
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--obs-text-muted)' }}>{r.avg_tokens ? Math.round(r.avg_tokens).toLocaleString() : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Chat usage (full width bottom) */}
      {chatStats?.top_pages?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="obs-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MessageSquare size={14} color="var(--obs-purple)" /> Top AI Chat Contexts
          </div>
          <div className="obs-card">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--obs-border)', background: 'var(--obs-card-hover)' }}>
                  {['Page Context', 'Chat Sessions', 'Avg Tokens / Turn'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: 'var(--obs-text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chatStats.top_pages.map((p, i) => (
                  <tr key={i} style={{ borderBottom: i === chatStats.top_pages.length - 1 ? 'none' : '1px solid var(--obs-border)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--obs-text)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Globe size={12} color="var(--obs-cyan)" /> {p._id || 'Global'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--obs-purple)', fontWeight: 700 }}>{p.chat_count}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--obs-text-muted)' }}>{p.avg_tokens ? Math.round(p.avg_tokens).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'analysis', label: 'Analysis Sessions', icon: <BarChart3 size={14} /> },
  { id: 'chat', label: 'AI Chat', icon: <MessageSquare size={14} /> },
  { id: 'stats', label: 'Usage Stats', icon: <TrendingUp size={14} /> },
];

const ObservatoryPage = () => {
  const [tab, setTab] = useState('analysis');

  return (
    <div className="observatory-page">
      <MenuBar currentPage="OBSERVATORY" />

      {/* Header */}
      <div className="observatory-header">
        <div className="observatory-header__brand">
          <div className="observatory-header__icon">
            <Telescope size={16} color="#fff" />
          </div>
          AI Observatory
          <span style={{ fontSize: 11, color: 'var(--obs-text-muted)', fontWeight: 400, marginLeft: 4 }}>
            Observatory Account Activity
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="obs-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`obs-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'analysis' && <AnalysisTab />}
      {tab === 'chat' && <ChatTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
};

export default ObservatoryPage;
