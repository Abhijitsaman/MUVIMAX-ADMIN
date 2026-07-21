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
  FaLayerGroup,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { format } from 'date-fns';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = [];
      snapshot.forEach((doc) => {
        categoriesData.push({ id: doc.id, ...doc.data() });
      });
      setCategories(categoriesData);
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
    
    const sorted = [...categories].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setCategories(sorted);
  };

  const handleDelete = async (categoryId) => {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleVisibility = async (categoryId, currentVisibility) => {
    try {
      const newVisibility = currentVisibility === 'visible' ? 'hidden' : 'visible';
      await updateDoc(doc(db, 'categories', categoryId), {
        visibility: newVisibility,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling category visibility:', error);
    }
  };

  const filteredCategories = categories.filter(category => {
    const search = searchTerm.toLowerCase();
    return (
      category.name?.toLowerCase().includes(search) ||
      category.slug?.toLowerCase().includes(search) ||
      category.description?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="categories-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Categories</h1>
          <span className="page-count">{categories.length} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/categories/add" className="btn btn-primary">
            <FaPlus /> Add Category
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search categories..."
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
              <th className="col-icon">Icon</th>
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
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaLayerGroup size={48} />
                    <h3>No categories found</h3>
                    <p>Create categories to organize your content</p>
                    <Link to="/admin/categories/add" className="btn btn-primary">
                      <FaPlus /> Add Category
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className="data-row">
                  <td className="col-icon">
                    {category.icon ? (
                      <span className="category-icon">{category.icon}</span>
                    ) : (
                      <FaLayerGroup className="default-icon" />
                    )}
                  </td>
                  <td className="col-name">
                    <div className="category-name-info">
                      <h4>{category.name}</h4>
                      {category.description && (
                        <span className="category-description">{category.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-slug">
                    <span className="slug-text">{category.slug}</span>
                  </td>
                  <td className="col-movies">
                    <span className="movie-count">{category.movieCount || 0}</span>
                  </td>
                  <td className="col-visibility">
                    <span className={`status-badge ${category.visibility === 'visible' ? 'success' : 'secondary'}`}>
                      {category.visibility === 'visible' ? <FaEye /> : <FaEyeSlash />}
                      {category.visibility || 'visible'}
                    </span>
                  </td>
                  <td className="col-date">
                    <span className="date-text">
                      {category.createdAt?.toDate?.() 
                        ? format(category.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn toggle-visibility"
                        onClick={() => handleToggleVisibility(category.id, category.visibility)}
                        title={category.visibility === 'visible' ? 'Hide' : 'Show'}
                      >
                        {category.visibility === 'visible' ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <Link 
                        to={`/admin/categories/edit/${category.id}`}
                        className="action-btn edit"
                        title="Edit Category"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-btn delete"
                        title="Delete Category"
                        onClick={() => {
                          setCategoryToDelete(category);
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
        {showDeleteModal && categoryToDelete && (
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
                <h3>Delete Category</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{categoryToDelete.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(categoryToDelete.id)}>
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

export default CategoriesManagement;
