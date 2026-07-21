import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword, updateEmail } from 'firebase/auth';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCamera,
  FaUserCircle,
  FaShieldAlt,
  FaClock,
  FaCalendarAlt,
  FaMobile,
  FaDesktop
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const AdminProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phone: '',
    photoURL: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [adminData, setAdminData] = useState({
    role: '',
    status: '',
    createdAt: null,
    lastLogin: null,
    permissions: []
  });
  const [sessions, setSessions] = useState([
    { device: 'Chrome on Windows', location: 'New York, US', lastActive: new Date(), current: true },
    { device: 'Safari on iPhone', location: 'Los Angeles, US', lastActive: new Date(Date.now() - 86400000), current: false }
  ]);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentUser) return;
      
      try {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          setAdminData({
            role: data.role || 'admin',
            status: data.status || 'active',
            createdAt: data.createdAt || null,
            lastLogin: data.lastLogin || null,
            permissions: data.permissions || []
          });
        }
        
        setProfileData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: currentUser.phoneNumber || '',
          photoURL: currentUser.photoURL || ''
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      await updateProfile(currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });
      
      await updateDoc(doc(db, 'admins', currentUser.uid), {
        name: profileData.displayName,
        phone: profileData.phone,
        updatedAt: serverTimestamp()
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      setSaving(false);
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setSaving(false);
      return;
    }
    
    try {
      await updatePassword(currentUser, passwordData.newPassword);
      setSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="admin-profile">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Admin Profile</h1>
          <span className="page-count">Manage your account</span>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            {profileData.photoURL ? (
              <img src={profileData.photoURL} alt="Profile" className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-placeholder">
                <FaUserCircle size={80} />
              </div>
            )}
            <button className="change-avatar-btn">
              <FaCamera />
              Change Photo
            </button>
          </div>

          <div className="profile-info-card">
            <h4>{profileData.displayName || 'Admin User'}</h4>
            <p className="profile-email">{profileData.email}</p>
            <div className="profile-badges">
              <span className={`role-badge ${adminData.role === 'super_admin' ? 'danger' : 'primary'}`}>
                <FaShieldAlt /> {adminData.role?.replace('_', ' ').toUpperCase() || 'Admin'}
              </span>
              <span className={`status-badge ${adminData.status === 'active' ? 'success' : 'secondary'}`}>
                {adminData.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="profile-tabs">
            <button 
              className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FaUser /> Profile
            </button>
            <button 
              className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FaLock /> Security
            </button>
            <button 
              className={`profile-tab ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              <FaDesktop /> Sessions
            </button>
          </div>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <h3>Profile Information</h3>
              <form onSubmit={handleProfileUpdate}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="form-input disabled"
                    />
                    <span className="input-hint">Email cannot be changed here. Contact support.</span>
                  </div>
                  <div className="form-group full-width">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Profile Photo URL</label>
                    <input
                      type="url"
                      value={profileData.photoURL}
                      onChange={(e) => setProfileData(prev => ({ ...prev, photoURL: e.target.value }))}
                      className="form-input"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <div className="form-actions full-width">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                      {saving ? 'Saving...' : 'Update Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="profile-section">
              <h3>Security Settings</h3>
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="form-input"
                      required
                      minLength="8"
                    />
                    <span className="input-hint">Minimum 8 characters</span>
                  </div>
                  <div className="form-group full-width">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-actions full-width">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <FaSpinner className="spinning" /> : <FaLock />}
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="security-info">
                <h4>Two-Factor Authentication</h4>
                <p>Add an extra layer of security to your account</p>
                <button className="btn btn-secondary">Enable 2FA</button>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="profile-section">
              <h3>Active Sessions</h3>
              <div className="sessions-list">
                {sessions.map((session, index) => (
                  <div key={index} className="session-item">
                    <div className="session-icon">
                      {session.device.includes('iPhone') || session.device.includes('Android') ? 
                        <FaMobile size={24} /> : <FaDesktop size={24} />
                      }
                    </div>
                    <div className="session-info">
                      <h4>{session.device}</h4>
                      <p>{session.location}</p>
                      <span className="session-time">
                        Last active: {format(session.lastActive, 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {session.current && (
                      <span className="session-current">Current Session</span>
                    )}
                    {!session.current && (
                      <button className="btn btn-danger btn-sm">Terminate</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="session-actions">
                <button className="btn btn-danger">Terminate All Other Sessions</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
