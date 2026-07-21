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
  FaTags,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaPalette
} from 'react-icons/fa';
import { format } from 'date-fns';

const TagsManagement = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const q = query(collection(db, 'tags'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tagsData = [];
      snapshot.forEach((doc) => {
        tagsData.push({ id: doc.id, ...doc.data() });
      });
      setTags(tagsData);
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
    
    const sorted = [...tags].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setTags(sorted);
  };

  const handleDelete = async (tagId) => {
    try {
      await deleteDoc(doc(db, 'tags', tagId));
      setShowDeleteModal(false);
      setTagToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleToggleVisibility = async (tagId, currentVisibility) => {
    try {
      const newVisibility = currentVisibility === 'visible' ? 'hidden' : 'visible';
      await updateDoc(doc(db, 'tags', tagId), {
        visibility: newVisibility,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling tag visibility:', error);
    }
  };

  const filteredTags = tags.filter(tag => {
    const search = searchTerm.toLowerCase();
    return (
      tag.name?.toLowerCase().includes(search) ||
      tag.slug?.toLowerCase().includes(search) ||
      tag.description?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="tags-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tags</h1>
          <span className="page-count">{tags.length} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/tags/add" className="btn btn-primary">
            <FaPlus /> Add Tag
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tags..."
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
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaTags size={48} />
                    <h3>No tags found</h3>
                    <p>Create tags to label your content</p>
                    <Link to="/admin/tags/add" className="btn btn-primary">
                      <FaPlus /> Add Tag
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTags.map((tag) => (
                <tr key={tag.id} className="data-row">
                  <td className="col-color">
                    <div 
                      className="color-preview" 
                      style={{ backgroundColor: tag.color || '#666' }}
                    />
                  </td>
                  <td className="col-name">
                    <div className="tag-name-info">
                      <h4>{tag.name}</h4>
                      {tag.description && (
                        <span className="tag-description">{tag.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-slug">
                    <span className="slug-text">{tag.slug}</span>
                  </td>
                  <td className="col-movies">
                    <span className="movie-count">{tag.movieCount || 0}</span>
                  </td>
                  <td className="col-visibility">
                    <span className={`status-badge ${tag.visibility === 'visible' ? 'success' : 'secondary'}`}>
                      {tag.visibility === 'visible' ? <FaEye /> : <FaEyeSlash />}
                      {tag.visibility || 'visible'}
                    </span>
                  </td>
                  <td className="col-date">
                    <span className="date-text">
                      {tag.createdAt?.toDate?.() 
                        ? format(tag.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn toggle-visibility"
                        onClick={() => handleToggleVisibility(tag.id, tag.visibility)}
                        title={tag.visibility === 'visible' ? 'Hide' : 'Show'}
                      >
                        {tag.visibility === 'visible' ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <Link 
                        to={`/admin/tags/edit/${tag.id}`}
                        className="action-btn edit"
                        title="Edit Tag"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-btn delete"
                        title="Delete Tag"
                        onClick={() => {
                          setTagToDelete(tag);
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
        {showDeleteModal && tagToDelete && (
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
                <h3>Delete Tag</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{tagToDelete.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(tagToDelete.id)}>
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

export default TagsManagement;
