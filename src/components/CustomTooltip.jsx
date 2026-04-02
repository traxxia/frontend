import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A reusable, animated tooltip component.
 * Wraps any element and shows a styled message on hover.
 */
const CustomTooltip = ({ children, message, position = 'bottom', align = 'center' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="custom-tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onMouseDown={() => setIsVisible(false)}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      {children}
      <AnimatePresence>
        {isVisible && message && (
          <motion.div
            initial={{ opacity: 0, y: (position === 'bottom' ? -8 : 8), scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: (position === 'bottom' ? -8 : 8), scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`custom-tooltip-content tooltip-${position} align-${align}`}
          >
            {message}
            <div className="tooltip-arrow" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomTooltip;
