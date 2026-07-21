import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  FaArrowLeft,
  FaSave,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const GenreEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [genre, setGenre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#e50914',
    icon: '🎵',
    visibility: 'visible',
    seoTitle: '',
    seoDescription: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchGenre = async () => {
      try {
        const docRef = doc(db, 'genres', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGenre({ id: docSnap.id, ...data });
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            color: data.color || '#e50914',
            icon: data.icon || '🎵',
            visibility: data.visibility || 'visible',
            seoTitle: data.seoTitle || '',
            seoDescription: data.seoDescription || ''
          });
        } else {
          setError('Genre not found');
        }
      } catch (err) {
        console.error('Error fetching genre:', err);
        setError('Failed to load genre');
      } finally {
        setLoading(false);
      }
    };

    fetchGenre();
  }, [id]);

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
    if (!formData.name) newErrors.name = 'Genre name is required';
    if (!formData.slug) newErrors.slug = 'Slug is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'genres', id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating genre:', err);
      setError('Failed to update genre');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'genres', id));
      navigate('/admin/genres');
    } catch (err) {
      console.error('Error deleting genre:', err);
      setError('Failed to delete genre');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading genre...</p>
      </div>
    );
  }

  if (error || !genre) {
    return (
      <div className="page-error">
        <FaExclamationTriangle size={48} />
        <h2>{error || 'Genre not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/genres')}>
          <FaArrowLeft /> Back to Genres
        </button>
      </div>
    );
  }

  return (
    <div className="genre-edit-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/genres')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Edit Genre</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
            <FaTrash /> Delete
          </button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Genre updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <div className="genre-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <h3>Genre Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Genre Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
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
                  rows={3}
                  className="form-textarea"
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
                  maxLength="160"
                  rows="2"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Delete Genre</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationTriangle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{formData.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <FaTrash /> Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenreEdit;
