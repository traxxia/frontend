import React from 'react';
import { motion } from 'framer-motion';
import { FaAngleLeft, FaAngleRight, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';

const UserStep = ({ form, handleChange, errors, isCheckingEmail, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, handleNext, onBackToLogin, t }) => {
  return (
    <motion.div
      key="user"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="tab-content"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="register-form">
        <div className="form-grid">
          <div className="form-group">
            <label>
              {t('full_name')} <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                type="text"
                name="name"
                placeholder={t('full_name_placeholder')}
                value={form.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
              />
            </div>
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>
              {t('email_address')} <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                type="email"
                name="email"
                placeholder={t('email_placeholder')}
                value={form.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>
              {t('password')} <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t('create_password')}
                value={form.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>
              {t('confirm_password')} <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder={t('confirm_password_placeholder')}
                value={form.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBackToLogin}>
            <FaAngleLeft /> {t('back_to_home')}
          </button>
          <button type="submit" className="btn-primary" disabled={isCheckingEmail}>
            {isCheckingEmail ? <><FaSpinner className="spinner" /> {t('checking') || 'Checking...'}</> : <>{t('next_step')} <FaAngleRight /></>}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserStep;
