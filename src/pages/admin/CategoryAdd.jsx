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
  FaLayerGroup
} from 'react-icons/fa';

const CategoryAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📁',
    visibility: 'visible',
    seoTitle: '',
    seoDescription: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

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
    if (!formData.name) newErrors.name = 'Category name is required';
    if (!formData.slug) newErrors.slug = 'Slug is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const categoryData = {
        ...formData,
        movieCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'categories'), categoryData);
      setSuccess(true);
      setTimeout(() => navigate('/admin/categories'), 1500);
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this category?')) {
      navigate('/admin/categories');
    }
  };

  return (
    <div className="category-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/categories')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Add Category</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Saving...' : 'Save Category'}
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
          <span>Category saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="category-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <h3>Category Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Action, Comedy, Drama, etc."
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
                  placeholder="action-comedy"
                  className={`form-input ${errors.slug ? 'error' : ''}`}
                />
                {errors.slug && <span className="error-text">{errors.slug}</span>}
              </div>

              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="📁"
                  className="form-input"
                  maxLength={2}
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Category description"
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

              <div className="form-group full-width">
                <label>SEO Title</label>
                <input
                  type="text"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleInputChange}
                  placeholder="SEO title (max 60 chars)"
                  maxLength="60"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>SEO Description</label>
                <textarea
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleInputChange}
                  placeholder="SEO description (max 160 chars)"
                  maxLength="160"
                  rows="2"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryAdd;
