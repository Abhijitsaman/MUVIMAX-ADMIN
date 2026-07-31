import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGoogle, FaSpinner, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ripples, setRipples] = useState([]);

  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  // Handle ripple effect on button click
  const handleRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = {
      id: Date.now(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
  };

  const handleGoogleLogin = async (e) => {
    handleRipple(e);
    setError('');
    setSuccess(false);
    setIsLoading(true);

    const result = await loginWithGoogle();
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1200);
    } else {
      if (result.error?.includes('popup-closed')) {
        setError('Login cancelled. Please try again.');
      } else if (result.error?.includes('network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Unable to sign in. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // Particles animation
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5
  }));

  return (
    <div className="admin-login-page">
      {/* Background */}
      <div className="login-background">
        {/* Gradients */}
        <div className="login-background-overlay"></div>
        <div className="login-bg-gradient gradient-1"></div>
        <div className="login-bg-gradient gradient-2"></div>
        <div className="login-bg-gradient gradient-3"></div>
        
        {/* Particles */}
        <div className="login-particles">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="particle"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Floating Orbs */}
        <motion.div 
          className="floating-orb orb-1"
          animate={{ 
            y: [0, -40, 0],
            x: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="floating-orb orb-2"
          animate={{ 
            y: [0, 50, 0],
            x: [0, -40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="floating-orb orb-3"
          animate={{ 
            y: [0, -30, 0],
            x: [0, -20, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Login Container */}
      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="login-card"
        >
          {/* Security Badge */}
          <motion.div 
            className="security-badge"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <FaShieldAlt />
            <span>Secure Admin Access</span>
          </motion.div>

          {/* Header */}
          <div className="login-header">
            <motion.div 
              className="login-logo"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="logo-icon-wrapper">
                <span className="logo-icon">🎬</span>
              </div>
              <div className="logo-text-wrapper">
                <span className="logo-text">MUVIMAX</span>
                <span className="logo-subtitle">Admin Dashboard</span>
              </div>
            </motion.div>
          </div>

          {/* Body */}
          <div className="login-body">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h2 className="login-title">Welcome back</h2>
              <p className="login-subtitle">
                Sign in to continue managing your OTT platform
              </p>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="login-error"
                >
                  <span className="error-icon">✕</span>
                  <span className="error-text">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="login-success"
                >
                  <FaCheckCircle className="success-icon" />
                  <span>Login successful! Redirecting...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="login-form"
            >
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || success}
                className={`google-login-btn ${isLoading ? 'loading' : ''} ${success ? 'success' : ''}`}
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="ripple-effect"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: ripple.size,
                      height: ripple.size,
                    }}
                  />
                ))}
                <span className="btn-content">
                  {isLoading ? (
                    <>
                      <FaSpinner className="spinner-icon" />
                      <span className="btn-text">Signing you in...</span>
                    </>
                  ) : success ? (
                    <>
                      <FaCheckCircle className="success-icon-btn" />
                      <span className="btn-text">Login successful</span>
                    </>
                  ) : (
                    <>
                      <FaGoogle className="google-icon" />
                      <span className="btn-text">Continue with Google</span>
                    </>
                  )}
                </span>
              </button>
            </motion.div>

            {/* Features */}
            <motion.div
              className="login-features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="feature-item">
                <span className="feature-icon">🔐</span>
                <span>Secure Authentication</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Real-time Analytics</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎬</span>
                <span>Content Management</span>
              </div>
            </motion.div>

            {/* Footer Text */}
            <motion.div
              className="login-footer-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <p className="footer-info">
                Protected by Google Authentication • Only authorized administrators can access this panel
              </p>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <span>© {new Date().getFullYear()} MUVIMAX. All rights reserved.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
