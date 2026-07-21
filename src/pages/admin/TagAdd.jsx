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
  FaTags,
  FaPalette
} from 'react-icons/fa';

const TagAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#666',
    visibility: 'visible'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Tag name is required';
    if (!formData.slug) newErrors.slug = 'Slug is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const tagData = {
        ...formData,
        movieCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'tags'), tagData);
      setSuccess(true);
      setTimeout(() => navigate('/admin/tags'), 1500);
    } catch (error) {
      console.error('Error saving tag:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this tag?')) {
      navigate('/admin/tags');
    }
  };

  return (
    <div className="tag-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/tags')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Add Tag</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Saving...' : 'Save Tag'}
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
          <span>Tag saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="tag-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <h3>Tag Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Tag Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Trending, Award Winning, etc."
                  className={`form-input ${errors.name ? 'error' : ''}`}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="trending-award-winning"
                  className={`form-input ${errors.slug ? 'error' : ''}`}
                />
                {errors.slug && <span className="error-text">{errors.slug}</span>}
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
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tag description"
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label>Visibility</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagAdd;
