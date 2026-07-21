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
  FaTimes,
  FaUser,
  FaEnvelope,
  FaShieldAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const AdminEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const q = query(collection(db, 'admins'), where('uid', '==', id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setAdmin({ id: doc.id, ...data });
          setFormData({
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'admin',
            status: data.status || 'active'
          });
        } else {
          setError('Admin not found');
        }
      } catch (err) {
        console.error('Error fetching admin:', err);
        setError('Failed to load admin');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
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
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'admins', admin.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating admin:', err);
      setError('Failed to update admin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'admins', admin.id));
      navigate('/admin/admins');
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError('Failed to delete admin');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin...</p>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="page-error">
        <FaExclamationTriangle size={48} />
        <h2>{error || 'Admin not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/admins')}>
          <FaArrowLeft /> Back to Admins
        </button>
      </div>
    );
  }

  return (
    <div className="admin-edit-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/admins')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Edit Admin</h1>
        </div>
        <div className="page-header-right">
          {admin.role !== 'super_admin' && (
            <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
              <FaTrash /> Delete
            </button>
          )}
          <button className="btn btn-primary" onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Admin updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <h3>Admin Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group full-width">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="editor">Editor</option>
                  <option value="content_manager">Content Manager</option>
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
                <h3>Delete Admin</h3>
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

export default AdminEdit;
