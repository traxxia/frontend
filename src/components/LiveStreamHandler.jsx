import React, { useEffect, useRef, useCallback, useState } from "react";

/**
 * Generic live streaming handler
 * Handles progressive data rendering with typing animation
 *
 * Props:
 * - parsedData: object → structured data to stream (any type)
 * - isStreamingActive: boolean → triggers live streaming
 * - activeSection: string → current visible section (used for scroll)
 * - onStreamingMount: function → callback to attach streaming chunk handler
 * - onStreamUpdate: function(data) → sends partial streamed data back to parent
 * - onStreamComplete: function() → triggers after all content streamed
 */
const LiveStreamHandler = ({
  parsedData,
  isStreamingActive,
  activeSection,
  onStreamingMount,
  onStreamUpdate,
  onStreamComplete
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isStreamingContent, setIsStreamingContent] = useState(false);

  const intervalRef = useRef(null);
  const streamTimeoutRef = useRef(null);
  const hasStartedRef = useRef(false);
  const processedDataRef = useRef(null);
  const isMountedRef = useRef(true);
  const streamingDataRef = useRef(null);

  // -------- Typing animation logic --------
  const startTypingAnimation = useCallback(() => {
    if (intervalRef.current || hasStartedRef.current) return;
    hasStartedRef.current = true;
    let progress = 0;
    setDisplayProgress(0);

    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }
      progress += 5;
      if (progress >= 100) {
        progress = 100;
        setDisplayProgress(100);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        hasStartedRef.current = false;
      } else {
        setDisplayProgress(progress);
      }
    }, 100);
  }, []);

  // -------- Main streaming logic (generic) --------
  const streamTableContent = useCallback(
    async (data) => {
      if (!data || processedDataRef.current === data) return;
      processedDataRef.current = data;

      setIsStreamingContent(true);
      startTypingAnimation();

      const streamedData = {};

      for (const [key, value] of Object.entries(data)) {
        if (!isMountedRef.current) break;

        await new Promise((resolve) => {
          streamTimeoutRef.current = setTimeout(() => {
            streamedData[key] = value;
            onStreamUpdate?.({ ...streamedData });
            resolve();
          }, 600);
        });
      }

      setIsStreamingContent(false);
      onStreamComplete?.();
    },
    [startTypingAnimation, onStreamUpdate, onStreamComplete]
  );

  // -------- Handle streaming mount --------
  useEffect(() => {
    if (!isStreamingActive || !onStreamingMount) return;

    const handleChunk = (chunk) => {
      try {
        const parsed = JSON.parse(chunk);
        const data = parsed; // no porter-specific parsing
        streamingDataRef.current = data;
        requestAnimationFrame(() => streamTableContent(data));
      } catch (err) {
        console.error("Error parsing stream chunk:", err);
      }
    };

    onStreamingMount(handleChunk);
  }, [isStreamingActive, onStreamingMount, streamTableContent]);

  // -------- Cleanup --------
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearInterval(intervalRef.current);
      clearTimeout(streamTimeoutRef.current);
      intervalRef.current = null;
      streamTimeoutRef.current = null;
      hasStartedRef.current = false;
      processedDataRef.current = null;
    };
  }, []);

  // -------- When parsedData changes --------
  useEffect(() => {
    if (parsedData) streamTableContent(parsedData);
  }, [parsedData, streamTableContent]);

  return null;
};

export default LiveStreamHandler;
