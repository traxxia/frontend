import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CategorySection = ({
  id,
  title,
  icon: IconComponent,
  children,
  description,
  isCollapsed,
  onToggle
}) => {
  return (
    <div className="analysis-category">
      <div className="category-header" onClick={() => onToggle(id)}>
        <div className="category-header-left">
          <IconComponent size={24} className="category-icon" />
          <div>
            <h2 className="category-title">{title}</h2>
            {description && (
              <p className="strategic-analysis--s1">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="category-toggle">
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      <div className={`category-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="category-grid">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CategorySection;
