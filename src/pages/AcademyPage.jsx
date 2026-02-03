import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AcademyNavigation from '../components/AcademyNavigation';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AcademyFeedback from '../components/AcademyFeedback';
import { findArticleById, findCategoryById, getBreadcrumbs } from '../utils/academyIndex';
import '../styles/academy.css';

/**
 * AcademyPage Component
 * 
 * Main page for Traxxia Academy documentation
 * - Displays markdown content for selected articles
 * - Shows welcome page when no article selected
 * - Includes breadcrumb navigation
 * - Mobile responsive with hamburger menu
 */
const AcademyPage = () => {
    const { category, article } = useParams();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentArticle, setCurrentArticle] = useState(null);

    useEffect(() => {
        if (!category || !article) {
            // Show welcome/home page
            setCurrentArticle(null);
            setContent('');
            setError(null);
            return;
        }

        // Load article content
        const loadArticle = async () => {
            setLoading(true);
            setError(null);

            const articleData = findArticleById(article);
            if (!articleData) {
                setError('Article not found');
                setLoading(false);
                return;
            }

            setCurrentArticle(articleData);

            try {
                // Import markdown file dynamically
                const response = await fetch(`/academy-content/${articleData.path}`);

                if (!response.ok) {
                    throw new Error(`Failed to load article: ${response.statusText}`);
                }

                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error('Error loading article:', err);
                setError(`Failed to load article content. ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [category, article]);

    // Handle internal link clicks to use React Router instead of page reload
    useEffect(() => {
        const handleLinkClick = (e) => {
            const target = e.target.closest('a');
            if (!target) return;

            const href = target.getAttribute('href');

            // Check if it's an internal academy link
            if (href && href.startsWith('/academy/')) {
                e.preventDefault();

                // Extract category and article from href
                const pathParts = href.replace('/academy/', '').split('/');

                if (pathParts.length === 2) {
                    // Has category: /academy/category/article
                    window.location.href = href; // Use window.location for now
                } else if (pathParts.length === 1) {
                    // No category - need to find it using findArticleById
                    const articleData = findArticleById(pathParts[0]);
                    if (articleData && articleData.categoryId) {
                        window.location.href = `/academy/${articleData.categoryId}/${pathParts[0]}`;
                    }
                }
            }
        };

        const contentDiv = document.querySelector('.academy-markdown-content');
        if (contentDiv) {
            contentDiv.addEventListener('click', handleLinkClick);
            return () => contentDiv.removeEventListener('click', handleLinkClick);
        }
    }, [content]); // Re-attach when content changes

    const breadcrumbs = getBreadcrumbs(category, article);

    const renderWelcomePage = () => {
        const categoryData = category ? findCategoryById(category) : null;

        if (!category) {
            // Main academy home
            return (
                <div className="academy-welcome">
                    <div className="welcome-header">
                        <h1>Welcome to Traxxia Academy</h1>
                        <p className="welcome-subtitle">
                            Your comprehensive guide to leveraging Traxxia for strategic business analysis
                        </p>
                    </div>

                    <div className="welcome-features">
                        <div className="feature-card">
                            <div className="feature-icon">🚀</div>
                            <h3>Getting Started</h3>
                            <p>Learn the basics and set up your account</p>
                            <Link to="/academy/getting-started/what-is-traxxia" className="feature-link">
                                Start Here →
                            </Link>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💼</div>
                            <h3>Business Management</h3>
                            <p>Create and manage your business profiles</p>
                            <Link to="/academy/businesses/what-is-a-business-profile" className="feature-link">
                                Learn More →
                            </Link>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Strategic Analysis</h3>
                            <p>Unlock powerful insights with SWOT, PESTEL, and more</p>
                            <Link to="/academy/strategic-analysis/strategic-analysis-overview" className="feature-link">
                                Explore →
                            </Link>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💰</div>
                            <h3>Financial Analysis</h3>
                            <p>Upload and analyze financial documents</p>
                            <Link to="/academy/financial-analysis/financial-analysis-overview" className="feature-link">
                                Get Started →
                            </Link>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📁</div>
                            <h3>Project Management</h3>
                            <p>Create and prioritize strategic projects</p>
                            <Link to="/academy/projects/project-management-overview" className="feature-link">
                                Discover →
                            </Link>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">👥</div>
                            <h3>Collaboration</h3>
                            <p>Work with your team effectively</p>
                            <Link to="/academy/collaboration/collaboration-overview" className="feature-link">
                                Learn How →
                            </Link>
                        </div>
                    </div>

                    <div className="welcome-footer">
                        <div className="help-section">
                            <h3>Need Help?</h3>
                            <p>Can't find what you're looking for? Browse the categories in the sidebar or stay tuned for our Academy Assistant!</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Category page (no specific article selected)
        if (categoryData) {
            return (
                <div className="academy-category-page">
                    <h1>{categoryData.title}</h1>
                    <p className="category-description">{categoryData.description}</p>

                    <div className="category-articles-grid">
                        {categoryData.articles.map((art) => (
                            <Link
                                key={art.id}
                                to={`/academy/${category}/${art.id}`}
                                className="category-article-card"
                            >
                                <h3>{art.title}</h3>
                                <div className="article-meta">
                                    {art.roles.includes('all') ? (
                                        <span className="role-badge">All Users</span>
                                    ) : (
                                        art.roles.map((role) => (
                                            <span key={role} className="role-badge">{role}</span>
                                        ))
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderRelatedArticles = () => {
        if (!currentArticle || !currentArticle.relatedArticles || currentArticle.relatedArticles.length === 0) {
            return null;
        }

        return (
            <div className="related-articles">
                <h3>Related Articles</h3>
                <div className="related-articles-grid">
                    {currentArticle.relatedArticles.map((relatedId) => {
                        const related = findArticleById(relatedId);
                        if (!related) return null;

                        return (
                            <Link
                                key={relatedId}
                                to={`/academy/${related.categoryId}/${related.id}`}
                                className="related-article-card"
                            >
                                <span>{related.title}</span>
                                <span className="related-category">{related.categoryTitle}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="academy-page">
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation"
            >
                <Menu size={24} />
            </button>

            <AcademyNavigation
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
            />

            <main className="academy-content">
                {breadcrumbs.length > 1 && (
                    <nav className="academy-breadcrumbs">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={crumb.path} className="breadcrumb-item">
                                {index > 0 && <span className="breadcrumb-separator">/</span>}
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="breadcrumb-current">{crumb.label}</span>
                                ) : (
                                    <Link to={crumb.path} className="breadcrumb-link">
                                        {crumb.label}
                                    </Link>
                                )}
                            </span>
                        ))}
                    </nav>
                )}

                <div className="academy-article">
                    {!category || !article ? (
                        renderWelcomePage()
                    ) : loading ? (
                        <div className="academy-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading article...</p>
                        </div>
                    ) : error ? (
                        <div className="academy-error">
                            <h2>Error Loading Article</h2>
                            <p>{error}</p>
                            <Link to="/academy" className="error-home-link">
                                Return to Academy Home
                            </Link>
                        </div>
                    ) : (
                        <>
                            {currentArticle && (
                                <div className="article-header">
                                    <h1>{currentArticle.title}</h1>
                                    <div className="article-meta">
                                        {currentArticle.roles.includes('all') ? (
                                            <span className="role-badge">All Users</span>
                                        ) : (
                                            currentArticle.roles.map((role) => (
                                                <span key={role} className="role-badge">{role}</span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <MarkdownRenderer content={content} articleId={article} />

                            <AcademyFeedback articleId={article} />

                            {renderRelatedArticles()}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AcademyPage;
