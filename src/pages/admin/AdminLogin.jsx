import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FaGoogle, 
  FaShieldAlt,
  FaSpinner,
  FaFilm,
  FaPlay,
  FaStar,
  FaTv
} from 'react-icons/fa';
import { IoMdCheckmarkCircle } from 'react-icons/io';

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess(false);
    setIsLoading(true);

    const result = await loginWithGoogle();
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } else {
      if (result.error?.includes('popup-closed')) {
        setError('Login cancelled. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="admin-login-page">
      {/* Animated Background */}
      <div className="login-background">
        <div className="login-background-overlay"></div>
        
        {/* Animated Gradient Orbs */}
        <motion.div 
          className="login-background-glow glow-1"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="login-background-glow glow-2"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="login-background-glow glow-3"
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating Elements */}
        <motion.div 
          className="floating-icon icon-1"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <FaFilm size={24} />
        </motion.div>
        <motion.div 
          className="floating-icon icon-2"
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <FaPlay size={24} />
        </motion.div>
        <motion.div 
          className="floating-icon icon-3"
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <FaStar size={24} />
        </motion.div>
        <motion.div 
          className="floating-icon icon-4"
          animate={{ y: [15, -15, 15] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <FaTv size={24} />
        </motion.div>
      </div>

      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="login-card"
        >
          {/* Premium Badge */}
          <motion.div 
            className="premium-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <FaShieldAlt />
            <span>Admin Access</span>
          </motion.div>

          <div className="login-header">
            <motion.div 
              className="login-logo"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="logo-icon">🎬</span>
              <span className="logo-text">MUVIMAX</span>
            </motion.div>
            <motion.span 
              className="login-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Admin Panel
            </motion.span>
          </div>

          <div className="login-body">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Welcome Back
            </motion.h2>
            <motion.p 
              className="login-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Sign in to manage your OTT platform
            </motion.p>

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

            <motion.div 
              className="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="google-login-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="spinning" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <FaGoogle className="google-icon" />
                    Continue with Google
                  </>
                )}
              </button>
            </motion.div>

            <motion.div 
              className="login-divider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span>Secure Admin Access</span>
            </motion.div>

            <motion.div 
              className="login-features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="feature-item">
                <span className="feature-icon">🔐</span>
                <span>Secure Authentication</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Full Analytics Control</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎬</span>
                <span>Content Management</span>
              </div>
            </motion.div>

            <motion.div 
              className="login-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <p className="info-text">
                🚀 Only authorized administrators can access this panel
              </p>
            </motion.div>
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
