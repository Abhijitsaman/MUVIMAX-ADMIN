import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaEnvelope,
  FaLock,
  FaShieldAlt
} from 'react-icons/fa';

const AdminAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    status: 'active'
  });

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
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Create admin document in Firestore
      const adminData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        permissions: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        uid: userCredential.user.uid
      };

      await addDoc(collection(db, 'admins'), adminData);
      
      setSuccess(true);
      setTimeout(() => navigate('/admin/admins'), 1500);
    } catch (error) {
      console.error('Error creating admin:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this admin?')) {
      navigate('/admin/admins');
    }
  };

  return (
    <div className="admin-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/admins')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Add Admin</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Creating...' : 'Create Admin'}
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
          <span>Admin created successfully! Redirecting...</span>
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
                  placeholder="John Doe"
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
                  placeholder="admin@example.com"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min 8 characters"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
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
    </div>
  );
};

export default AdminAdd;
