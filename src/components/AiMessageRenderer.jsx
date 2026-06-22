import React, { useMemo, useCallback, useState } from 'react';
import { parseAiMarkdown } from '../utils/markdownHelper';
import { Copy, Check } from 'lucide-react';

/**
 * AiMessageRenderer
 *
 * Renders a single AI assistant message with full markdown support.
 * - Parses markdown into sanitized HTML via parseAiMarkdown
 * - Detects and renders PUSHBACK markers with a styled header badge
 * - Provides a copy-to-clipboard button for assistant messages
 * - Memoized to avoid unnecessary re-renders in large message lists
 *
 * @param {object}  props
 * @param {string}  props.text      - Raw markdown text from AI response
 * @param {'assistant'|'user'} props.role - Message role
 * @param {boolean} [props.isTyping] - Show typing animation instead of content
 */
const AiMessageRenderer = React.memo(({ text, role, isTyping = false, isBare = false }) => {
  const [copied, setCopied] = useState(false);

  // ── PUSHBACK detection & prefix stripping ──────────────────────────────────
  const isPushback = useMemo(
    () => typeof text === 'string' && text.includes('PUSHBACK'),
    [text]
  );

  const cleanText = useMemo(() => {
    if (!text) return '';
    if (isPushback && role === 'assistant') {
      return text.replace(/.*?PUSHBACK\s*/s, '').trim();
    }
    return text;
  }, [text, isPushback, role]);

  // ── Markdown → HTML ────────────────────────────────────────────────────────
  const renderedHtml = useMemo(() => {
    if (role === 'user') return null; // User messages render as plain text
    return parseAiMarkdown(cleanText);
  }, [cleanText, role]);

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silent fail
    }
  }, [cleanText]);

  // ── Typing indicator ───────────────────────────────────────────────────────
  if (isTyping) {
    return (
      <div className="ai-msg__bubble ai-msg__bubble--typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    );
  }

  // ── User message — plain text only ─────────────────────────────────────────
  if (role === 'user') {
    return (
      <div className="ai-msg__bubble ai-msg__bubble--user">
        {cleanText}
      </div>
    );
  }

  // ── Assistant message — rendered markdown ───────────────────────────────────
  return (
    <div
      className={isBare ? "ai-msg__bare" : `ai-msg__bubble ai-msg__bubble--assistant${isPushback ? ' ai-msg__bubble--pushback' : ''}`}
    >
      {/* PUSHBACK badge */}
      {isPushback && (
        <div className="ai-pushback-header">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          PUSHBACK
        </div>
      )}

      {/* Rendered markdown content */}
      <div
        className="ai-md-prose"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Copy button — only shown when there is content */}
      {cleanText && (
        <button
          className={`ai-copy-btn${copied ? ' ai-copy-btn--done' : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy response'}
          aria-label="Copy response"
        >
          {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
          <span className="ai-copy-btn__label">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </div>
  );
});

AiMessageRenderer.displayName = 'AiMessageRenderer';

export default AiMessageRenderer;
