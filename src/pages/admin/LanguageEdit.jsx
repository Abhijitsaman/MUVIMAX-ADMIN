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

const LanguageEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nativeName: '',
    code: '',
    country: '',
    flag: '🌐',
    direction: 'ltr',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const docRef = doc(db, 'languages', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLanguage({ id: docSnap.id, ...data });
          setFormData({
            name: data.name || '',
            nativeName: data.nativeName || '',
            code: data.code || '',
            country: data.country || '',
            flag: data.flag || '🌐',
            direction: data.direction || 'ltr',
            status: data.status || 'active'
          });
        } else {
          setError('Language not found');
        }
      } catch (err) {
        console.error('Error fetching language:', err);
        setError('Failed to load language');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguage();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Language name is required';
    if (!formData.code) newErrors.code = 'Language code is required';
    if (formData.code.length !== 2) newErrors.code = 'Code must be 2 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'languages', id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating language:', err);
      setError('Failed to update language');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'languages', id));
      navigate('/admin/languages');
    } catch (err) {
      console.error('Error deleting language:', err);
      setError('Failed to delete language');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading language...</p>
      </div>
    );
  }

  if (error || !language) {
    return (
      <div className="page-error">
        <FaExclamationTriangle size={48} />
        <h2>{error || 'Language not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/languages')}>
          <FaArrowLeft /> Back to Languages
        </button>
      </div>
    );
  }

  return (
    <div className="language-edit-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/languages')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Edit Language</h1>
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
          <span>Language updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
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
                  onChange={handleInputChange}
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
                <h3>Delete Language</h3>
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

export default LanguageEdit;
