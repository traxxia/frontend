import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AcademyNavigation from '../components/AcademyNavigation';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AcademyFeedback from '../components/AcademyFeedback';
import { findArticleById, findCategoryById, getBreadcrumbs, academyStructure, resolveAcademyPath } from '../utils/academyIndex';
import { useAcademyArticle } from '../hooks/useQueries';

import * as LucideIcons from 'lucide-react';
import '../styles/academy.css';

const AcademyPage = () => {
    const { category, article } = useParams();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentArticle, setCurrentArticle] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [prevArticle, setPrevArticle] = useState(null);
    const [nextArticle, setNextArticle] = useState(null);

    const articleData = article ? findArticleById(article) : null;
    const { data: content = '', isLoading: loading, error: queryError } = useAcademyArticle(articleData?.path);

    const error = queryError ? queryError.message : (article && !articleData ? 'Article not found' : null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [category, article]);
    useEffect(() => {
        setSearchQuery('');
        setSearchResults([]);
    }, [category, article]);
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const results = [];

        academyStructure.categories.forEach(cat => {
            cat.articles.forEach(art => {
                if (
                    art.title.toLowerCase().includes(query) ||
                    art.tags.some(tag => tag.toLowerCase().includes(query))
                ) {
                    results.push({ ...art, categoryId: cat.id, categoryTitle: cat.title });
                }
            });
        });

        setSearchResults(results);
    }, [searchQuery]);

    useEffect(() => {
        if (!category || !article) {
            setCurrentArticle(null);
            setPrevArticle(null);
            setNextArticle(null);
            return;
        }

        const articleDataObj = findArticleById(article);
        if (articleDataObj) {
            setCurrentArticle(articleDataObj);
            const allArticles = academyStructure.categories.flatMap(cat =>
                cat.articles.map(art => ({ ...art, categoryId: cat.id }))
            );

            const index = allArticles.findIndex(a => a.id === article);
            if (index !== -1) {
                setPrevArticle(index > 0 ? allArticles[index - 1] : null);
                setNextArticle(index < allArticles.length - 1 ? allArticles[index + 1] : null);
            }
        } else {
            setCurrentArticle(null);
            setPrevArticle(null);
            setNextArticle(null);
        }
    }, [category, article]);
    useEffect(() => {
        const handleLinkClick = (e) => {
            const target = e.target.closest('a');
            if (!target) return;

            const href = target.getAttribute('href');
            const isInternal = target.classList.contains('academy-internal-link') ||
                target.classList.contains('academy-next-step-card');
            if (href && (href.startsWith('/academy/') || isInternal)) {
                e.preventDefault();
                const finalPath = resolveAcademyPath(href, category);
                navigate(finalPath);
            }

        };

        const contentDiv = document.querySelector('.academy-markdown-content');
        if (contentDiv) {
            contentDiv.addEventListener('click', handleLinkClick);
            return () => contentDiv.removeEventListener('click', handleLinkClick);
        }
    }, [content, category, navigate]);

    const breadcrumbs = getBreadcrumbs(category, article);

    const handleBack = () => {
        if (article) {
            navigate(`/academy/${category}`);
        } else if (category) {
            navigate('/academy');
        } else {
            navigate(-1);
        }
    };

    const renderCategoryIcon = (iconName) => {
        const IconComponent = LucideIcons[iconName];
        return IconComponent ? <IconComponent size={24} /> : <LucideIcons.BookOpen size={24} />;
    };

    const renderSearchResults = () => {
        if (!searchQuery.trim()) return null;

        return (
            <div className="search-results-overlay">
                <h3>Search Results for "{searchQuery}"</h3>
                {searchResults.length === 0 ? (
                    <p>No articles found matching your query.</p>
                ) : (
                    <div className="search-results-grid">
                        {searchResults.map(result => (
                            <Link
                                key={result.id}
                                to={`/academy/${result.categoryId}/${result.id}`}
                                className="search-result-card"
                            >
                                <h4>{result.title}</h4>
                                <span className="result-category">{result.categoryTitle}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderWelcomePage = () => {
        const categoryData = category ? findCategoryById(category) : null;
        const renderSearchHeader = () => (
            <div className="welcome-header">
                <h1>Welcome to Traxxia Academy</h1>
                <p className="welcome-subtitle">
                    Your comprehensive guide to utilizing Traxxia for strategic success.
                </p>
                <div className="academy-main-search">
                    <LucideIcons.Search className="main-search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search for guides or articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="academy-main-search-input"
                    />
                </div>
            </div>
        );

        if (!category) {
            return (
                <div className="academy-welcome">
                    {renderSearchHeader()}

                    {searchQuery.trim() ? (
                        renderSearchResults()
                    ) : (
                        <div className="welcome-features">
                            {academyStructure.categories.map((cat) => (
                                <div key={cat.id} className="feature-card">
                                    <div className="feature-icon">{renderCategoryIcon(cat.icon)}</div>
                                    <h3>{cat.title}</h3>
                                    <p>{cat.description}</p>
                                    <Link to={`/academy/${cat.id}`} className="feature-link">
                                        View Guides →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        if (categoryData) {
            return (
                <div className="academy-category-page">
                    <button onClick={handleBack} className="academy-back-btn mb-4">
                        <LucideIcons.ArrowLeft size={16} /> Back to Academy
                    </button>
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
                <LucideIcons.Menu size={24} />
            </button>

            <AcademyNavigation
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
            />

            <main className="academy-content">
                {}

                {breadcrumbs.length > 1 && (
                    <nav className="academy-breadcrumbs">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={crumb.path} className="breadcrumb-item">
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
                            <button onClick={handleBack} className="academy-back-btn mb-4">
                                <LucideIcons.ArrowLeft size={16} /> Back to {findCategoryById(category)?.title || 'Category'}
                            </button>

                            {currentArticle && (
                                <div className="article-header">
                                    {}
                                    {!content.trim().startsWith('# ') && <h1>{currentArticle.title}</h1>}
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

                            <AcademyFeedback articleId={currentArticle?.title || article} />

                            {}
                            {(prevArticle || nextArticle) && (
                                <div className="article-pagination-bottom">
                                    {prevArticle ? (
                                        <Link
                                            to={`/academy/${prevArticle.categoryId}/${prevArticle.id}`}
                                            className="pagination-link prev"
                                        >
                                            <div className="pagination-label">Previous Step</div>
                                            <div className="pagination-title">
                                                <LucideIcons.ChevronLeft size={16} />
                                                {prevArticle.title}
                                            </div>
                                        </Link>
                                    ) : <div className="pagination-spacer"></div>}

                                    {nextArticle ? (
                                        <Link
                                            to={`/academy/${nextArticle.categoryId}/${nextArticle.id}`}
                                            className="pagination-link next"
                                        >
                                            <div className="pagination-label">Next Step</div>
                                            <div className="pagination-title">
                                                {nextArticle.title}
                                                <LucideIcons.ChevronRight size={16} />
                                            </div>
                                        </Link>
                                    ) : <div className="pagination-spacer"></div>}
                                </div>
                            )}

                            {renderRelatedArticles()}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AcademyPage;
