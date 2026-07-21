import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBell,
  FaBullhorn,
  FaShieldAlt,
  FaInfoCircle,
  FaStar,
  FaUsers,
  FaUser,
  FaGlobe,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';

const NotificationAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system',
    target: 'all',
    priority: 'normal',
    status: 'draft',
    scheduleDate: '',
    scheduleTime: '',
    icon: '🔔',
    color: '#e50914',
    actionButton: '',
    actionLink: '',
    expiryDate: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.message) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const notificationData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        read: false,
        opened: false,
        delivered: false
      };

      // If status is published and no schedule date, publish immediately
      if (formData.status === 'published' && !formData.scheduleDate) {
        notificationData.publishedAt = serverTimestamp();
        notificationData.delivered = true;
      }

      await addDoc(collection(db, 'notifications'), notificationData);
      setSuccess(true);
      setTimeout(() => navigate('/admin/notifications'), 1500);
    } catch (error) {
      console.error('Error saving notification:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this notification?')) {
      navigate('/admin/notifications');
    }
  };

  const typeOptions = [
    { value: 'system', label: 'System', icon: FaInfoCircle },
    { value: 'movie', label: 'Movie', icon: FaStar },
    { value: 'announcement', label: 'Announcement', icon: FaBullhorn },
    { value: 'promotion', label: 'Promotion', icon: FaBullhorn },
    { value: 'security', label: 'Security', icon: FaShieldAlt },
    { value: 'warning', label: 'Warning', icon: FaExclamationTriangle },
    { value: 'information', label: 'Information', icon: FaInfoCircle }
  ];

  const targetOptions = [
    { value: 'all', label: 'All Users', icon: FaGlobe },
    { value: 'admins', label: 'Admins Only', icon: FaUsers },
    { value: 'premium', label: 'Premium Users', icon: FaUser },
    { value: 'guests', label: 'Guest Users', icon: FaUser }
  ];

  return (
    <div className="notification-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/notifications')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Send Notification</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Saving...' : 'Send Notification'}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{errors.submit}</span>
        </div>
      )}

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Notification sent successfully! Redirecting...</span>
        </div>
      )}

      <div className="notification-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <h3>Notification Details</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Notification title"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group full-width">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Notification message"
                  rows={4}
                  className={`form-textarea ${errors.message ? 'error' : ''}`}
                />
                {errors.message && <span className="error-text">{errors.message}</span>}
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {typeOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <select
                  name="target"
                  value={formData.target}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {targetOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
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
                  <option value="draft">Draft</option>
                  <option value="published">Publish Now</option>
                  <option value="scheduled">Schedule</option>
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <>
                  <div className="form-group">
                    <label>Schedule Date</label>
                    <input
                      type="date"
                      name="scheduleDate"
                      value={formData.scheduleDate}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Schedule Time</label>
                    <input
                      type="time"
                      name="scheduleTime"
                      value={formData.scheduleTime}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="🔔"
                  className="form-input"
                  maxLength={2}
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={handleInputChange}
                    name="color"
                    className="form-input color-hex"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Action Button Text</label>
                <input
                  type="text"
                  name="actionButton"
                  value={formData.actionButton}
                  onChange={handleInputChange}
                  placeholder="Learn More"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Action Link</label>
                <input
                  type="url"
                  name="actionLink"
                  value={formData.actionLink}
                  onChange={handleInputChange}
                  placeholder="https://example.com/page"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section full-width preview-section">
            <h3>Preview</h3>
            <div className="notification-preview">
              <div 
                className="preview-card"
                style={{ backgroundColor: formData.color + '15', borderLeftColor: formData.color }}
              >
                <div className="preview-icon" style={{ color: formData.color }}>
                  <span>{formData.icon}</span>
                </div>
                <div className="preview-content">
                  <h4>{formData.title || 'Notification Title'}</h4>
                  <p>{formData.message || 'Notification message will appear here...'}</p>
                  {formData.actionButton && (
                    <button 
                      className="preview-action"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.actionButton}
                    </button>
                  )}
                  <span className="preview-time">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationAdd;
