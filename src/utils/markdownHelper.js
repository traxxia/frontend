import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
});

// ─────────────────────────────────────────────────────────────────────────────
// AI Chat Markdown Parser
// Specialized for AI assistant output: handles all common patterns the LLM
// produces — code blocks, tables, nested lists, inline code, blockquotes,
// horizontal rules, and external links. Result is DOMPurify-sanitized.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a custom marked renderer tuned for AI chat bubble display.
 * @returns {marked.Renderer}
 */
const createAiRenderer = () => {
  const renderer = new marked.Renderer();

  // Headings — reduce visual weight inside a chat bubble
  renderer.heading = (text, level) => {
    const sizes = { 1: 'ai-md-h1', 2: 'ai-md-h2', 3: 'ai-md-h3', 4: 'ai-md-h4' };
    const cls = sizes[level] || 'ai-md-h4';
    return `<div class="${cls}">${text}</div>`;
  };

  // Paragraphs
  renderer.paragraph = (text) => {
    return `<p class="ai-md-p">${text}</p>`;
  };

  // Bold / strong
  renderer.strong = (text) => `<strong class="ai-md-strong">${text}</strong>`;

  // Italic / em
  renderer.em = (text) => `<em class="ai-md-em">${text}</em>`;

  // Inline code
  renderer.codespan = (code) => `<code class="ai-md-code-inline">${code}</code>`;

  // Fenced code blocks
  renderer.code = (code, language) => {
    const lang = language ? language.trim() : '';
    const langLabel = lang ? `<div class="ai-md-code-lang">${lang}</div>` : '';
    return `<div class="ai-md-code-block">${langLabel}<pre><code>${code}</code></pre></div>`;
  };

  // Blockquotes
  renderer.blockquote = (quote) => {
    return `<blockquote class="ai-md-blockquote">${quote}</blockquote>`;
  };

  // Horizontal rule
  renderer.hr = () => `<hr class="ai-md-hr" />`;

  // Bullet list
  renderer.list = (body, ordered, start) => {
    if (ordered) {
      const startAttr = start !== 1 ? ` start="${start}"` : '';
      return `<ol class="ai-md-ol"${startAttr}>${body}</ol>`;
    }
    return `<ul class="ai-md-ul">${body}</ul>`;
  };

  // List items
  renderer.listitem = (text) => {
    return `<li class="ai-md-li">${text}</li>`;
  };

  // Table wrapper
  renderer.table = (header, body) => {
    return `<div class="ai-md-table-wrap"><table class="ai-md-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
  };

  renderer.tablerow = (content) => `<tr>${content}</tr>`;

  renderer.tablecell = (content, flags) => {
    const tag = flags.header ? 'th' : 'td';
    const align = flags.align ? ` style="text-align:${flags.align}"` : '';
    return `<${tag} class="ai-md-td"${align}>${content}</${tag}>`;
  };

  // Links — open external URLs in a new tab safely
  renderer.link = (href, title, text) => {
    const titleAttr = title ? ` title="${DOMPurify.sanitize(title)}"` : '';
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a class="ai-md-link" href="${href}"${titleAttr}${targetAttr}>${text}</a>`;
  };

  // Images — render with a max-width constraint
  renderer.image = (href, title, text) => {
    const titleAttr = title ? ` title="${DOMPurify.sanitize(title)}"` : '';
    const alt = DOMPurify.sanitize(text || '');
    return `<img class="ai-md-img" src="${href}" alt="${alt}"${titleAttr} loading="lazy" />`;
  };

  return renderer;
};

/**
 * Parses AI assistant markdown output into sanitized HTML for display in
 * chat bubbles. Handles all LLM output patterns: headings, bold, italic,
 * inline code, fenced code blocks (with language label), GFM tables,
 * blockquotes, nested lists, horizontal rules, and links.
 *
 * @param {string} text - Raw markdown string from AI response.
 * @returns {string} Sanitized HTML string safe for dangerouslySetInnerHTML.
 */
export const parseAiMarkdown = (text) => {
  if (!text || typeof text !== 'string') return '';

  try {
    const renderer = createAiRenderer();
    const rawHtml = marked(text.trim(), { renderer });

    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target', 'rel', 'class', 'start', 'style'],
      ADD_TAGS: ['code', 'pre'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });
  } catch (error) {
    console.error('[parseAiMarkdown] Error:', error);
    // Graceful fallback: escape raw text and wrap in paragraph
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p class="ai-md-p">${escaped}</p>`;
  }
};

/**
 * Converts a Markdown string into HTML using the 'marked' library.
 * @param {string} markdown - The Markdown source string.
 * @returns {string} The parsed HTML output.
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return '';
  try {
    return marked(markdown);
  } catch (error) {
    console.error('Error parsing markdown to HTML:', error);
    return markdown;
  }
};

/**
 * Converts HTML content (produced by Tiptap editor) back to Markdown.
 * Uses native browser DOMParser for high reliability.
 * @param {string} html - HTML string.
 * @returns {string} Converted Markdown string.
 */
export const htmlToMarkdown = (html) => {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const walk = (node, context = {}) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // Handle ordered list
        if (tagName === 'ol') {
          let olMarkdown = '\n';
          let liIndex = 1;
          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'li') {
              const inner = walk(child, { ...context, listType: 'ol' });
              olMarkdown += `${liIndex}. ${inner.trim()}\n`;
              liIndex++;
            } else {
              const inner = walk(child, context);
              if (inner.trim()) {
                olMarkdown += `${inner}\n`;
              }
            }
          }
          return olMarkdown + '\n';
        }

        // Handle bullet list
        if (tagName === 'ul') {
          let ulMarkdown = '\n';
          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'li') {
              const inner = walk(child, { ...context, listType: 'ul' });
              ulMarkdown += `- ${inner.trim()}\n`;
            } else {
              const inner = walk(child, context);
              if (inner.trim()) {
                ulMarkdown += `${inner}\n`;
              }
            }
          }
          return ulMarkdown + '\n';
        }

        // Process children for other tags
        let childrenVal = '';
        for (let i = 0; i < node.childNodes.length; i++) {
          childrenVal += walk(node.childNodes[i], context);
        }

        switch (tagName) {
          case 'strong':
          case 'b':
            return childrenVal.trim() ? `**${childrenVal}**` : '';
          case 'em':
          case 'i':
            return childrenVal.trim() ? `*${childrenVal}*` : '';
          case 'h1':
            return `\n# ${childrenVal.trim()}\n\n`;
          case 'h2':
            return `\n## ${childrenVal.trim()}\n\n`;
          case 'h3':
            return `\n### ${childrenVal.trim()}\n\n`;
          case 'h4':
            return `\n#### ${childrenVal.trim()}\n\n`;
          case 'h5':
            return `\n##### ${childrenVal.trim()}\n\n`;
          case 'h6':
            return `\n###### ${childrenVal.trim()}\n\n`;
          case 'p':
            return childrenVal.trim() ? `\n${childrenVal.trim()}\n\n` : '';
          case 'br':
            return `\n`;
          case 'li':
            return childrenVal;
          default:
            return childrenVal;
        }
      }
      return '';
    };

    let markdown = '';
    for (let i = 0; i < doc.body.childNodes.length; i++) {
      markdown += walk(doc.body.childNodes[i]);
    }

    return markdown
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (error) {
    console.error('Error parsing HTML to markdown:', error);
    return html;
  }
};
