import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  FaArrowLeft,
  FaSave,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaCamera
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CastEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cast, setCast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoPreview, setPhotoPreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    originalName: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    biography: '',
    knownFor: '',
    socialLinks: '',
    photo: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCast = async () => {
      try {
        const docRef = doc(db, 'cast', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCast({ id: docSnap.id, ...data });
          setFormData({
            name: data.name || '',
            originalName: data.originalName || '',
            gender: data.gender || '',
            dateOfBirth: data.dateOfBirth || '',
            nationality: data.nationality || '',
            biography: data.biography || '',
            knownFor: data.knownFor || '',
            socialLinks: data.socialLinks || '',
            photo: data.photo || '',
            status: data.status || 'active'
          });
          if (data.photo) {
            setPhotoPreview(data.photo);
          }
        } else {
          setError('Cast member not found');
        }
      } catch (err) {
        console.error('Error fetching cast:', err);
        setError('Failed to load cast member');
      } finally {
        setLoading(false);
      }
    };

    fetchCast();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (file) => {
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, photo: 'Please upload a valid image' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setIsUploading(true);
      
      const storageRef = ref(storage, `cast/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setIsUploading(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, photo: url }));
          setIsUploading(false);
          setUploadProgress(100);
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'cast', id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating cast:', err);
      setError('Failed to update cast member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Delete photo from storage if exists
      if (formData.photo) {
        try {
          const photoRef = ref(storage, formData.photo);
          await deleteObject(photoRef);
        } catch (err) {
          console.log('Photo not found in storage');
        }
      }
      await deleteDoc(doc(db, 'cast', id));
      navigate('/admin/cast');
    } catch (err) {
      console.error('Error deleting cast:', err);
      setError('Failed to delete cast member');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading cast member...</p>
      </div>
    );
  }

  if (error || !cast) {
    return (
      <div className="page-error">
        <FaExclamationTriangle size={48} />
        <h2>{error || 'Cast member not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/cast')}>
          <FaArrowLeft /> Back to Cast
        </button>
      </div>
    );
  }

  return (
    <div className="cast-edit-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/cast')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Edit Cast Member</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
            <FaTrash /> Delete
          </button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={isSaving || isUploading}>
            {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Cast member updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <div className="cast-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <h3>Cast Member Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Photo</label>
                <div className="photo-upload">
                  {photoPreview ? (
                    <div className="photo-preview">
                      <img src={photoPreview} alt="Cast member" />
                      {isUploading && (
                        <div className="upload-overlay">
                          <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                      )}
                      <button
                        className="remove-photo"
                        onClick={() => {
                          setPhotoPreview('');
                          setFormData(prev => ({ ...prev, photo: '' }));
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="photo-placeholder" onClick={() => document.getElementById('photoInput').click()}>
                      <FaCamera size={32} />
                      <p>Upload Photo</p>
                      <input
                        id="photoInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                </div>
                {errors.photo && <span className="error-text">{errors.photo}</span>}
              </div>

              <div className="form-group">
                <label>Name *</label>
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
                <label>Original Name</label>
                <input
                  type="text"
                  name="originalName"
                  value={formData.originalName}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Biography</label>
                <textarea
                  name="biography"
                  value={formData.biography}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label>Known For</label>
                <input
                  type="text"
                  name="knownFor"
                  value={formData.knownFor}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Social Links</label>
                <input
                  type="text"
                  name="socialLinks"
                  value={formData.socialLinks}
                  onChange={handleInputChange}
                  className="form-input"
                />
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
                <h3>Delete Cast Member</h3>
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

export default CastEdit;
