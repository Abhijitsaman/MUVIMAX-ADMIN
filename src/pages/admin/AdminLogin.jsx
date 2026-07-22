import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FaGoogle, 
  FaShieldAlt,
  FaSpinner
} from 'react-icons/fa';
import { IoMdCheckmarkCircle } from 'react-icons/io';

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { loginWithGoogle, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, isAdmin, navigate]);

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
      if (result.error?.includes('admin')) {
        setError('You are not authorized as an admin. Please contact support.');
      } else if (result.error?.includes('popup-closed')) {
        setError('Login cancelled. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
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

            <div className="login-form">
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
                    Sign in with Google
                  </>
                )}
              </button>
            </div>

            <div className="login-divider">
              <span>Secure Admin Access</span>
            </div>

            <div className="login-security-badge">
              <FaShieldAlt className="security-icon" />
              <span>Protected by Google Authentication</span>
            </div>

            <div className="login-info">
              <p className="info-text">
                🔐 Only authorized administrators can access this panel.
              </p>
            </div>
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
