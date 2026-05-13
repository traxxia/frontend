import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../styles/Login.css";
import logo from '../assets/traxxia-logo.png';
import { Sun, Moon, Eye, EyeOff } from "lucide-react";
import { useUIStore } from "../store/uiStore";
import { useTranslation } from "../hooks/useTranslation";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useUIStore(state => state.theme);
  const toggleTheme = useUIStore(state => state.toggleTheme);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const { t } = useTranslation();

  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/reset-password`, { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. The link may have expired.");
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
          <h2>{t("reset_password_title") || "Reset Password"}</h2>
          <p className="login-subtitle">{t("reset_password_subtitle") || "Enter your new password below."}</p>

          {message ? (
            <div className="success-message" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #10b981' }}>
              {message} Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
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
                    placeholder={t("new_password") || "New Password"} 
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
                    placeholder={t("confirm_new_password") || "Confirm New Password"} 
                    disabled={isLoading} 
                  />
                </div>
                {error && <span className="error-message">{error}</span>}
              </div>

              <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                {isLoading ? t("resetting") || "Resetting..." : t("reset_password_button") || "Reset Password"}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p><Link to="/login">{t("back_to_login") || "Back to Login"}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
