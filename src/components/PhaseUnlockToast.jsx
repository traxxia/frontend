import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Unlock, Sparkles } from "lucide-react";
import "../styles/phaseunlocktoast.css";

const PhaseUnlockPopup = ({ phase, show, onClose, autoCloseMs = 2500 }) => {
  const phaseColors = {
    initial: "#0ea5e9",
    essential: "#16a34a",
    good: "#f59e0b",
    advanced: "#8b5cf6",
  };

  const phaseTitles = {
    initial: "Initial Phase",
    essential: "Essential Phase",
    good: "Good Phase",
    advanced: "Advanced Phase",
  };

  const nextPhaseMessages = {
    essential: "You’ve unlocked the Essential Phase! Continue your journey 🚀",
    good: "Good Phase is now open — upload your document to explore!",
    advanced: "Advanced Phase unlocked — final stage ahead 🏆",
  };

  // Keep latest onClose without resetting the timer on each re-render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        if (onCloseRef.current) onCloseRef.current();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [show, autoCloseMs]);

  const color = phaseColors[phase] || "#16a34a";
  const message = nextPhaseMessages[phase] || "You’ve unlocked a new phase! 🎉";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="phase-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="phase-popup-card"
            initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 15 }}
            style={{ borderColor: color, boxShadow: `0 0 40px ${color}55` }}
          >
            <motion.div
              className="phase-popup-icon"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1 }}
              style={{ color }}
            >
              <Unlock size={50} />
            </motion.div>
            <h2 style={{ color }}>{phaseTitles[phase]} Unlocked!</h2>
            <p>{message}</p>
            <Sparkles
              className="sparkle-effect"
              size={120}
              color={color}
              strokeWidth={0.6}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhaseUnlockPopup;
