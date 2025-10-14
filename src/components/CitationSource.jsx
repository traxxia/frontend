import React from 'react';

const CitationSource = ({ 
  url, 
  x, 
  y, 
  textStyle = {
    fontSize: '14px',
    fill: '#6b7280',
    fontStyle: 'italic'
  },
  circleStyle = {
    fill: '#3b82f6',
    cursor: 'pointer'
  },
  arrowStyle = {
    fontSize: '12px',
    fill: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    pointerEvents: 'none'
  },
  circleRadius = 8
}) => {
  // Helper function to format URL for display
  const formatUrlForDisplay = (url) => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (!url) return null;

  return (
    <g>
      <text
        x={x}
        y={y}
        style={textStyle}
        ref={(textElement) => {
          if (textElement) {
            const textWidth = textElement.getBBox().width;
            const circle = textElement.parentNode.querySelector('circle');
            const arrow = textElement.parentNode.querySelector('text:last-child');
            if (circle && arrow) {
              circle.setAttribute('cx', x + textWidth + 15);
              arrow.setAttribute('x', x + textWidth + 15);
            }
          }
        }}
      >
        Source: {formatUrlForDisplay(url)}
      </text>
      {/* <circle
        cy={y - 4}
        r={circleRadius}
        style={circleStyle}
        onClick={() => window.open(url, '_blank')}
      >
        <title>Source URL</title>
      </circle>
      <text
        y={y}
        textAnchor="middle"
        style={arrowStyle}
      >
        ↗
      </text> */}
    </g>
  );
};

export default CitationSource;