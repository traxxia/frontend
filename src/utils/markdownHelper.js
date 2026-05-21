import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
});

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
