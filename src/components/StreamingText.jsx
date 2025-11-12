import React, { useEffect, useRef, useState } from "react";

export default function StreamingText({
  text = "",
  trigger,
  typingSpeed = 14,
  className = "",
  allowSkipButton = true,
  onDone,
  chunkMode = "char",
  autoScroll = true,
  endScrollOffset = 0,
}) {
  const [displayText, setDisplayText] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const bufferRef = useRef([]);
  const intervalRef = useRef(null);
  const prevFullTextRef = useRef(normalizeText(text));
  const endRef = useRef(null);

  function normalizeText(input) {
    if (input === null || input === undefined) return "";
    if (typeof input === "string") return input;
    if (Array.isArray(input)) return input.join(" ");
    try {
      return String(input);
    } catch (e) {
      return JSON.stringify(input);
    }
  }

  const getUnits = (fullText) => {
    if (!fullText) return [];
    if (chunkMode === "word") {
      return fullText.split(/(\s+)/).filter(Boolean);
    }
    if (chunkMode === "sentence") {
      const matches = fullText.match(/[^.!?]+[.!?]*/g);
      return (matches || [fullText]).map(s => s);
    }
    return fullText.split("");
  };

  const clearIntervalIfAny = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRevealFromBuffer = (speed = typingSpeed) => {
    clearIntervalIfAny();
    setIsFinished(false);

    intervalRef.current = setInterval(() => {
      if (!bufferRef.current || bufferRef.current.length === 0) return;
      const next = bufferRef.current.shift();
      setDisplayText(prev => prev + next);

      if (autoScroll && endRef.current) {
        requestAnimationFrame(() => {
          try {
            endRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
            if (endScrollOffset) {
              window.scrollBy({ top: endScrollOffset, left: 0, behavior: "smooth" });
            }
          } catch (e) {
          }
        });
      }

      if (bufferRef.current.length === 0) {
        clearIntervalIfAny();
        setIsFinished(true);
        onDone && onDone();
      }
    }, speed);
  };

  const handleSkip = () => {
    if (bufferRef.current && bufferRef.current.length) {
      setDisplayText(prev => prev + bufferRef.current.join(""));
      bufferRef.current = [];
    }
    clearIntervalIfAny();
    setIsFinished(true);
    onDone && onDone();
  };

  useEffect(() => {
    const newFull = normalizeText(text);
    const prevFull = prevFullTextRef.current ?? "";

    if (newFull === prevFull) {
      return;
    }

    if (newFull.startsWith(prevFull) && prevFull.length > 0) {
      const appended = newFull.slice(prevFull.length);
      const units = getUnits(appended || newFull);
      setDisplayText(prevFull);
      bufferRef.current = units.slice();
      prevFullTextRef.current = newFull;
      setTimeout(() => startRevealFromBuffer(), 20);
      return;
    }

    const units = getUnits(newFull);
    setDisplayText("");
    bufferRef.current = units.slice();
    prevFullTextRef.current = newFull;
    setTimeout(() => startRevealFromBuffer(), 20);

    return () => {
    };
  }, [text, trigger, chunkMode, typingSpeed]);

  useEffect(() => {
    return () => {
      clearIntervalIfAny();
    };
  }, []);

  return (
    <div className={className} style={{ display: "inline" }}>
      <span className="streaming-text" aria-live="polite">{displayText}</span>
      {!isFinished && <span className="streaming-caret" aria-hidden>▌</span>}
      {!isFinished && allowSkipButton && (
        <button
          type="button"
          onClick={handleSkip}
          className="stream-skip"
          aria-label="Show full text"
          style={{ marginLeft: 8, background: "none", border: "none", color: "#0b5fff", cursor: "pointer" }}
        >
          Show full text
        </button>
      )}
      <span ref={endRef} style={{ display: "block", width: 1, height: 1, lineHeight: 0 }} aria-hidden />
      <style jsx>{`
        .streaming-text { white-space: pre-wrap; }
        .streaming-caret { margin-left: 6px; animation: blink 1s steps(2,start) infinite; }
        @keyframes blink { to { visibility: hidden; } }
      `}</style>
    </div>
  );
}
