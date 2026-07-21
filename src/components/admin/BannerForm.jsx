import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  FaCloudUploadAlt,
  FaImage,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';

const BannerForm = ({ initialData, onSubmit, isEditing = false }) => {
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

  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        subtitle: initialData.subtitle || '',
        description: initialData.description || '',
        ctaText: initialData.ctaText || 'Watch Now',
        ctaText2: initialData.ctaText2 || '',
        order: initialData.order || 0,
        status: initialData.status || 'draft',
        visibility: initialData.visibility || 'visible',
        linkType: initialData.linkType || 'movie',
        movieId: initialData.movieId || '',
        movieTitle: initialData.movieTitle || '',
        customUrl: initialData.customUrl || '',
        internalRoute: initialData.internalRoute || '',
        publishDate: initialData.publishDate || '',
        publishTime: initialData.publishTime || '',
        expireDate: initialData.expireDate || '',
        expireTime: initialData.expireTime || '',
        autoRotate: initialData.autoRotate !== undefined ? initialData.autoRotate : true,
        rotationInterval: initialData.rotationInterval || 5,
        loop: initialData.loop !== undefined ? initialData.loop : true,
        pauseOnHover: initialData.pauseOnHover !== undefined ? initialData.pauseOnHover : true
      });

      setBannerImage({
        method: 'url',
        file: null,
        url: initialData.image || '',
        preview: initialData.image || '',
        uploadProgress: 0,
        isUploading: false
      });
    }

    // Fetch movies
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
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Please upload a valid image file' }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      image: bannerImage.url || bannerImage.preview
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="banner-form">
      <div className="form-grid">
        {/* Image Upload */}
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
                    <span className="upload-hint">1920 × 1080 px (16:9)</span>
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

        {/* Basic Info */}
        <div className="form-section full-width">
          <h3>Banner Information</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Title *</label>
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

        {/* Link */}
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
                  className="form-select"
                >
                  <option value="">Select a movie</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
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
                  className="form-input"
                />
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
                  className="form-input"
                />
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

        {/* Schedule */}
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

        {/* Auto Rotation */}
        <div className="form-section">
          <h3>Auto Rotation</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="autoRotate"
                  checked={formData.autoRotate}
                  onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
                    />
                    Pause on Hover
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions full-width">
          <button type="submit" className="btn btn-primary btn-lg">
            {isEditing ? 'Update Banner' : 'Create Banner'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BannerForm;
