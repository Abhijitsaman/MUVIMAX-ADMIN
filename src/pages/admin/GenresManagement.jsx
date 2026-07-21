import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaMusic,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaPalette
} from 'react-icons/fa';
import { format } from 'date-fns';

const GenresManagement = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const q = query(collection(db, 'genres'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const genresData = [];
      snapshot.forEach((doc) => {
        genresData.push({ id: doc.id, ...doc.data() });
      });
      setGenres(genresData);
      setLoading(false);
    });

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
    
    const sorted = [...genres].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setGenres(sorted);
  };

  const handleDelete = async (genreId) => {
    try {
      await deleteDoc(doc(db, 'genres', genreId));
      setShowDeleteModal(false);
      setGenreToDelete(null);
    } catch (error) {
      console.error('Error deleting genre:', error);
    }
  };

  const handleToggleVisibility = async (genreId, currentVisibility) => {
    try {
      const newVisibility = currentVisibility === 'visible' ? 'hidden' : 'visible';
      await updateDoc(doc(db, 'genres', genreId), {
        visibility: newVisibility,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling genre visibility:', error);
    }
  };

  const filteredGenres = genres.filter(genre => {
    const search = searchTerm.toLowerCase();
    return (
      genre.name?.toLowerCase().includes(search) ||
      genre.slug?.toLowerCase().includes(search) ||
      genre.description?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading genres...</p>
      </div>
    );
  }

  return (
    <div className="genres-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Genres</h1>
          <span className="page-count">{genres.length} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/genres/add" className="btn btn-primary">
            <FaPlus /> Add Genre
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search genres..."
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
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-color">Color</th>
              <th className="col-name" onClick={() => handleSort('name')}>
                Name
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-slug">Slug</th>
              <th className="col-movies">Movies</th>
              <th className="col-visibility">Visibility</th>
              <th className="col-date" onClick={() => handleSort('createdAt')}>
                Created
                {sortConfig.key === 'createdAt' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGenres.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaMusic size={48} />
                    <h3>No genres found</h3>
                    <p>Create genres to categorize your content</p>
                    <Link to="/admin/genres/add" className="btn btn-primary">
                      <FaPlus /> Add Genre
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredGenres.map((genre) => (
                <tr key={genre.id} className="data-row">
                  <td className="col-color">
                    <div 
                      className="color-preview" 
                      style={{ backgroundColor: genre.color || '#666' }}
                    />
                  </td>
                  <td className="col-name">
                    <div className="genre-name-info">
                      <h4>
                        {genre.icon && <span className="genre-icon">{genre.icon}</span>}
                        {genre.name}
                      </h4>
                      {genre.description && (
                        <span className="genre-description">{genre.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-slug">
                    <span className="slug-text">{genre.slug}</span>
                  </td>
                  <td className="col-movies">
                    <span className="movie-count">{genre.movieCount || 0}</span>
                  </td>
                  <td className="col-visibility">
                    <span className={`status-badge ${genre.visibility === 'visible' ? 'success' : 'secondary'}`}>
                      {genre.visibility === 'visible' ? <FaEye /> : <FaEyeSlash />}
                      {genre.visibility || 'visible'}
                    </span>
                  </td>
                  <td className="col-date">
                    <span className="date-text">
                      {genre.createdAt?.toDate?.() 
                        ? format(genre.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn toggle-visibility"
                        onClick={() => handleToggleVisibility(genre.id, genre.visibility)}
                        title={genre.visibility === 'visible' ? 'Hide' : 'Show'}
                      >
                        {genre.visibility === 'visible' ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <Link 
                        to={`/admin/genres/edit/${genre.id}`}
                        className="action-btn edit"
                        title="Edit Genre"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-btn delete"
                        title="Delete Genre"
                        onClick={() => {
                          setGenreToDelete(genre);
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
        {showDeleteModal && genreToDelete && (
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
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{genreToDelete.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(genreToDelete.id)}>
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

export default GenresManagement;
