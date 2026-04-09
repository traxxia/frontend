import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { academyStructure, findCategoryById } from '../utils/academyIndex';
import * as LucideIcons from 'lucide-react';
import '../styles/academy.css';

import { useAuthStore } from '../store/authStore';

const AcademyNavigation = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
    const { category: activeCategory, article: activeArticle } = useParams();
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState('');
    const [expandedCategories, setExpandedCategories] = useState([activeCategory || 'getting-started']);
    const categoryRefs = useRef({});
    const navRef = useRef(null);

    useEffect(() => {
        const storedRole = useAuthStore.getState().userRole;
        setUserRole(storedRole || '');
    }, []);

    const toggleCategory = (categoryId) => {
        const isCurrentlyExpanded = expandedCategories.includes(categoryId);
        setExpandedCategories(prev =>
            isCurrentlyExpanded
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
        if (!isCurrentlyExpanded) {
            setTimeout(() => {
                const container = navRef.current;
                const categoryEl = categoryRefs.current[categoryId];

                if (container && categoryEl) {
                    const containerRect = container.getBoundingClientRect();
                    const elementRect = categoryEl.getBoundingClientRect();

                    const stickyHeaderHeight = 90; // Approx height of the top sticky nav
                    let currentScroll = container.scrollTop;
                    const topOffset = elementRect.top - containerRect.top;

                    // Check if the top of the category is hidden under the sticky header
                    if (topOffset < stickyHeaderHeight) {
                        container.scrollTo({
                            top: currentScroll + topOffset - stickyHeaderHeight - 10,
                            behavior: 'smooth'
                        });
                    } else {
                        // Check if bottom is hidden
                        const bottomOverflow = elementRect.bottom - containerRect.bottom + 20;
                        if (bottomOverflow > 0) {
                            let targetScroll = currentScroll + bottomOverflow;
                            const maxAllowedScroll = currentScroll + topOffset - stickyHeaderHeight - 10;

                            // Ensure we don't scroll so far that the top of the category becomes hidden
                            if (targetScroll > maxAllowedScroll) {
                                targetScroll = maxAllowedScroll;
                            }

                            if (targetScroll < 0) targetScroll = 0;

                            container.scrollTo({
                                top: targetScroll,
                                behavior: 'smooth'
                            });
                        }
                    }
                }
            }, 150);
        }
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
        <div ref={navRef} className={`academy-navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
                        <div key={category.id} ref={el => categoryRefs.current[category.id] = el} className={`category-section ${isActive ? 'active-category' : ''}`}>
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
