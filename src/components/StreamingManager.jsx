import { useState, useMemo } from 'react';

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
    return false; // Global disable for streaming effect
  };

  const hasStreamed = (cardId) => {
    return true; // Treat as always streamed to show full content
  };

  const resetCard = (cardId) => {
    setStreamingStates(prev => ({
      ...prev,
      [cardId]: { isStreaming: false, hasStreamed: true }
    }));
  };

  const isStreamingFinished = (cardId) => {
    return true;
  };

  return useMemo(() => ({
    startStreaming,
    stopStreaming,
    shouldStream,
    hasStreamed,
    resetCard,
    isStreamingFinished,
    activeStreamingCard
  }), [activeStreamingCard, streamingStates]);
};

export const StreamingRow = ({ children, isVisible, isLast, lastRowRef, isStreaming, tag: Tag = 'tr' }) => {
  return (
    <Tag 
      ref={isLast ? lastRowRef : null}
      style={{
        opacity: isVisible ? 1 : 1, // Ensure visibility
        transform: 'none', // Remove transform
        transition: 'none' // Remove transition
      }}
    >
      {children}
    </Tag>
  );
};