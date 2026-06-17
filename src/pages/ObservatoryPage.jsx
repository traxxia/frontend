import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import '../styles/observatory.css';
import { Telescope, BarChart3, MessageSquare, Globe, TrendingUp, ChevronDown, ChevronRight, Clock, Cpu, Zap, ExternalLink, Search, X } from 'lucide-react';
const API = import.meta.env.VITE_BACKEND_URL;
function getAuthHeaders() {
  try {
    const raw = sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage') || '{}';
    const token = JSON.parse(raw)?.state?.token || '';
    return token ? {
      Authorization: `Bearer ${token}`
    } : {};
  } catch {
    return {};
  }
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
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
const COST_RATES = {
  'gpt-4o-mini': {
    input: 0.150,
    output: 0.600
  },
  'gpt-4o': {
    input: 5.00,
    output: 15.00
  },
  'claude': {
    input: 3.00,
    output: 15.00
  },
  'claude-sonnet-4-6': {
    input: 3.00,
    output: 15.00
  },
  'claude-opus-4-7': {
    input: 15.00,
    output: 75.00
  },
  'claude-haiku-4-5': {
    input: 0.25,
    output: 1.25
  },
  'llama-3.1-8b-instant': {
    input: 0.05,
    output: 0.08
  },
  'llama-3.1-70b-versatile': {
    input: 0.59,
    output: 0.79
  },
  'llama-3.3-70b-versatile': {
    input: 0.59,
    output: 0.79
  },
  'llama3-70b-8192': {
    input: 0.59,
    output: 0.79
  },
  'mixtral-8x7b-32768': {
    input: 0.24,
    output: 0.24
  },
  'gemma2-9b-it': {
    input: 0.20,
    output: 0.20
  },
  'sonar-pro': {
    input: 3.00,
    output: 15.00
  },
  'sonar': {
    input: 1.00,
    output: 1.00
  },
  'openai/gpt-oss-120b': {
    input: 0.60,
    output: 0.60
  },
  'gpt-oss-120b': {
    input: 0.60,
    output: 0.60
  },
  'gemini-3.5-flash': {
    input: 0.05,
    output: 0.20
  },
  'gemini-3.1-pro': {
    input: 2.50,
    output: 7.50
  },
  'gemini-3.1-pro-preview': {
    input: 2.50,
    output: 7.50
  },
  'gemini': {
    input: 0.075,
    output: 0.30
  }
};
function calculateCost(modelId, usage) {
  if (!modelId || !usage) return null;
  const model = modelId.toLowerCase().trim();
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || promptTokens + completionTokens;
  let r = COST_RATES[model];
  if (!r) {
    const entry = Object.entries(COST_RATES).find(([k]) => model.includes(k) || k.includes(model));
    if (entry) r = entry[1];
  }
  if (!r) {
    console.warn(`[Observatory] No cost rate found for model: "${model}"`);
    return null;
  }
  if (promptTokens === 0 && completionTokens === 0 && totalTokens > 0) {
    return totalTokens / 1000000 * r.input;
  }
  return promptTokens / 1000000 * r.input + completionTokens / 1000000 * r.output;
}
function CostBadge({
  model,
  usage
}) {
  const cost = calculateCost(model, usage);
  if (cost === null) {
    return null;
  }
  if (cost === 0 && (usage?.prompt_tokens > 0 || usage?.completion_tokens > 0)) {
    console.warn(`[Observatory] Cost is 0 but tokens are present! Model: ${model}, Usage:`, usage);
  }
  return <span className="obs-badge obs-badge--cost">
    ${cost < 0.01 ? cost.toFixed(5) : cost.toFixed(4)}
  </span>;
}
function ProviderBadge({
  provider
}) {
  const cls = `obs-badge obs-badge--provider-${(provider || 'unknown').toLowerCase()}`;
  return <span className={cls}>{provider || '—'}</span>;
}
function StatusBadge({
  status
}) {
  const cls = status === 'success' ? 'obs-badge obs-badge--success' : status === 'error' ? 'obs-badge obs-badge--error' : 'obs-badge obs-badge--quota';
  return <span className={cls}>{status || '—'}</span>;
}
function TokenDisplay({
  usage
}) {
  if (!usage) return <span className="obs-tokens__total">—</span>;
  return <span className="obs-tokens">
    <span className="obs-tokens__in">↑{(usage.prompt_tokens || 0).toLocaleString()}</span>
    <span className="obs-tokens__sep">·</span>
    <span className="obs-tokens__out">↓{(usage.completion_tokens || 0).toLocaleString()}</span>
    <span className="obs-tokens__sep">=</span>
    <span className="obs-tokens__total">{(usage.total_tokens || 0).toLocaleString()} tokens</span>
  </span>;
}
function PromptBlock({
  label,
  content,
  variant
}) {
  if (!content) return null;
  return <div className="obs-prompt-block">
    <div className={`obs-prompt-block__label obs-prompt-block__label--${variant}`}>
      {label}
    </div>
    <div className="obs-prompt-block__content">{content}</div>
  </div>;
}
function PromptInspector({
  entry,
  onClose
}) {
  if (!entry) return <div className="obs-inspector">
    <div className="obs-empty">
      <Search size={32} />
      <span>Click any interaction to inspect prompts</span>
    </div>
  </div>;
  return <div className="obs-inspector">
    <div className="obs-inspector__header">
      <div className="obs-inspector__title">
        <Telescope size={15} /> Prompt Inspector
      </div>
      <div className="obs-inspector__chips">
        <ProviderBadge provider={entry.llm_provider} />
        <span className="obs-badge obs-badge--stage">{entry.stage || entry.model || '—'}</span>
        <StatusBadge status={entry.status} />
        {onClose && <button className="obs-export-btn observatory-page--s1" onClick={onClose}>
          <X size={13} />
        </button>}
      </div>
    </div>
    <div className="obs-inspector__body">
      { }
      <div className="obs-meta-row">
        <span><Clock size={12} /> {fmtTime(entry.timestamp)}</span>
        <span className="observatory-page--s2">{relativeTime(entry.timestamp)}</span>
        {entry.latency_ms && <span><Zap size={12} /> {entry.latency_ms.toLocaleString()}ms</span>}
        {entry.model && <span><Cpu size={12} /> {entry.model}</span>}
      </div>
      <div className="observatory-page--s3">
        <TokenDisplay usage={entry.token_usage} />
        <CostBadge model={entry.model || entry.stage} usage={entry.token_usage} />
      </div>

      <PromptBlock label="🔧 System Prompt" content={entry.system_prompt} variant="system" />
      <PromptBlock label="💬 User Input" content={entry.user_prompt || entry.user_input} variant="user" />
      <PromptBlock label="🤖 LLM Response" content={entry.llm_response || entry.assistant_response} variant="response" />

      { }
      {entry.crawl_details?.citations?.length > 0 && <div className="obs-prompt-block">
        <div className="obs-prompt-block__label obs-prompt-block__label--crawl">
          🌐 Crawl Sources ({entry.crawl_details.citations.length})
        </div>
        <div className="obs-prompt-block__content">
          <ul className="obs-sources-list">
            {entry.crawl_details.citations.map((url, i) => <li key={i}>
              <ExternalLink size={10} className="observatory-page--s4" />
              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
            </li>)}
          </ul>
        </div>
      </div>}
    </div>
  </div>;
}
function SessionCard({
  session,
  onSelectEntry,
  selectedEntry
}) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadEntries = useCallback(async () => {
    if (entries.length || loading) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/superadmin/sessions/${session._id}`, {
        headers: getAuthHeaders()
      });
      setEntries(r.data.data || []);
    } catch { } finally {
      setLoading(false);
    }
  }, [session._id, entries.length, loading]);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadEntries();
  };
  return <div className={`obs-card ${selectedEntry && entries.find(e => e._id === selectedEntry?._id) ? 'selected' : ''}`}>
    <div className="obs-card__header" onClick={toggle}>
      <div className="observatory-page--s5">
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

    {open && <div className="obs-timeline">
      {loading && <div className="obs-empty observatory-page--s6"><div className="obs-spinner" /></div>}
      {!loading && [...entries].reverse().map((e, i) => <div key={e._id} className={`obs-timeline-item ${selectedEntry?._id === e._id ? 'active' : ''}`} onClick={() => onSelectEntry(e)}>
        <div className="obs-timeline-item__num">{entries.length - i}</div>
        <div className="obs-timeline-item__info">
          <div className="obs-timeline-item__stage">{e.stage}</div>
          <div className="obs-timeline-item__meta">
            <ProviderBadge provider={e.llm_provider} /> · {(e.token_usage?.total_tokens || 0).toLocaleString()} tokens · <CostBadge model={e.model || e.stage} usage={e.token_usage} />
          </div>
        </div>
        <div className="obs-timeline-item__time">{relativeTime(e.timestamp)}</div>
      </div>)}
    </div>}
  </div>;
}
function AnalysisTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  useEffect(() => {
    axios.get(`${API}/api/superadmin/sessions`, {
      headers: getAuthHeaders()
    }).then(r => setSessions(r.data.data || [])).catch(() => { }).finally(() => setLoading(false));
  }, []);
  return <div className="obs-body">
    { }
    <div className="obs-sidebar">
      <div className="obs-section-title">Sessions</div>
      {loading && <div className="obs-empty"><div className="obs-spinner" /></div>}
      {!loading && sessions.length === 0 && <div className="obs-no-data">No sessions yet. Log in with the Observatory Account and create a business.</div>}
      {sessions.map(s => <SessionCard key={s._id} session={s} onSelectEntry={setSelectedEntry} selectedEntry={selectedEntry} />)}
    </div>
    { }
    <div className="obs-main">
      <PromptInspector entry={selectedEntry} onClose={selectedEntry ? () => setSelectedEntry(null) : null} />
    </div>
  </div>;
}
function ChatLogCard({
  log,
  selected,
  onSelect
}) {
  return <div className={`obs-card ${selected ? 'selected' : ''} observatory-page--s7`}>
    <div className="obs-card__header" onClick={() => onSelect(log)}>
      <div className="observatory-page--s5">
        <div className="obs-card__title">
          {log.business_name || 'No Business'} · <span className="observatory-page--s8">{log.page_context?.current_page || 'Unknown Page'}</span>
        </div>
        <div className="obs-card__sub">
          <Clock size={10} /> {fmtTime(log.timestamp)}
          <span className="observatory-page--s2">{relativeTime(log.timestamp)}</span>
          <span>·</span>
          <span>{(log.token_usage?.total_tokens || 0).toLocaleString()} tokens</span>
          <span>·</span>
          <CostBadge model={log.model} usage={log.token_usage} />
          {log.latency_ms && <><span>·</span><span>{log.latency_ms}ms</span></>}
        </div>
        <div className="observatory-page--s9">
          "{log.user_input || '—'}"
        </div>
      </div>
      <StatusBadge status={log.status} />
    </div>
  </div>;
}
function ChatTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    business_id: '',
    page: '',
    date_from: '',
    date_to: '',
    status: ''
  });
  const [businesses, setBusinesses] = useState([]);
  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    axios.get(`${API}/api/superadmin/chat-logs?${params}`, {
      headers: getAuthHeaders()
    }).then(r => setLogs(r.data.data || [])).catch(() => { }).finally(() => setLoading(false));
  }, [filters]);
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const biz = {};
    logs.forEach(l => {
      if (l.business_id && l.business_name) biz[l.business_id] = l.business_name;
    });
    setBusinesses(Object.entries(biz).map(([id, name]) => ({
      id,
      name
    })));
  }, [logs]);
  return <div className="obs-body observatory-page--s10">

    { }
    <div className="obs-main observatory-page--s11" style={{
      gridTemplateColumns: selectedLog ? '350px 1fr' : '1fr'
    }}>

      { }
      <div className="observatory-page--s12">
        {loading && <div className="obs-empty"><div className="obs-spinner" /></div>}
        {!loading && logs.length === 0 && <div className="obs-empty">
          <MessageSquare size={32} />
          <span>No chat logs yet. Use the AI Assistant on the Observatory Account.</span>
        </div>}
        {!loading && logs.map(log => <ChatLogCard key={log._id} log={log} selected={selectedLog?._id === log._id} onSelect={setSelectedLog} />)}
      </div>

      { }
      {selectedLog && <div className="observatory-page--s13">
        <PromptInspector entry={{
          ...selectedLog,
          system_prompt: selectedLog.system_prompt,
          user_input: selectedLog.user_input,
          llm_response: selectedLog.assistant_response,
          stage: selectedLog.page_context?.current_page,
          model: selectedLog.model
        }} onClose={() => setSelectedLog(null)} />
      </div>}
    </div>
  </div>;
}
function StatsTab() {
  const [modelStats, setModelStats] = useState([]);
  const [stageStats, setStageStats] = useState([]);
  const [chatStats, setChatStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([axios.get(`${API}/api/superadmin/stats/models`, {
      headers: getAuthHeaders()
    }), axios.get(`${API}/api/superadmin/stats/stages`, {
      headers: getAuthHeaders()
    }), axios.get(`${API}/api/superadmin/stats/chat-usage`, {
      headers: getAuthHeaders()
    })]).then(([m, s, c]) => {
      setModelStats(m.data.data || []);
      setStageStats(s.data.data || []);
      setChatStats(c.data.data || null);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="obs-empty"><div className="obs-spinner" /></div>;
  const totalCalls = modelStats.reduce((acc, curr) => acc + (curr.call_count || 0), 0);
  const totalTokens = modelStats.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
  const maxStageCount = Math.max(...stageStats.map(s => s.count || 0), 1);
  const maxModelTokens = Math.max(...modelStats.map(m => m.total_tokens || 0), 1);
  return <div className="obs-main observatory-page--s14">

    { }
    <div className="observatory-page--s15">

      { }
      <div className="obs-card observatory-page--s16">
        <div className="observatory-page--s17">
          <Cpu size={14} /> Total API Calls
        </div>
        <div className="observatory-page--s18">
          {totalCalls.toLocaleString()}
        </div>
      </div>

      { }
      <div className="obs-card observatory-page--s16">
        <div className="observatory-page--s19">
          <Zap size={14} /> Total Tokens Used
        </div>
        <div className="observatory-page--s18">
          {totalTokens.toLocaleString()}
        </div>
      </div>

      { }
      <div className="obs-card observatory-page--s16">
        <div className="observatory-page--s20">
          <MessageSquare size={14} /> AI Chat Turns
        </div>
        <div className="observatory-page--s18">
          {(chatStats?.totals?.total_turns || 0).toLocaleString()}
        </div>
      </div>
    </div>

    <div className="observatory-page--s21">

      { }
      <div>
        <div className="obs-section-title observatory-page--s22">
          <Cpu size={14} color="var(--obs-accent)" /> Model Token Distribution
        </div>
        <div className="obs-card">
          <table className="observatory-page--s23">
            <thead>
              <tr className="observatory-page--s24">
                {['Model', 'Usage Share', 'Est. Cost', 'Latency'].map(h => <th key={h} className="observatory-page--s25">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {modelStats.length === 0 && <tr><td colSpan={4} className="observatory-page--s26">No data yet</td></tr>}
              {modelStats.map((r, i) => {
                const pct = Math.max(r.total_tokens / maxModelTokens * 100, 2);
                const cost = calculateCost(r._id?.model, r);
                return <tr key={i} className="obs-tr-hover observatory-page--s27">
                  <td className="observatory-page--s28">
                    <div className="observatory-page--s29">
                      <ProviderBadge provider={r._id?.provider} />
                      <span className="observatory-page--s30">{r._id?.model || '—'}</span>
                    </div>
                    <div className="observatory-page--s31">{r.call_count} calls</div>
                  </td>
                  <td className="observatory-page--s32">
                    <div className="observatory-page--s33">
                      <span className="observatory-page--s34">{r.total_tokens.toLocaleString()} tokens</span>
                    </div>
                    <div className="observatory-page--s35">
                      <div style={{
                        width: `${pct}%`
                      }} className="observatory-page--s36" />
                    </div>
                  </td>
                  <td className="observatory-page--s28">
                    {cost !== null ? <div className="observatory-page--s37">
                      <span className="observatory-page--s38">${cost.toFixed(4)} total</span>
                      <span className="observatory-page--s39">${(cost / r.call_count).toFixed(5)} / call</span>
                    </div> : <span className="observatory-page--s40">Unknown Pricing</span>}
                  </td>
                  <td className="observatory-page--s41">
                    <div className="observatory-page--s42">
                      <Clock size={12} /> {r.avg_latency_ms ? `${Math.round(r.avg_latency_ms)}ms` : '—'}
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      { }
      <div>
        <div className="obs-section-title observatory-page--s22">
          <BarChart3 size={14} color="var(--obs-green)" /> ML Stage Activity
        </div>
        <div className="obs-card">
          <table className="observatory-page--s23">
            <thead>
              <tr className="observatory-page--s24">
                {['Stage', 'Volume', 'Avg Tokens'].map(h => <th key={h} className="observatory-page--s25">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {stageStats.length === 0 && <tr><td colSpan={3} className="observatory-page--s26">No data yet</td></tr>}
              {stageStats.map((r, i) => {
                const pct = Math.max(r.count / maxStageCount * 100, 2);
                return <tr key={i} className="observatory-page--s43">
                  <td className="observatory-page--s28"><span className="obs-badge obs-badge--stage">{r._id}</span></td>
                  <td className="observatory-page--s44">
                    <div className="observatory-page--s33">
                      <span className="observatory-page--s38">{r.count} calls</span>
                    </div>
                    <div className="observatory-page--s35">
                      <div style={{
                        width: `${pct}%`
                      }} className="observatory-page--s45" />
                    </div>
                  </td>
                  <td className="observatory-page--s41">{r.avg_tokens ? Math.round(r.avg_tokens).toLocaleString() : '—'}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    { }
    {chatStats?.top_pages?.length > 0 && <div className="observatory-page--s46">
      <div className="obs-section-title observatory-page--s22">
        <MessageSquare size={14} color="var(--obs-purple)" /> Top AI Chat Contexts
      </div>
      <div className="obs-card">
        <table className="observatory-page--s23">
          <thead>
            <tr className="observatory-page--s24">
              {['Page Context', 'Chat Sessions', 'Avg Tokens / Turn'].map(h => <th key={h} className="observatory-page--s47">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {chatStats.top_pages.map((p, i) => <tr key={i} style={{
              borderBottom: i === chatStats.top_pages.length - 1 ? 'none' : '1px solid var(--obs-border)'
            }}>
              <td className="observatory-page--s48">
                <div className="observatory-page--s29">
                  <Globe size={12} color="var(--obs-cyan)" /> {p._id || 'Global'}
                </div>
              </td>
              <td className="observatory-page--s49">{p.chat_count}</td>
              <td className="observatory-page--s41">{p.avg_tokens ? Math.round(p.avg_tokens).toLocaleString() : '—'}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>}
  </div>;
}
const TABS = [{
  id: 'analysis',
  label: 'Analysis Sessions',
  icon: <BarChart3 size={14} />
}, {
  id: 'chat',
  label: 'AI Chat',
  icon: <MessageSquare size={14} />
}, {
  id: 'stats',
  label: 'Usage Stats',
  icon: <TrendingUp size={14} />
}];
const ObservatoryPage = () => {
  const [tab, setTab] = useState('analysis');
  return <div className="observatory-page">
    <MenuBar currentPage="OBSERVATORY" />

    { }
    <div className="observatory-header">
      <div className="observatory-header__brand">
        <div className="observatory-header__icon">
          <Telescope size={16} color="#fff" />
        </div>
        AI Observatory
        <span className="observatory-page--s50">
          Observatory Account Activity
        </span>
      </div>
    </div>

    { }
    <div className="obs-tabs">
      {TABS.map(t => <button key={t.id} className={`obs-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
        {t.icon} {t.label}
      </button>)}
    </div>

    { }
    {tab === 'analysis' && <AnalysisTab />}
    {tab === 'chat' && <ChatTab />}
    {tab === 'stats' && <StatsTab />}
  </div>;
};
export default ObservatoryPage;
