import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import '../styles/academy.css';

/**
 * MarkdownRenderer Component
 * 
 * Renders markdown content with:
 * - Syntax highlighting
 * - Image lazy loading with placeholder fallback
 * - Auto-generated heading anchors
 * - Custom alert/callout styling
 * - Table support
 */
const MarkdownRenderer = ({ content, articleId }) => {
    const [renderedHTML, setRenderedHTML] = useState('');
    const [tableOfContents, setTableOfContents] = useState([]);

    useEffect(() => {
        if (!content) {
            setRenderedHTML('');
            setTableOfContents([]);
            return;
        }

        // Configure marked options
        marked.setOptions({
            gfm: true, // GitHub Flavored Markdown
            breaks: true, // Convert \n to <br>
            headerIds: true, // Add IDs to headers
            mangle: false // Don't escape autolinked email addresses
        });

        // Custom renderer
        const renderer = new marked.Renderer();

        // Custom renderer for images with ALT text placeholder support
        renderer.image = function (href, title, text) {
            if (href === 'ALT_TEXT_PLACEHOLDER') {
                return `
                    <div class="academy-image-placeholder">
                        <div class="placeholder-icon">📷</div>
                        <div class="placeholder-text">${DOMPurify.sanitize(text)}</div>
                    </div>
                `;
            }

            const titleAttr = title ? `title="${DOMPurify.sanitize(title)}"` : '';
            return `
                <img 
                    src="${href}" 
                    alt="${DOMPurify.sanitize(text)}" 
                    ${titleAttr}
                    loading="lazy"
                    class="academy-image"
                    onerror="this.onerror=null; this.src='/academy-assets/placeholders/placeholder-screenshot.svg';"
                />
            `;
        };

        // Custom renderer for blockquotes (for alerts/callouts)
        renderer.blockquote = function (quote) {
            // Safety check
            if (!quote || typeof quote !== 'string') {
                return `<blockquote>Error: Invalid blockquote content</blockquote>`;
            }

            // Check for GitHub-style alerts - quote is the HTML string
            const alertTypes = {
                '[!NOTE]': { class: 'alert-note', icon: 'ℹ️', label: 'Note' },
                '[!TIP]': { class: 'alert-tip', icon: '💡', label: 'Tip' },
                '[!IMPORTANT]': { class: 'alert-important', icon: '❗', label: 'Important' },
                '[!WARNING]': { class: 'alert-warning', icon: '⚠️', label: 'Warning' },
                '[!CAUTION]': { class: 'alert-caution', icon: '🚨', label: 'Caution' }
            };

            for (const [marker, config] of Object.entries(alertTypes)) {
                if (quote.includes(marker)) {
                    const content = quote.replace(marker, '').replace(/<\/?p>/g, '').trim();
                    return `
                        <div class="academy-alert ${config.class}">
                            <div class="alert-header">
                                <span class="alert-icon">${config.icon}</span>
                                <span class="alert-label">${config.label}</span>
                            </div>
                            <div class="alert-content">${content}</div>
                        </div>
                    `;
                }
            }

            return `<blockquote>${quote}</blockquote>`;
        };

        // Parse markdown
        const rawHTML = marked(content, { renderer });

        // Extract table of contents from headings
        const toc = [];
        const htmlWithAnchors = rawHTML.replace(
            /<h([2-3])\s+id="([^"]+)">([^<]+)<\/h\1>/g,
            (match, level, id, text) => {
                toc.push({ level: parseInt(level), id, text });
                return `<h${level} id="${id}"><a href="#${id}" class="heading-anchor">${text}</a></h${level}>`;
            }
        );

        // Sanitize HTML
        const clean = DOMPurify.sanitize(htmlWithAnchors, {
            ADD_ATTR: ['target'], // Allow target attribute for links
            ADD_TAGS: ['iframe'] // Allow iframes for potential future video embeds
        });

        setRenderedHTML(clean);
        setTableOfContents(toc);
    }, [content]);

    if (!content) {
        return (
            <div className="academy-content-empty">
                <p>No content available.</p>
            </div>
        );
    }

    return (
        <div className="academy-markdown-wrapper">
            {tableOfContents.length > 0 && (
                <div className="academy-toc">
                    <h4>On this page</h4>
                    <ul>
                        {tableOfContents.map((item) => (
                            <li key={item.id} className={`toc-level-${item.level}`}>
                                <a href={`#${item.id}`}>{item.text}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div
                className="academy-markdown-content"
                dangerouslySetInnerHTML={{ __html: renderedHTML }}
            />
        </div>
    );
};

export default MarkdownRenderer;
