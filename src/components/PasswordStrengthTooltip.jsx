import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const PasswordStrengthTooltip = ({ password = '', isFocused = false, position = 'right' }) => {
  const { t } = useTranslation();

  // Requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Grouped under "all of the following"
  const allSubChecksPassed = hasUppercase && hasLowercase && hasNumber && hasSpecial;

  return (
    <AnimatePresence>
      {isFocused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`password-strength-tooltip position-${position}`}
        >
          {/* Header */}
          {/* <div className="tooltip-header">
            <h3>{t('lets_be_safe', "Let's be safe, not sorry")}</h3>
          </div> */}

          {/* Body */}
          <div className="tooltip-body">
            {/* Length Requirement */}
            <div className="requirement-row main-requirement">
              <span className={`icon-badge ${hasMinLength ? 'success' : 'fail'}`}>
                {hasMinLength ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
              </span>
              <span className="requirement-text">
                {t('password_rule_length', "Use at least 8 characters")}
              </span>
            </div>

            {/* Sub-requirements title */}
            <div className="requirement-row main-requirement">
              <span className={`icon-badge ${allSubChecksPassed ? 'success' : 'fail'}`}>
                {allSubChecksPassed ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
              </span>
              <span className="requirement-text group-header">
                {t('password_rule_all_following', "Use all of the following:")}
              </span>
            </div>

            {/* Sub-requirements list */}
            <div className="sub-requirements-container">
              {/* Letters */}
              <div className="requirement-row sub-requirement">
                <span className={`icon-badge ${hasUppercase && hasLowercase ? 'success' : 'fail'}`}>
                  {hasUppercase && hasLowercase ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                </span>
                <span className="requirement-text sub-text">
                  {t('password_rule_letters', "Letters (both uppercase & lowercase)")}
                </span>
              </div>

              {/* Numbers */}
              <div className="requirement-row sub-requirement">
                <span className={`icon-badge ${hasNumber ? 'success' : 'fail'}`}>
                  {hasNumber ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                </span>
                <span className="requirement-text sub-text">
                  {t('password_rule_numbers', "Numbers (0, 1, 2...)")}
                </span>
              </div>

              {/* Special Characters */}
              <div className="requirement-row sub-requirement">
                <span className={`icon-badge ${hasSpecial ? 'success' : 'fail'}`}>
                  {hasSpecial ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                </span>
                <span className="requirement-text sub-text">
                  {t('password_rule_special', "Special Characters (!@#$%)...")}
                </span>
              </div>
            </div>
          </div>
          
          {/* Arrow pointing indicator */}
          <div className="tooltip-indicator-arrow" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordStrengthTooltip;
