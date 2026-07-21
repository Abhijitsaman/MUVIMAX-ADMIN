import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaGoogle, FaApple } from 'react-icons/fa';
import { IoMdCheckmarkCircle } from 'react-icons/io';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { login, resetPassword, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const result = await login(email, password, rememberMe);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!resetEmail) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(resetEmail);
    
    if (result.success) {
      setResetSent(true);
      setTimeout(() => {
        setIsForgotPassword(false);
        setResetSent(false);
        setResetEmail('');
      }, 3000);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="admin-login-page">
      <div className="login-background">
        <div className="login-background-overlay"></div>
        <div className="login-background-glow glow-1"></div>
        <div className="login-background-glow glow-2"></div>
        <div className="login-background-glow glow-3"></div>
      </div>

      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="login-card"
        >
          <div className="login-header">
            <div className="login-logo">
              <span className="logo-icon">🎬</span>
              <span className="logo-text">MUVIMAX</span>
            </div>
            <span className="login-badge">Admin Panel</span>
          </div>

          <div className="login-body">
            {!isForgotPassword ? (
              <>
                <h2>Welcome Back</h2>
                <p className="login-subtitle">Sign in to manage your OTT platform</p>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-error"
                  >
                    <span className="error-icon">⚠</span>
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-success"
                  >
                    <IoMdCheckmarkCircle size={20} />
                    Login successful! Redirecting...
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <div className="input-wrapper">
                      <FaUser className="input-icon" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="login-input"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="login-input"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="forgot-password"
                      onClick={() => setIsForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    className={`login-btn ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <FaArrowRight className="btn-icon" />
                      </>
                    )}
                  </button>
                </form>

                <div className="login-divider">
                  <span>Secure Admin Access</span>
                </div>

                <div className="login-security-badge">
                  <FaShieldAlt className="security-icon" />
                  <span>Protected by Firebase Authentication</span>
                </div>
              </>
            ) : (
              <>
                <h2>Reset Password</h2>
                <p className="login-subtitle">
                  Enter your email to receive a password reset link
                </p>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-error"
                  >
                    <span className="error-icon">⚠</span>
                    {error}
                  </motion.div>
                )}

                {resetSent && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="login-success"
                  >
                    <IoMdCheckmarkCircle size={20} />
                    Password reset email sent! Check your inbox.
                  </motion.div>
                )}

                <form onSubmit={handleResetPassword} className="login-form">
                  <div className="form-group">
                    <div className="input-wrapper">
                      <FaUser className="input-icon" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        disabled={isLoading || resetSent}
                        className="login-input"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className={`login-btn ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading || resetSent}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  <button
                    type="button"
                    className="back-to-login"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                    }}
                  >
                    ← Back to login
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="login-footer">
            <span>© {new Date().getFullYear()} MUVIMAX. All rights reserved.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
