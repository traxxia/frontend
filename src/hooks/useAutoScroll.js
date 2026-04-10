import { useState, useEffect, useRef } from 'react';

export const useAutoScroll = (streamingManager, cardId, isExpanded, visibleRows) => {
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const lastRowRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isScrollingProgrammatically = useRef(false);

  useEffect(() => {
    const handleScroll = (e) => {
      if (isScrollingProgrammatically.current) {
        return;
      }

      if (streamingManager?.shouldStream(cardId)) {
        setUserHasScrolled(true);

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    const containers = [
      document.querySelector('.modern-analysis-container'),
      document.querySelector('.expanded-analysis-content'),
      document.querySelector('.modern-card-content-inner'),
      document.querySelector('.info-panel-content'),
      document.querySelector('.analysis-content')
    ];

    containers.forEach(container => {
      if (container) {
        container.addEventListener('scroll', handleScroll, { passive: true });
      }
    });

    const timeoutId = scrollTimeoutRef.current;
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });

      containers.forEach(container => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [cardId, streamingManager]);

  useEffect(() => {
    if (streamingManager?.shouldStream(cardId) && isExpanded && lastRowRef.current && !userHasScrolled) {
      isScrollingProgrammatically.current = true;

      lastRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 1000);
    }
  }, [visibleRows, cardId, isExpanded, streamingManager, userHasScrolled]);

  useEffect(() => {
    const shouldStream = streamingManager?.shouldStream(cardId);
    if (shouldStream) {
      setUserHasScrolled(false);
    }
  }, [streamingManager, cardId]);

  return {
    lastRowRef,
    userHasScrolled,
    setUserHasScrolled
  };
};