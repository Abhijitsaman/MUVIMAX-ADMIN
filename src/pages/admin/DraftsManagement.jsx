import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaFilm,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaClock,
  FaPlay,
  FaCheckCircle
} from 'react-icons/fa';
import { format } from 'date-fns';

const DraftsManagement = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [draftToPublish, setDraftToPublish] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    const q = query(
      collection(db, 'movies'),
      where('status', '==', 'draft'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const draftsData = [];
        snapshot.forEach((doc) => {
          draftsData.push({ id: doc.id, ...doc.data() });
        });
        setDrafts(draftsData);
        setLoading(false);
      },
      (error) => {
        console.error('Drafts fetch error:', error);
        setLoadError(error.message);
        setLoading(false);
      }
    );

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
    
    const sorted = [...drafts].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setDrafts(sorted);
  };

  const handleDelete = async (draftId) => {
    try {
      await deleteDoc(doc(db, 'movies', draftId));
      setShowDeleteModal(false);
      setDraftToDelete(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handlePublish = async (draftId) => {
    try {
      await updateDoc(doc(db, 'movies', draftId), {
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      });
      setShowPublishModal(false);
      setDraftToPublish(null);
    } catch (error) {
      console.error('Error publishing draft:', error);
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    const search = searchTerm.toLowerCase();
    return (
      draft.title?.toLowerCase().includes(search) ||
      draft.language?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading drafts...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-loading">
        <p style={{ color: 'red', wordBreak: 'break-all', padding: '20px' }}>
          Error: {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="drafts-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Drafts</h1>
          <span className="page-count">{drafts.length} drafts</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/movies/add" className="btn btn-primary">
            <FaFilm /> Add Movie
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search drafts..."
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
              <th className="col-poster">Poster</th>
              <th className="col-title" onClick={() => handleSort('title')}>
                Title
                {sortConfig.key === 'title' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-category">Categories</th>
              <th className="col-status">Status</th>
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
            {filteredDrafts.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <FaFilm size={48} />
                    <h3>No drafts found</h3>
                    <p>Create a new movie and save it as draft</p>
                    <Link to="/admin/movies/add" className="btn btn-primary">
                      <FaFilm /> Add Movie
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDrafts.map((draft) => (
                <tr key={draft.id} className="data-row">
                  <td className="col-poster">
                    {draft.poster ? (
                      <img 
                        src={draft.poster} 
                        alt={draft.title}
                        className="movie-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="movie-thumb-placeholder">
                        <FaFilm />
                      </div>
                    )}
                  </td>
                  <td className="col-title">
                    <div className="movie-title-info">
                      <h4>{draft.title}</h4>
                    </div>
                  </td>
                  <td className="col-category">
                    <div className="movie-tags">
                      {(draft.categories || []).slice(0, 2).map(cat => (
                        <span key={cat} className="tag">{cat}</span>
                      ))}
                    </div>
                  </td>
                  <td className="col-status">
                    <span className="status-badge warning">
                      <FaClock size={12} /> Draft
                    </span>
                  </td>
                  <td className="col-date">
                    <span className="date-text">
                      {draft.createdAt?.toDate?.() 
                        ? format(draft.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <Link 
                        to={`/admin/movies/edit/${draft.id}`}
                        className="action-btn edit"
                        title="Edit Draft"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-btn publish"
                        title="Publish Draft"
                        onClick={() => {
                          setDraftToPublish(draft);
                          setShowPublishModal(true);
                        }}
                      >
                        <FaPlay />
                      </button>
                      <button 
                        className="action-btn delete"
                        title="Delete Draft"
                        onClick={() => {
                          setDraftToDelete(draft);
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
        {showDeleteModal && draftToDelete && (
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
                <h3>Delete Draft</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete this draft?</p>
                  <p className="warning-text">
                    <strong>"{draftToDelete.title}"</strong> will be permanently deleted.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(draftToDelete.id)}>
                  <FaTrash /> Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && draftToPublish && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPublishModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Publish Movie</h3>
                <button className="modal-close" onClick={() => setShowPublishModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="publish-confirm">
                  <FaCheckCircle size={48} className="success-icon" />
                  <p>Are you sure you want to publish <strong>"{draftToPublish.title}"</strong>?</p>
                  <p className="publish-text">The movie will become visible to users.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={() => handlePublish(draftToPublish.id)}>
                  <FaPlay /> Publish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DraftsManagement;
