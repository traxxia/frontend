import React from 'react';

const CitationSource = ({
  url,
  x,
  y,
  textStyle = {
    fontSize: '14px',
    fill: '#3b82f6',
    textDecoration: 'underline',
    fontStyle: 'italic',
    cursor: 'pointer'
  }
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
    <a href={url} target="_blank" rel="noopener noreferrer">
      <text
        x={x}
        y={y}
        style={textStyle}
      >
        Source: {formatUrlForDisplay(url)}
      </text>
    </a>
  );
};

export default CitationSource;