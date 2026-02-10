import React, { useState } from 'react';
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
    const [expandedCategories, setExpandedCategories] = useState([activeCategory || 'getting-started']);

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
        return IconComponent ? <IconComponent size={18} /> : <LucideIcons.BookOpen size={18} />;
    };

    return (
        <div className={`academy-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="academy-sidebar-nav">
                <div className="academy-nav-search-v2">
                    <div className="search-input-wrapper-v2">
                        <LucideIcons.Search size={14} className="search-icon-v2" />
                        <input
                            type="text"
                            placeholder="Search academy..."
                            className="academy-search-input-v2"
                            disabled
                        />
                    </div>
                </div>

                <div className="academy-nav-categories-v2">
                    {academyStructure.categories.map((category) => {
                        const isExpanded = expandedCategories.includes(category.id);
                        const isActive = activeCategory === category.id;

                        return (
                            <div key={category.id} className={`category-section-v2 ${isActive ? 'active-category' : ''}`}>
                                <button
                                    className="category-header-v2"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="category-title-v2">
                                        {renderCategoryIcon(category.icon)}
                                        <span>{category.title}</span>
                                    </div>
                                    <LucideIcons.ChevronDown
                                        size={14}
                                        className={`category-chevron-v2 ${isExpanded ? 'expanded' : ''}`}
                                    />
                                </button>

                                {isExpanded && (
                                    <ul className="category-articles-v2">
                                        {category.articles.map((article) => {
                                            const isArticleActive = activeCategory === category.id && activeArticle === article.id;

                                            return (
                                                <li key={article.id} className={isArticleActive ? 'active-article' : ''}>
                                                    <button
                                                        className="article-link-v2"
                                                        onClick={() => handleArticleClick(category.id, article.id)}
                                                    >
                                                        {article.title}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="academy-sidebar-footer">
                <Link to="/dashboard" className="sidebar-footer-link">
                    <LucideIcons.LayoutDashboard size={14} />
                    <span>Dashboard</span>
                </Link>
                <Link to="/academy" className="sidebar-footer-link">
                    <LucideIcons.Home size={14} />
                    <span>Academy Home</span>
                </Link>
            </div>
        </div>
    );
};

export default AcademyNavigation;
