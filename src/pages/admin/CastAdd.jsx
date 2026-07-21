import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserTie,
  FaCamera,
  FaCloudUploadAlt
} from 'react-icons/fa';

const CastAdd = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    originalName: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    biography: '',
    knownFor: '',
    socialLinks: '',
    status: 'active'
  });

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
      setErrors(prev => ({ ...prev, photo: 'Please upload a valid image (JPEG, PNG, WebP)' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setPhotoFile(file);
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
          setErrors(prev => ({ ...prev, photo: 'Failed to upload photo' }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const castData = {
        ...formData,
        movieCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'cast'), castData);
      setSuccess(true);
      setTimeout(() => navigate('/admin/cast'), 1500);
    } catch (error) {
      console.error('Error saving cast member:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this cast member?')) {
      navigate('/admin/cast');
    }
  };

  return (
    <div className="cast-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/cast')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Add Cast Member</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading || isUploading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Saving...' : 'Save Cast Member'}
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
          <span>Cast member saved successfully! Redirecting...</span>
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
                          setPhotoFile(null);
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
                  placeholder="Full name"
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
                  placeholder="Original name"
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
                  placeholder="Nationality"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Biography</label>
                <textarea
                  name="biography"
                  value={formData.biography}
                  onChange={handleInputChange}
                  placeholder="Biography"
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
                  placeholder="Known for roles"
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
                  placeholder="Instagram, Twitter, etc."
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
    </div>
  );
};

export default CastAdd;
