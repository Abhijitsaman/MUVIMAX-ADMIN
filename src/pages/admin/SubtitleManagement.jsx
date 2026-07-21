import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaFileAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaUpload,
  FaDownload,
  FaLanguage,
  FaCheck,
  FaBan,
  FaSpinner
} from 'react-icons/fa';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const SubtitleManagement = () => {
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subtitleToDelete, setSubtitleToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'language', direction: 'asc' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [movies, setMovies] = useState([]);
  const [formData, setFormData] = useState({
    movieId: '',
    language: '',
    label: '',
    file: null,
    isDefault: false,
    forced: false,
    enabled: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'subtitles'), orderBy('language', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subtitlesData = [];
      snapshot.forEach((doc) => {
        subtitlesData.push({ id: doc.id, ...doc.data() });
      });
      setSubtitles(subtitlesData);
      setLoading(false);
    });

    // Fetch movies for dropdown
    const fetchMovies = async () => {
      const moviesSnapshot = await getDocs(collection(db, 'movies'));
      const moviesData = [];
      moviesSnapshot.forEach((doc) => {
        moviesData.push({ id: doc.id, title: doc.data().title });
      });
      setMovies(moviesData);
    };
    fetchMovies();

    return () => unsubscribe();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    const sorted = [...subtitles].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setSubtitles(sorted);
  };

  const handleDelete = async (subtitleId) => {
    try {
      const subtitle = subtitles.find(s => s.id === subtitleId);
      if (subtitle?.fileUrl) {
        try {
          const fileRef = ref(storage, subtitle.fileUrl);
          await deleteObject(fileRef);
        } catch (err) {
          console.log('File not found in storage');
        }
      }
      await deleteDoc(doc(db, 'subtitles', subtitleId));
      setShowDeleteModal(false);
      setSubtitleToDelete(null);
    } catch (error) {
      console.error('Error deleting subtitle:', error);
    }
  };

  const handleToggleStatus = async (subtitleId, currentEnabled) => {
    try {
      await updateDoc(doc(db, 'subtitles', subtitleId), {
        enabled: !currentEnabled,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling subtitle status:', error);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    const validTypes = ['text/vtt', 'text/srt', 'text/ass', 'text/ssa'];
    const validExtensions = ['.vtt', '.srt', '.ass', '.ssa'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setFormErrors(prev => ({ ...prev, file: 'Please upload a valid subtitle file (VTT, SRT, ASS, SSA)' }));
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    setFormErrors(prev => ({ ...prev, file: '' }));
  };

  const handleAddSubtitle = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!formData.movieId) errors.movieId = 'Movie is required';
    if (!formData.language) errors.language = 'Language is required';
    if (!formData.file) errors.file = 'Subtitle file is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = formData.file;
      const storageRef = ref(storage, `subtitles/${Date.now()}_${file.name}`);
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
          
          await addDoc(collection(db, 'subtitles'), {
            movieId: formData.movieId,
            language: formData.language,
            label: formData.label || formData.language,
            fileUrl: url,
            isDefault: formData.isDefault,
            forced: formData.forced,
            enabled: formData.enabled,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          setIsUploading(false);
          setUploadProgress(100);
          setShowAddForm(false);
          setFormData({
            movieId: '',
            language: '',
            label: '',
            file: null,
            isDefault: false,
            forced: false,
            enabled: true
          });
        }
      );
    } catch (error) {
      console.error('Error adding subtitle:', error);
      setIsUploading(false);
    }
  };

  const getStatusBadge = (enabled) => {
    if (enabled) {
      return <span className="status-badge success"><FaCheck /> Enabled</span>;
    }
    return <span className="status-badge secondary"><FaBan /> Disabled</span>;
  };

  const filteredSubtitles = subtitles.filter(subtitle => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      subtitle.language?.toLowerCase().includes(search) ||
      subtitle.label?.toLowerCase().includes(search) ||
      subtitle.movieTitle?.toLowerCase().includes(search);
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'enabled' && subtitle.enabled) ||
      (filterStatus === 'disabled' && !subtitle.enabled);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading subtitles...</p>
      </div>
    );
  }

  return (
    <div className="subtitle-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Subtitles</h1>
          <span className="page-count">{subtitles.length} total</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <FaPlus /> Add Subtitle
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-subtitle-form">
          <form onSubmit={handleAddSubtitle}>
            <div className="form-grid">
              <div className="form-group">
                <label>Movie *</label>
                <select
                  value={formData.movieId}
                  onChange={(e) => setFormData(prev => ({ ...prev, movieId: e.target.value }))}
                  className={`form-select ${formErrors.movieId ? 'error' : ''}`}
                >
                  <option value="">Select movie</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>
                {formErrors.movieId && <span className="error-text">{formErrors.movieId}</span>}
              </div>

              <div className="form-group">
                <label>Language *</label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  placeholder="English, Spanish, etc."
                  className={`form-input ${formErrors.language ? 'error' : ''}`}
                />
                {formErrors.language && <span className="error-text">{formErrors.language}</span>}
              </div>

              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="English Subtitles"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Subtitle File *</label>
                <input
                  type="file"
                  accept=".vtt,.srt,.ass,.ssa"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className={`form-input-file ${formErrors.file ? 'error' : ''}`}
                />
                {formErrors.file && <span className="error-text">{formErrors.file}</span>}
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                  Default Subtitle
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.forced}
                    onChange={(e) => setFormData(prev => ({ ...prev, forced: e.target.checked }))}
                  />
                  Forced Subtitle
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  Enabled
                </label>
              </div>

              <div className="form-actions full-width">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  <FaTimes /> Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  {isUploading ? <FaSpinner className="spinning" /> : <FaUpload />}
                  {isUploading ? 'Uploading...' : 'Add Subtitle'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search subtitles..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => handleSearch('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-container">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-language" onClick={() => handleSort('language')}>
                Language
                {sortConfig.key === 'language' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-label">Label</th>
              <th className="col-movie">Movie</th>
              <th className="col-default">Default</th>
              <th className="col-status">Status</th>
              <th className="col-date" onClick={() => handleSort('createdAt')}>
                Added
                {sortConfig.key === 'createdAt' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubtitles.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaFileAlt size={48} />
                    <h3>No subtitles found</h3>
                    <p>Add subtitles for your movies</p>
                    <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                      <FaPlus /> Add Subtitle
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubtitles.map((subtitle) => (
                <tr key={subtitle.id} className="data-row">
                  <td className="col-language">
                    <span className="language-name">
                      <FaLanguage /> {subtitle.language}
                    </span>
                  </td>
                  <td className="col-label">
                    <span>{subtitle.label || subtitle.language}</span>
                  </td>
                  <td className="col-movie">
                    <span>{subtitle.movieTitle || 'Unknown'}</span>
                  </td>
                  <td className="col-default">
                    {subtitle.isDefault ? (
                      <span className="default-badge"><FaCheck /> Default</span>
                    ) : (
                      <span className="default-badge muted">-</span>
                    )}
                  </td>
                  <td className="col-status">
                    {getStatusBadge(subtitle.enabled)}
                  </td>
                  <td className="col-date">
                    <span className="date-text">
                      {subtitle.createdAt?.toDate?.() 
                        ? format(subtitle.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn toggle-status"
                        onClick={() => handleToggleStatus(subtitle.id, subtitle.enabled)}
                        title={subtitle.enabled ? 'Disable' : 'Enable'}
                      >
                        {subtitle.enabled ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button 
                        className="action-btn download"
                        title="Download"
                        onClick={() => window.open(subtitle.fileUrl, '_blank')}
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="action-btn delete"
                        title="Delete Subtitle"
                        onClick={() => {
                          setSubtitleToDelete(subtitle);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && subtitleToDelete && (
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
                <h3>Delete Subtitle</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete this subtitle?</p>
                  <p className="warning-text">
                    <strong>{subtitleToDelete.language}</strong> - {subtitleToDelete.movieTitle || 'Unknown Movie'}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(subtitleToDelete.id)}>
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

export default SubtitleManagement;
