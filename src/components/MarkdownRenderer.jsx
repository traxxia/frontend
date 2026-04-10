import React, { useEffect, useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import '../styles/academy.css';
import { ACADEMY_CONFIG } from '../utils/academyConfig';
import { resolveAcademyPath, findArticleById } from '../utils/academyIndex';

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

// Configure marked options once
marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
    headerIds: true, // Add IDs to headers
    mangle: false // Don't escape autolinked email addresses
});

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

// Helper to transform "Next: [Title](Path)" into a premium card
const enhanceMarkdown = (text, currentCategoryId) => {
    if (!text) return '';

    // Match lines starting with "Next:" followed by a markdown link
    return text.replace(/^Next:\s+\[(.*?)\]\((.*?)\)/gm, (match, title, path) => {
        const resolvedPath = resolveAcademyPath(path, currentCategoryId);
        return `
<a href="${resolvedPath}" class="academy-next-step-card">
    <span class="next-step-label">Next Step</span>
    <div class="next-step-title">
        <span>${title}</span>
        <span class="next-step-icon">→</span>
    </div>
</a>`;
    });
};

const createCustomRenderer = (currentCategoryId) => {
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
        if (!quote || typeof quote !== 'string') {
            return `<blockquote>Error: Invalid blockquote content</blockquote>`;
        }

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
        if (text.includes('next-step-label')) {
            return `<a href="${href}" class="academy-next-step-card">${text}</a>`;
        }

        if (href && (href.endsWith('.md') || !href.startsWith('http'))) {
            const finalHref = resolveAcademyPath(href, currentCategoryId);
            const titleAttr = title ? `title="${DOMPurify.sanitize(title)}"` : '';
            const sanitizedText = DOMPurify.sanitize(text);

            return `<a href="${finalHref}" class="academy-internal-link" ${titleAttr}>${sanitizedText}</a>`;
        }

        const titleAttr = title ? `title="${DOMPurify.sanitize(title)}"` : '';
        const sanitizedText = DOMPurify.sanitize(text);
        const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
        const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';

        return `<a href="${href}" ${titleAttr} ${targetAttr} class="academy-link">${sanitizedText}</a>`;
    };

    return renderer;
};

const MarkdownRenderer = ({ content, articleId }) => {
    const [renderedHTML, setRenderedHTML] = useState('');
    const [tableOfContents, setTableOfContents] = useState([]);

    // Get current category from articleId if possible to provide context for relative links
    const [currentCategoryId, setCurrentCategoryId] = useState(null);

    useEffect(() => {
        if (articleId) {
            const article = findArticleById(articleId);
            if (article) {
                setCurrentCategoryId(article.categoryId);
            }
        }
    }, [articleId]);


    const { cleanHTML, toc } = useMemo(() => {
        if (!content) {
            return { cleanHTML: '', toc: [] };
        }

        const renderer = createCustomRenderer(currentCategoryId);
        const enhancedContent = enhanceMarkdown(replacePlaceholders(content), currentCategoryId);
        const rawHTML = marked(enhancedContent, { renderer });

        const tocArray = [];
        const htmlWithAnchors = rawHTML.replace(
            /<h([2-3])\s+id="([^"]+)">([^<]+)<\/h\1>/g,
            (match, level, id, text) => {
                tocArray.push({ level: parseInt(level), id, text });
                return `<h${level} id="${id}"><a href="#${id}" class="heading-anchor">${text}</a></h${level}>`;
            }
        );

        const clean = DOMPurify.sanitize(htmlWithAnchors, {
            ADD_ATTR: ['target', 'class', 'title'],
            ADD_TAGS: ['iframe']
        });

        return { cleanHTML: clean, toc: tocArray };
    }, [content, currentCategoryId]);

    useEffect(() => {
        setRenderedHTML(cleanHTML);
        setTableOfContents(toc);
    }, [cleanHTML, toc]);



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
