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
  FaLanguage,
  FaGlobe
} from 'react-icons/fa';

const LanguageAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    nativeName: '',
    code: '',
    country: '',
    flag: '🌐',
    direction: 'ltr',
    status: 'active'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Auto-generate code from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    const code = name
      .toLowerCase()
      .substring(0, 2);
    setFormData(prev => ({ ...prev, name, code }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Language name is required';
    if (!formData.code) newErrors.code = 'Language code is required';
    if (formData.code.length !== 2) newErrors.code = 'Code must be 2 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const languageData = {
        ...formData,
        movieCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'languages'), languageData);
      setSuccess(true);
      setTimeout(() => navigate('/admin/languages'), 1500);
    } catch (error) {
      console.error('Error saving language:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this language?')) {
      navigate('/admin/languages');
    }
  };

  return (
    <div className="language-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/languages')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Add Language</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Saving...' : 'Save Language'}
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
          <span>Language saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="language-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <h3>Language Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Language Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="English, Spanish, etc."
                  className={`form-input ${errors.name ? 'error' : ''}`}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Native Name</label>
                <input
                  type="text"
                  name="nativeName"
                  value={formData.nativeName}
                  onChange={handleInputChange}
                  placeholder="Native language name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Language Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="en, es, fr"
                  maxLength="2"
                  className={`form-input ${errors.code ? 'error' : ''}`}
                />
                {errors.code && <span className="error-text">{errors.code}</span>}
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Flag (emoji)</label>
                <input
                  type="text"
                  name="flag"
                  value={formData.flag}
                  onChange={handleInputChange}
                  placeholder="🌐"
                  className="form-input"
                  maxLength={2}
                />
              </div>

              <div className="form-group">
                <label>Direction</label>
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="ltr">LTR (Left to Right)</option>
                  <option value="rtl">RTL (Right to Left)</option>
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
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageAdd;
