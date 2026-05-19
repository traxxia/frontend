import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader, Eye, EyeOff } from 'lucide-react';

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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBackToLogin}>
            <ChevronLeft size={18} /> {t('back_to_login')}
          </button>
          <button type="submit" className="btn-primary" disabled={isCheckingEmail}>
            {isCheckingEmail ? <><Loader className="animate-spin" size={16} /> {t('checking') || 'Checking...'}</> : <>{t('next')} <ChevronRight size={18} /></>}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserStep;
