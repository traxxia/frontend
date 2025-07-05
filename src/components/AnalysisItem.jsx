import React from 'react';
import { ChevronDown } from 'lucide-react';
import { getIconComponent } from '../utils/iconUtils';

const AnalysisItem = ({ item, onClick }) => {
  const IconComponent = getIconComponent(item.icon);

  return (
    <div 
      className="analysis-item"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="analysis-item-content">
        <div className="analysis-item-left">
          <div className="analysis-icon">
            <IconComponent size={20} />
          </div>
          <div>
            <h6 className="analysis-item-title">
              {item.title}
            </h6>
            <p className="analysis-item-subtitle">
              {item.subtitle}
            </p>
          </div>
        </div>
        <ChevronDown size={16} className="analysis-chevron" />
      </div>
    </div>
  );
};

export default AnalysisItem;