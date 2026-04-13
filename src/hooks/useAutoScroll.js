import { useState, useEffect, useRef } from 'react';

export const useAutoScroll = (streamingManager, cardId, isExpanded, visibleRows) => {
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const lastRowRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    const handleScroll = (e) => {
      if (isScrollingRef.current) return;
      if (!streamingManager?.shouldStream(cardId)) return;

      const target = (e.target === document || e.target === window)
        ? (document.scrollingElement || document.documentElement)
        : e.target;

      if (!target || typeof target.scrollTop !== 'number') return;

      const currentScrollTop = target.scrollTop;
      const scrollDiff = currentScrollTop - lastScrollTopRef.current;
      const isScrollingUp = scrollDiff < -5; // Lenient threshold for upward scroll
      const distanceFromBottom = target.scrollHeight - (currentScrollTop + target.clientHeight);
      
      // Only pause if they scroll UP specifically and are not at the bottom
      if (isScrollingUp && distanceFromBottom > 100) {
        setUserHasScrolled(true);
      } 
      // If user scrolls back to bottom, resume auto-scrolling
      else if (distanceFromBottom < 50) {
        setUserHasScrolled(false);
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Use capture to catch events from scrollable div containers
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [cardId, streamingManager]);

  useEffect(() => {
    const isFinished = streamingManager?.isStreamingFinished(cardId);
    const shouldStream = streamingManager?.shouldStream(cardId);
    
    if (!shouldStream || isFinished || !isExpanded || !lastRowRef.current || userHasScrolled) {
      return;
    }

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    requestAnimationFrame(() => {
      if (lastRowRef.current) {
        isScrollingRef.current = true;
        
        lastRowRef.current.scrollIntoView({
          behavior: 'smooth', // user wants smooth
          block: 'nearest',
          inline: 'nearest'
        });

        // Small buffer to allow scroll events to fire
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 200);
      }
    });
  }, [visibleRows, cardId, isExpanded, streamingManager, userHasScrolled]);

  useEffect(() => {
    if (streamingManager?.shouldStream(cardId)) {
      setUserHasScrolled(false);
    }
  }, [cardId, streamingManager]);

  return {
    lastRowRef,
    userHasScrolled,
    setUserHasScrolled
  };
};