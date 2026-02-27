import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { academyStructure, findCategoryById } from '../utils/academyIndex';
import * as LucideIcons from 'lucide-react';
import '../styles/academy.css';

/**
 * AcademyNavigation Component
 * 
 * Collapsible sidebar navigation for the Academy
 * - Category sections (accordion-style)
 * - Active article highlighting
 * - Mobile-friendly
 */
const AcademyNavigation = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
    const { category: activeCategory, article: activeArticle } = useParams();
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState('');
    const [expandedCategories, setExpandedCategories] = useState([activeCategory || 'getting-started']);

    useEffect(() => {
        const storedRole = sessionStorage.getItem('userRole');
        setUserRole(storedRole || '');
    }, []);

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleArticleClick = (categoryId, articleId) => {
        navigate(`/academy/${categoryId}/${articleId}`);
        if (onCloseMobileMenu) {
            onCloseMobileMenu();
        }
    };

    const renderCategoryIcon = (iconName) => {
        const IconComponent = LucideIcons[iconName];
        return IconComponent ? <IconComponent size={20} /> : <LucideIcons.BookOpen size={20} />;
    };

    return (
        <div className={`academy-navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="academy-nav-sticky-top">
                <div className="academy-nav-header">
                    <Link to="/academy" className="academy-home-link">
                        <LucideIcons.BookOpen size={24} />
                        <span>Traxxia Academy</span>
                    </Link>
                    {onCloseMobileMenu && (
                        <button aria-label="Close navigation menu" className="mobile-close-btn" onClick={onCloseMobileMenu}>
                            <LucideIcons.X size={24} />
                        </button>
                    )}
                </div>

            </div>

            <nav className="academy-nav-categories">
                {academyStructure.categories.map((category) => {
                    const isExpanded = expandedCategories.includes(category.id);
                    const isActive = activeCategory === category.id;

                    return (
                        <div key={category.id} className={`category-section ${isActive ? 'active-category' : ''}`}>
                            <div
                                className="category-header"
                                onClick={() => toggleCategory(category.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        toggleCategory(category.id);
                                    }
                                }}
                            >
                                <div className="category-title">
                                    {renderCategoryIcon(category.icon)}
                                    <span>{category.title}</span>
                                </div>
                                <div className="category-header-right">
                                    <span className="article-count-badge">
                                        {category.articles.length}
                                    </span>
                                    <LucideIcons.ChevronDown
                                        size={16}
                                        className={`category-chevron ${isExpanded ? 'expanded' : ''}`}
                                    />
                                </div>
                            </div>

                            {isExpanded && (
                                <ul className="category-articles">
                                    {category.articles.map((article) => {
                                        const isArticleActive = activeCategory === category.id && activeArticle === article.id;

                                        return (
                                            <li key={article.id} className={isArticleActive ? 'active-article' : ''}>
                                                <button
                                                    className="article-link"
                                                    onClick={() => handleArticleClick(category.id, article.id)}
                                                >
                                                    {article.title}
                                                    {isArticleActive && (
                                                        <LucideIcons.ChevronRight size={14} className="active-indicator" />
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="academy-nav-footer">
                <div className="nav-footer-links">
                    <Link to={userRole === 'super_admin' ? '/super-admin' : '/dashboard'} className="footer-link" style={{ marginBottom: '8px' }}>
                        <LucideIcons.LayoutDashboard size={16} />
                        <span>Back to Main</span>
                    </Link>
                    <Link to="/academy" className="footer-link">
                        <LucideIcons.Home size={16} />
                        <span>Academy Home</span>
                    </Link>
                </div>
                <div className="nav-footer-info">
                    <small>Version 1.0 • Phase 3</small>
                </div>
            </div>
        </div>
    );
};

export default AcademyNavigation;
