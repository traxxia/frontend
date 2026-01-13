import { useState } from 'react';

export const useStreamingManager = () => {
  const [activeStreamingCard, setActiveStreamingCard] = useState(null);
  const [streamingStates, setStreamingStates] = useState({});

  const startStreaming = (cardId) => {
    setActiveStreamingCard(cardId);
    setStreamingStates(prev => ({
      ...prev,
      [cardId]: { isStreaming: true, hasStreamed: false }
    }));
  };

  const stopStreaming = (cardId) => {
    setStreamingStates(prev => ({
      ...prev,
      [cardId]: { isStreaming: false, hasStreamed: true }
    }));
    if (activeStreamingCard === cardId) {
      setActiveStreamingCard(null);
    }
  };

  const shouldStream = (cardId) => {
    return activeStreamingCard === cardId;
  };

  const hasStreamed = (cardId) => {
    return streamingStates[cardId]?.hasStreamed || false;
  };

  const resetCard = (cardId) => {
    setStreamingStates(prev => ({
      ...prev,
      [cardId]: { isStreaming: false, hasStreamed: false }
    }));
  };

  return {
    startStreaming,
    stopStreaming,
    shouldStream,
    hasStreamed,
    resetCard,
    activeStreamingCard
  };
};

export const StreamingRow = ({ children, isVisible, isLast, lastRowRef, isStreaming }) => {
  return (
    <tr 
      ref={isLast ? lastRowRef : null}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: isStreaming ? 'opacity 0.5s ease, transform 0.5s ease' : 'none'
      }}
    >
      {children}
    </tr>
  );
};