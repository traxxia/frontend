import React from 'react';
import { Circle } from 'lucide-react'; // Keep Circle as fallback
import Target from '../assets/SwotIcon.png';
import BarChart3 from '../assets/PorterIcon.png';
import Zap from '../assets/ValueChainIcon.png';
import Users from '../assets/StrategicIcon.png';
import TrendingUp from '../assets/BCGMatrixIcon.png';

const iconMap = {
  Target,
  BarChart3,
  TrendingUp,
  Users,
  Zap
};

// Custom Image Icon Component
const ImageIcon = ({ src, alt, size = 20, className = '', style = {} }) => {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`icon-image ${className}`}
      style={{
        objectFit: 'contain',
        verticalAlign: 'middle',
        ...style
      }}
      onError={(e) => {
        console.error(`Failed to load icon: ${src}`);
        // Fallback to a default icon or hide the image
        e.target.style.display = 'none';
      }}
    />
  );
};

export const getIconComponent = (iconName) => {
  const iconSrc = iconMap[iconName];
  
  // If we have a custom image, return image component
  if (iconSrc) {
    return ({ size = 20, className = '', ...props }) => (
      <ImageIcon
        src={iconSrc}
        alt={iconName}
        size={size}
        className={className}
        {...props}
      />
    );
  }
  
  // Fallback to Lucide Circle icon
  return Circle;
};