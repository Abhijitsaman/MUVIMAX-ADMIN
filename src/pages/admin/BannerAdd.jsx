import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaImage,
  FaLink,
  FaCloudUploadAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const BannerAdd = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    ctaText: 'Watch Now',
    ctaText2: '',
    order: 0,
    status: 'draft',
    visibility: 'visible',
    linkType: 'movie',
    movieId: '',
    movieTitle: '',
    customUrl: '',
    internalRoute: '',
    publishDate: '',
    publishTime: '',
    expireDate: '',
    expireTime: '',
    autoRotate: true,
    rotationInterval: 5,
    loop: true,
    pauseOnHover: true
  });

  const [bannerImage, setBannerImage] = useState({
    method: 'upload',
    file: null,
    url: '',
    preview: '',
    uploadProgress: 0,
    isUploading: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    // Fetch movies for linking
    const fetchMovies = async () => {
      setLoadingMovies(true);
      try {
        const moviesSnapshot = await getDocs(collection(db, 'movies'));
        const moviesData = [];
        moviesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'published') {
            moviesData.push({ id: doc.id, ...data });
          }
        });
        setMovies(moviesData);
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
      setLoadingMovies(false);
    };
    fetchMovies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Please upload a valid image file (JPEG, PNG, WebP, GIF)' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerImage(prev => ({ 
        ...prev, 
        file, 
        preview: e.target.result, 
        isUploading: true 
      }));

      // Upload to Firebase Storage
      const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setBannerImage(prev => ({ ...prev, uploadProgress: progress }));
        },
        (error) => {
          console.error('Upload error:', error);
          setBannerImage(prev => ({ ...prev, isUploading: false }));
          setErrors(prev => ({ ...prev, image: 'Failed to upload image' }));
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setBannerImage(prev => ({ 
            ...prev, 
            url, 
            isUploading: false, 
            uploadProgress: 100 
          }));
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!bannerImage.url && !bannerImage.preview) {
      newErrors.image = 'Banner image is required';
    }
    if (formData.linkType === 'movie' && !formData.movieId) {
      newErrors.movieId = 'Please select a movie';
    }
    if (formData.linkType === 'custom' && !formData.customUrl) {
      newErrors.customUrl = 'Custom URL is required';
    }
    if (formData.linkType === 'internal' && !formData.internalRoute) {
      newErrors.internalRoute = 'Internal route is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const bannerData = {
        ...formData,
        image: bannerImage.url || bannerImage.preview,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
        clicks: 0
      };

      await addDoc(collection(db, 'heroBanners'), bannerData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/banners');
      }, 1500);
    } catch (error) {
      console.error('Error saving banner:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this banner?')) {
      navigate('/admin/banners');
    }
  };

  return (
    <div className="banner-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/banners')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Add Hero Banner</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Saving...' : 'Save Banner'}
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
          <span>Banner saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="banner-form">
        <div className="form-grid">
          {/* Banner Image */}
          <div className="form-section full-width">
            <h3>Banner Image</h3>
            <div className="image-upload-section">
              <div className="upload-method-selector">
                <label>Upload Method</label>
                <select
                  value={bannerImage.method}
                  onChange={(e) => setBannerImage(prev => ({ ...prev, method: e.target.value }))}
                  className="form-select"
                >
                  <option value="upload">Upload File</option>
                  <option value="url">Paste URL</option>
                </select>
              </div>

              {bannerImage.method === 'upload' ? (
                <div className="upload-dropzone large" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  {bannerImage.preview ? (
                    <div className="upload-preview">
                      <img src={bannerImage.preview} alt="Banner preview" />
                      {bannerImage.isUploading && (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${bannerImage.uploadProgress}%` }} />
                          <span>{Math.round(bannerImage.uploadProgress)}%</span>
                        </div>
                      )}
                      <button
                        className="remove-media"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBannerImage({ method: 'upload', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false });
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaCloudUploadAlt size={48} />
                      <p>Click or drag to upload banner image</p>
                      <span className="upload-hint">Recommended: 1920 × 1080 px (16:9)</span>
                      <span className="upload-hint">Max size: 10MB</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="url-input-group">
                  <input
                    type="url"
                    value={bannerImage.url}
                    onChange={(e) => {
                      setBannerImage(prev => ({ 
                        ...prev, 
                        url: e.target.value, 
                        preview: e.target.value 
                      }));
                    }}
                    placeholder="https://example.com/banner.jpg"
                    className="form-input"
                  />
                  {bannerImage.preview && (
                    <div className="upload-preview">
                      <img src={bannerImage.preview} alt="Banner preview" />
                      <button
                        className="remove-media"
                        onClick={() => setBannerImage({ method: 'url', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false })}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {errors.image && <span className="error-text">{errors.image}</span>}
            </div>
          </div>

          {/* Banner Information */}
          <div className="form-section full-width">
            <h3>Banner Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Banner Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter banner title"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group full-width">
                <label>Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Banner subtitle"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Banner description"
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label>CTA Button Text</label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleInputChange}
                  placeholder="Watch Now"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Second CTA Button Text</label>
                <input
                  type="text"
                  name="ctaText2"
                  value={formData.ctaText2}
                  onChange={handleInputChange}
                  placeholder="Learn More"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Banner Link */}
          <div className="form-section full-width">
            <h3>Banner Link</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Link Type</label>
                <select
                  name="linkType"
                  value={formData.linkType}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="movie">Movie</option>
                  <option value="category">Category</option>
                  <option value="genre">Genre</option>
                  <option value="custom">Custom URL</option>
                  <option value="internal">Internal Route</option>
                </select>
              </div>

              {formData.linkType === 'movie' && (
                <div className="form-group">
                  <label>Select Movie</label>
                  <select
                    name="movieId"
                    value={formData.movieId}
                    onChange={handleInputChange}
                    className={`form-select ${errors.movieId ? 'error' : ''}`}
                  >
                    <option value="">Select a movie</option>
                    {movies.map(movie => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                  {errors.movieId && <span className="error-text">{errors.movieId}</span>}
                </div>
              )}

              {formData.linkType === 'custom' && (
                <div className="form-group full-width">
                  <label>Custom URL</label>
                  <input
                    type="url"
                    name="customUrl"
                    value={formData.customUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/page"
                    className={`form-input ${errors.customUrl ? 'error' : ''}`}
                  />
                  {errors.customUrl && <span className="error-text">{errors.customUrl}</span>}
                </div>
              )}

              {formData.linkType === 'internal' && (
                <div className="form-group full-width">
                  <label>Internal Route</label>
                  <input
                    type="text"
                    name="internalRoute"
                    value={formData.internalRoute}
                    onChange={handleInputChange}
                    placeholder="/movies/action"
                    className={`form-input ${errors.internalRoute ? 'error' : ''}`}
                  />
                  {errors.internalRoute && <span className="error-text">{errors.internalRoute}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Status & Visibility */}
          <div className="form-section">
            <h3>Status & Visibility</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
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

          {/* Scheduling */}
          <div className="form-section">
            <h3>Schedule</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Publish Date</label>
                <input
                  type="date"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Publish Time</label>
                <input
                  type="time"
                  name="publishTime"
                  value={formData.publishTime}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Expire Date</label>
                <input
                  type="date"
                  name="expireDate"
                  value={formData.expireDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Expire Time</label>
                <input
                  type="time"
                  name="expireTime"
                  value={formData.expireTime}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Auto Rotation Settings */}
          <div className="form-section">
            <h3>Auto Rotation Settings</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="autoRotate"
                    checked={formData.autoRotate}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoRotate: e.target.checked }))}
                  />
                  Enable Auto Rotation
                </label>
              </div>

              {formData.autoRotate && (
                <>
                  <div className="form-group">
                    <label>Rotation Interval (seconds)</label>
                    <input
                      type="number"
                      name="rotationInterval"
                      value={formData.rotationInterval}
                      onChange={handleInputChange}
                      min="2"
                      max="60"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="loop"
                        checked={formData.loop}
                        onChange={(e) => setFormData(prev => ({ ...prev, loop: e.target.checked }))}
                      />
                      Loop
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="pauseOnHover"
                        checked={formData.pauseOnHover}
                        onChange={(e) => setFormData(prev => ({ ...prev, pauseOnHover: e.target.checked }))}
                      />
                      Pause on Hover
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerAdd;
