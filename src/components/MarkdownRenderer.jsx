import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import '../styles/academy.css';
import { ACADEMY_CONFIG } from '../utils/academyConfig';

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
// Helper to replace placeholders like {{SUPPORTED_LANGUAGES.SPANISH}}
const replacePlaceholders = (text) => {
    if (!text) return '';
    return text.replace(/\{\{([\w\.]+)\}\}/g, (match, path) => {
        const parts = path.split('.');
        let value = ACADEMY_CONFIG;
        for (const part of parts) {
            value = value && value[part] ? value[part] : undefined;
        }
        return value !== undefined ? value : match;
    });
};

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

        // Custom renderer for links to convert .md paths to React Router paths
        renderer.link = function (href, title, text) {
            // Check if this is a markdown file link
            if (href && href.endsWith('.md')) {
                // Convert relative markdown paths to React Router paths
                // Examples:
                // ./02-creating-an-account.md -> /academy/getting-started/creating-an-account
                // ../03-questionnaire/01-ai-assistant-overview.md -> /academy/questionnaire/ai-assistant-overview

                let routerPath = href;

                // Remove .md extension
                routerPath = routerPath.replace(/\.md$/, '');

                // Handle relative paths
                if (routerPath.startsWith('./')) {
                    // Same directory - remove ./ and extract filename
                    routerPath = routerPath.substring(2);
                } else if (routerPath.startsWith('../')) {
                    // Parent directory - keep for category extraction
                    routerPath = routerPath.substring(3);
                }

                // Extract category and article from path
                // Format: "category/##-article-name" -> category/article-name
                const parts = routerPath.split('/');
                let category, articleId;

                if (parts.length === 2) {
                    // Cross-category link: category/file
                    category = parts[0];
                    articleId = parts[1];
                } else {
                    // Same category link: just filename
                    // We need to infer category from current URL
                    // For now, extract from articleId which is passed to component
                    articleId = parts[0];
                    category = null; // Will be set dynamically
                }

                // Remove number prefix (01-, 02-, etc.) from article ID
                articleId = articleId.replace(/^\d+-/, '');

                // Map directory names to actual category IDs
                const categoryMap = {
                    '01-getting-started': 'getting-started',
                    '02-businesses': 'businesses',
                    '03-questionnaire': 'questionnaire',
                    '04-strategic-analysis': 'strategic-analysis',
                    '05-financial-analysis': 'financial-analysis',
                    '06-projects': 'projects',
                    '07-collaboration': 'collaboration'
                };

                if (category && categoryMap[category]) {
                    category = categoryMap[category];
                }

                // If no category in link, we need to find it from the article ID
                // This will be handled on the client side via findArticleById
                const finalHref = category ? `/academy/${category}/${articleId}` : `/academy/${articleId}`;

                const titleAttr = title ? `title="${DOMPurify.sanitize(title)}"` : '';
                const sanitizedText = DOMPurify.sanitize(text);

                return `<a href="${finalHref}" class="academy-internal-link" ${titleAttr}>${sanitizedText}</a>`;
            }

            // External links or non-.md links
            const titleAttr = title ? `title="${DOMPurify.sanitize(title)}"` : '';
            const sanitizedText = DOMPurify.sanitize(text);
            const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
            const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';

            return `<a href="${href}" ${titleAttr} ${targetAttr} class="academy-link">${sanitizedText}</a>`;
        };

        // Parse markdown with placeholder replacement
        const contentWithReplacements = replacePlaceholders(content);
        const rawHTML = marked(contentWithReplacements, { renderer });

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
