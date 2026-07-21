import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaClock,
  FaFilm,
  FaStar,
  FaComment,
  FaHeart,
  FaBookmark,
  FaEye,
  FaEdit,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaBan,
  FaCheck,
  FaShieldAlt,
  FaHistory
} from 'react-icons/fa';
import { format } from 'date-fns';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'user',
    status: 'active',
    emailVerified: false,
    createdAt: null,
    lastLogin: null,
    photoURL: ''
  });
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    role: 'user',
    status: 'active'
  });
  const [stats, setStats] = useState({
    moviesWatched: 0,
    watchlistCount: 0,
    favoritesCount: 0,
    reviewsCount: 0,
    commentsCount: 0,
    watchTime: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            displayName: data.displayName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            role: data.role || 'user',
            status: data.status || 'active',
            emailVerified: data.emailVerified || false,
            createdAt: data.createdAt || null,
            lastLogin: data.lastLogin || null,
            photoURL: data.photoURL || ''
          });
          setFormData({
            displayName: data.displayName || '',
            phoneNumber: data.phoneNumber || '',
            role: data.role || 'user',
            status: data.status || 'active'
          });
          
          // Mock stats
          setStats({
            moviesWatched: data.moviesWatched || 0,
            watchlistCount: data.watchlistCount || 0,
            favoritesCount: data.favoritesCount || 0,
            reviewsCount: data.reviewsCount || 0,
            commentsCount: data.commentsCount || 0,
            watchTime: data.watchTime || 0
          });
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'users', id), {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        status: formData.status,
        updatedAt: serverTimestamp()
      });
      
      setUserData(prev => ({
        ...prev,
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        status: formData.status
      }));
      
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = userData.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setUserData(prev => ({ ...prev, status: newStatus }));
      setFormData(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <FaExclamationTriangle size={48} />
        <h2>{error}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
          <FaArrowLeft /> Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>
            <FaArrowLeft /> Back
          </button>
          <h1>User Profile</h1>
        </div>
        <div className="page-header-right">
          <button 
            className={`btn ${userData.status === 'active' ? 'btn-warning' : 'btn-success'}`}
            onClick={handleToggleStatus}
          >
            {userData.status === 'active' ? <FaBan /> : <FaCheck />}
            {userData.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
              {saving ? <FaSpinner className="spinning" /> : <FaSave />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>User updated successfully!</span>
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
            {userData.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-placeholder">
                <FaUser size={80} />
              </div>
            )}
            <h4>{userData.displayName || 'User'}</h4>
            <p className="profile-email">{userData.email}</p>
            <div className="profile-badges">
              <span className={`role-badge ${userData.role === 'admin' ? 'danger' : 'secondary'}`}>
                <FaShieldAlt /> {userData.role || 'user'}
              </span>
              <span className={`status-badge ${userData.status === 'active' ? 'success' : 'warning'}`}>
                {userData.status || 'active'}
              </span>
              {userData.emailVerified && (
                <span className="status-badge success">
                  <FaCheck /> Verified
                </span>
              )}
            </div>
          </div>

          <div className="profile-info-card">
            <div className="info-item">
              <FaCalendarAlt />
              <span>Joined: {userData.createdAt?.toDate?.() 
                ? format(userData.createdAt.toDate(), 'MMM d, yyyy')
                : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <FaClock />
              <span>Last Login: {userData.lastLogin?.toDate?.() 
                ? format(userData.lastLogin.toDate(), 'MMM d, yyyy h:mm a')
                : 'Never'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3>User Information</h3>
            {isEditing ? (
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="form-input disabled"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="user">User</option>
                    <option value="premium">Premium</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="user-details">
                <div className="detail-row">
                  <label>Display Name</label>
                  <span>{userData.displayName || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Email</label>
                  <span>{userData.email}</span>
                </div>
                <div className="detail-row">
                  <label>Phone</label>
                  <span>{userData.phoneNumber || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Role</label>
                  <span className={`role-badge ${userData.role === 'admin' ? 'danger' : 'secondary'}`}>
                    {userData.role || 'user'}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Status</label>
                  <span className={`status-badge ${userData.status === 'active' ? 'success' : 'warning'}`}>
                    {userData.status || 'active'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-section">
            <h3>Activity Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <FaFilm />
                <div>
                  <h4>{stats.moviesWatched}</h4>
                  <p>Movies Watched</p>
                </div>
              </div>
              <div className="stat-item">
                <FaBookmark />
                <div>
                  <h4>{stats.watchlistCount}</h4>
                  <p>Watchlist</p>
                </div>
              </div>
              <div className="stat-item">
                <FaHeart />
                <div>
                  <h4>{stats.favoritesCount}</h4>
                  <p>Favorites</p>
                </div>
              </div>
              <div className="stat-item">
                <FaStar />
                <div>
                  <h4>{stats.reviewsCount}</h4>
                  <p>Reviews</p>
                </div>
              </div>
              <div className="stat-item">
                <FaComment />
                <div>
                  <h4>{stats.commentsCount}</h4>
                  <p>Comments</p>
                </div>
              </div>
              <div className="stat-item">
                <FaClock />
                <div>
                  <h4>{Math.round(stats.watchTime / 60)}h</h4>
                  <p>Watch Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
