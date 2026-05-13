import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import logo from '../assets/traxxia-logo.png';
import { Sun, Moon, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useUIStore } from "../store/uiStore";
import { useTranslation } from "../hooks/useTranslation";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const theme = useUIStore(state => state.theme);
  const toggleTheme = useUIStore(state => state.toggleTheme);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const { t } = useTranslation();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/forgot-password`, { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("OTP is required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await axios.post(`${API_BASE_URL}/api/verify-otp`, { email, otp });
      setStep(3);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/reset-password`, { email, otp, password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left-section">
        <div className="company-branding">
          <div className="logo-container">
            <img src={logo} alt="Traxxia Logo" className="logo" />
          </div>
          <div className="decoration-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </div>

      <div className="login-right-section">
        <div className="theme-icon-toggle">
          <button onClick={toggleTheme} className="theme-toggle-button" disabled={isLoading}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div className="login-box">
          <Link to="/login" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> {t("back_to_login") || "Back to Login"}
          </Link>
          
          <h2>{step === 1 ? (t("forgot_password_title") || "Forgot Password?") : step === 2 ? "Verify OTP" : "Reset Password"}</h2>
          <p className="login-subtitle">
            {step === 1 ? (t("forgot_password_subtitle") || "Enter your email address and we'll send you an OTP.") : 
             step === 2 ? `Enter the 6-digit code sent to ${email}` : 
             "Enter your new password below."}
          </p>

          {message && step !== 3 && (
            <div className="success-message" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #10b981' }}>
              {message}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} noValidate>
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type="email" 
                    className={error ? "error" : ""} 
                    value={email} 
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }} 
                    placeholder={t("email_address")} 
                    disabled={isLoading} 
                  />
                </div>
                {error && <span className="error-message">{error}</span>}
              </div>
              <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} noValidate>
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type="text" 
                    className={error ? "error" : ""} 
                    value={otp} 
                    onChange={e => {
                      setOtp(e.target.value);
                      if (error) setError("");
                    }} 
                    placeholder="Enter 6-digit OTP" 
                    maxLength={6}
                    disabled={isLoading} 
                  />
                </div>
                {error && <span className="error-message">{error}</span>}
              </div>
              <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                Didn't receive the code? <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}>Resend OTP</button>
              </p>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} noValidate>
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={error && !confirmPassword ? "error" : ""} 
                    value={password} 
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }} 
                    placeholder="New Password" 
                    disabled={isLoading} 
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <div className="input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={error && confirmPassword ? "error" : ""} 
                    value={confirmPassword} 
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }} 
                    placeholder="Confirm New Password" 
                    disabled={isLoading} 
                  />
                </div>
                {error && <span className="error-message">{error}</span>}
              </div>
              <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p>{t("remember_password") || "Remember your password?"} <Link to="/login">{t("login")}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
