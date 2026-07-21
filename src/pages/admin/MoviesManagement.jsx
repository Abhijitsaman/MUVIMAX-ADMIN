import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  startAfter,
  limit,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaCopy,
  FaToggleOn,
  FaToggleOff,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheck,
  FaTimes,
  FaUpload,
  FaDownload,
  FaImage,
  FaVideo,
  FaClock,
  FaCalendarAlt,
  FaTag,
  FaLanguage,
  FaStar,
  FaEyeSlash,
  FaArchive,
  FaShare,
  FaEllipsisV,
  FaPlay,
  FaPause,
  FaTimesCircle,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';
import { MdMovie, MdTheaters, MdOutlineWatchLater } from 'react-icons/md';
import { BiMoviePlay } from 'react-icons/bi';
import { format } from 'date-fns';

const MoviesManagement = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalMovies, setTotalMovies] = useState(0);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'archived', label: 'Archived' }
  ];

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        let q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'), limit(pageSize));
        
        if (filterStatus !== 'all') {
          q = query(collection(db, 'movies'), where('status', '==', filterStatus), orderBy('createdAt', 'desc'), limit(pageSize));
        }

        const snapshot = await getDocs(q);
        const moviesData = [];
        snapshot.forEach((doc) => {
          moviesData.push({ id: doc.id, ...doc.data() });
        });
        
        // Get total count
        const totalSnapshot = await getDocs(collection(db, 'movies'));
        setTotalMovies(totalSnapshot.size);
        setMovies(moviesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching movies:', error);
        setLoading(false);
      }
    };

    fetchMovies();
  }, [filterStatus, pageSize]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length === 0) {
      // Reset to full list
      const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'), limit(pageSize));
      const snapshot = await getDocs(q);
      const moviesData = [];
      snapshot.forEach((doc) => {
        moviesData.push({ id: doc.id, ...doc.data() });
      });
      setMovies(moviesData);
      return;
    }

    // Search by title or description
    const q = query(
      collection(db, 'movies'),
      where('title', '>=', term),
      where('title', '<=', term + '\uf8ff'),
      orderBy('title'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const moviesData = [];
    snapshot.forEach((doc) => {
      moviesData.push({ id: doc.id, ...doc.data() });
    });
    setMovies(moviesData);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    const sorted = [...movies].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setMovies(sorted);
  };

  const handleDelete = async (movieId) => {
    try {
      // Delete movie document
      await deleteDoc(doc(db, 'movies', movieId));
      
      // Also delete associated files from storage if needed
      // This would need to track all storage references in the movie document
      
      setMovies(movies.filter(m => m.id !== movieId));
      setShowDeleteModal(false);
      setMovieToDelete(null);
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedMovies.length === 0) return;

    try {
      const promises = selectedMovies.map(movieId => {
        const movieRef = doc(db, 'movies', movieId);
        let updateData = {};
        
        switch (action) {
          case 'publish':
            updateData = { status: 'published', publishedAt: new Date() };
            break;
          case 'unpublish':
            updateData = { status: 'draft' };
            break;
          case 'hide':
            updateData = { status: 'hidden' };
            break;
          case 'archive':
            updateData = { status: 'archived' };
            break;
          case 'delete':
            return deleteDoc(movieRef);
          default:
            return null;
        }
        
        if (updateData) {
          return updateDoc(movieRef, updateData);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      
      // Refresh the list
      const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'), limit(pageSize));
      const snapshot = await getDocs(q);
      const moviesData = [];
      snapshot.forEach((doc) => {
        moviesData.push({ id: doc.id, ...doc.data() });
      });
      setMovies(moviesData);
      setSelectedMovies([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleRowSelection = (movieId) => {
    setSelectedMovies(prev => 
      prev.includes(movieId) 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedMovies.length === movies.length) {
      setSelectedMovies([]);
    } else {
      setSelectedMovies(movies.map(m => m.id));
    }
  };

  const toggleRowExpand = (movieId) => {
    setExpandedRows(prev => ({
      ...prev,
      [movieId]: !prev[movieId]
    }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: { label: 'Published', color: 'success', icon: FaCheckCircle },
      draft: { label: 'Draft', color: 'warning', icon: FaPause },
      scheduled: { label: 'Scheduled', color: 'info', icon: FaClock },
      hidden: { label: 'Hidden', color: 'secondary', icon: FaEyeSlash },
      archived: { label: 'Archived', color: 'dark', icon: FaArchive }
    };
    const badge = badges[status] || badges.draft;
    return badge;
  };

  const getQualityBadge = (quality) => {
    const qualities = {
      '720p': { label: 'HD', color: 'info' },
      '1080p': { label: 'Full HD', color: 'success' },
      '2160p': { label: '4K', color: 'primary' }
    };
    return qualities[quality] || { label: quality, color: 'secondary' };
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading movies...</p>
      </div>
    );
  }

  return (
    <div className="movies-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Movies</h1>
          <span className="page-count">{totalMovies} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/movies/add" className="btn btn-primary">
            <FaPlus />
            <span>Add Movie</span>
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search movies by title..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => handleSearch('')}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-container">
          <FaFilter className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {selectedMovies.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">{selectedMovies.length} selected</span>
            <button 
              className="bulk-btn"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              <FaEllipsisV />
            </button>
            {showBulkActions && (
              <div className="bulk-dropdown">
                <button onClick={() => handleBulkAction('publish')}>
                  <FaCheckCircle /> Publish
                </button>
                <button onClick={() => handleBulkAction('unpublish')}>
                  <FaPause /> Unpublish
                </button>
                <button onClick={() => handleBulkAction('hide')}>
                  <FaEyeSlash /> Hide
                </button>
                <button onClick={() => handleBulkAction('archive')}>
                  <FaArchive /> Archive
                </button>
                <button onClick={() => handleBulkAction('delete')} className="danger">
                  <FaTrash /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMovies.length === movies.length && movies.length > 0}
                  onChange={toggleAllSelection}
                />
              </th>
              <th className="col-poster">Poster</th>
              <th className="col-title" onClick={() => handleSort('title')}>
                Title
                {sortConfig.key === 'title' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-status">Status</th>
              <th className="col-quality">Quality</th>
              <th className="col-views" onClick={() => handleSort('views')}>
                Views
                {sortConfig.key === 'views' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-rating">Rating</th>
              <th className="col-date" onClick={() => handleSort('createdAt')}>
                Uploaded
                {sortConfig.key === 'createdAt' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <MdMovie size={48} />
                    <h3>No movies found</h3>
                    <p>Start adding movies to your platform</p>
                    <Link to="/admin/movies/add" className="btn btn-primary">
                      <FaPlus /> Add Movie
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              movies.map((movie) => {
                const statusBadge = getStatusBadge(movie.status || 'draft');
                const StatusIcon = statusBadge.icon;
                const qualityBadge = getQualityBadge(movie.quality);
                const isExpanded = expandedRows[movie.id];
                const isSelected = selectedMovies.includes(movie.id);

                return (
                  <React.Fragment key={movie.id}>
                    <tr 
                      className={`data-row ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleRowSelection(movie.id)}
                    >
                      <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(movie.id)}
                        />
                      </td>
                      <td className="col-poster">
                        {movie.poster ? (
                          <img 
                            src={movie.poster} 
                            alt={movie.title}
                            className="movie-thumb"
                            loading="lazy"
                          />
                        ) : (
                          <div className="movie-thumb-placeholder">
                            <MdMovie />
                          </div>
                        )}
                      </td>
                      <td className="col-title">
                        <div className="movie-title-info">
                          <h4>{movie.title}</h4>
                          {movie.originalTitle && (
                            <span className="original-title">{movie.originalTitle}</span>
                          )}
                          {movie.categories && movie.categories.length > 0 && (
                            <div className="movie-tags">
                              {movie.categories.slice(0, 2).map(cat => (
                                <span key={cat} className="tag">{cat}</span>
                              ))}
                              {movie.categories.length > 2 && (
                                <span className="tag-more">+{movie.categories.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="col-status">
                        <span className={`status-badge ${statusBadge.color}`}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="col-quality">
                        <span className={`quality-badge ${qualityBadge.color}`}>
                          {qualityBadge.label}
                        </span>
                      </td>
                      <td className="col-views">
                        <span className="views-count">
                          <FaEye size={12} />
                          {movie.views || 0}
                        </span>
                      </td>
                      <td className="col-rating">
                        <span className="rating">
                          <FaStar size={12} />
                          {movie.averageRating || 0}
                        </span>
                      </td>
                      <td className="col-date">
                        <span className="date-text">
                          {movie.createdAt?.toDate?.() 
                            ? format(movie.createdAt.toDate(), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-buttons">
                          <Link 
                            to={`/admin/movies/edit/${movie.id}`}
                            className="action-btn edit"
                            title="Edit Movie"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaEdit />
                          </Link>
                          <button 
                            className="action-btn duplicate"
                            title="Duplicate Movie"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaCopy />
                          </button>
                          <button 
                            className="action-btn delete"
                            title="Delete Movie"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMovieToDelete(movie);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </button>
                          <button 
                            className="action-btn toggle"
                            title="Toggle Row Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(movie.id);
                            }}
                          >
                            <FaChevronDown className={isExpanded ? 'rotated' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="expand-row">
                        <td colSpan="9">
                          <div className="expand-content">
                            <div className="expand-section">
                              <h5>Movie Details</h5>
                              <div className="expand-details">
                                <div className="detail-item">
                                  <label>Description</label>
                                  <p>{movie.description || 'No description'}</p>
                                </div>
                                <div className="detail-item">
                                  <label>Release Year</label>
                                  <span>{movie.releaseYear || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Duration</label>
                                  <span>{movie.duration ? `${movie.duration} min` : 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Language</label>
                                  <span>{movie.language || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Genres</label>
                                  <div className="expand-tags">
                                    {(movie.genres || []).map(genre => (
                                      <span key={genre} className="tag">{genre}</span>
                                    ))}
                                  </div>
                                </div>
                                {movie.videoUrl && (
                                  <div className="detail-item">
                                    <label>Video</label>
                                    <span className="video-url">
                                      <FaVideo /> {movie.videoUrl.substring(0, 50)}...
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="pagination-info">
          Showing {movies.length} of {totalMovies} movies
        </div>
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <FaChevronLeft />
          </button>
          <span className="pagination-page">{currentPage}</span>
          <button 
            className="pagination-btn"
            disabled={movies.length < pageSize}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && movieToDelete && (
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
                <h3>Delete Movie</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{movieToDelete.title}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone. All associated data will be permanently removed.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(movieToDelete.id)}
                >
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

export default MoviesManagement;
