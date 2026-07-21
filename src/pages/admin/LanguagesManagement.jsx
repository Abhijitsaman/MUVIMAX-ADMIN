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
  FaLanguage,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaGlobe
} from 'react-icons/fa';
import { format } from 'date-fns';

const LanguagesManagement = () => {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [languageToDelete, setLanguageToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const q = query(collection(db, 'languages'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const languagesData = [];
      snapshot.forEach((doc) => {
        languagesData.push({ id: doc.id, ...doc.data() });
      });
      setLanguages(languagesData);
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
    
    const sorted = [...languages].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setLanguages(sorted);
  };

  const handleDelete = async (languageId) => {
    try {
      await deleteDoc(doc(db, 'languages', languageId));
      setShowDeleteModal(false);
      setLanguageToDelete(null);
    } catch (error) {
      console.error('Error deleting language:', error);
    }
  };

  const handleToggleStatus = async (languageId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'languages', languageId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling language status:', error);
    }
  };

  const filteredLanguages = languages.filter(language => {
    const search = searchTerm.toLowerCase();
    return (
      language.name?.toLowerCase().includes(search) ||
      language.nativeName?.toLowerCase().includes(search) ||
      language.code?.toLowerCase().includes(search) ||
      language.country?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading languages...</p>
      </div>
    );
  }

  return (
    <div className="languages-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Languages</h1>
          <span className="page-count">{languages.length} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/languages/add" className="btn btn-primary">
            <FaPlus /> Add Language
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search languages..."
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
              <th className="col-code">Code</th>
              <th className="col-name" onClick={() => handleSort('name')}>
                Name
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-native">Native Name</th>
              <th className="col-country">Country</th>
              <th className="col-direction">Direction</th>
              <th className="col-movies">Movies</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLanguages.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <FaLanguage size={48} />
                    <h3>No languages found</h3>
                    <p>Add languages for your content</p>
                    <Link to="/admin/languages/add" className="btn btn-primary">
                      <FaPlus /> Add Language
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLanguages.map((language) => (
                <tr key={language.id} className="data-row">
                  <td className="col-code">
                    <span className="language-code">{language.code}</span>
                  </td>
                  <td className="col-name">
                    <div className="language-name-info">
                      <h4>
                        {language.flag && <span className="language-flag">{language.flag}</span>}
                        {language.name}
                      </h4>
                    </div>
                  </td>
                  <td className="col-native">
                    <span className="native-name">{language.nativeName || '-'}</span>
                  </td>
                  <td className="col-country">
                    <span className="country-name">
                      <FaGlobe size={12} />
                      {language.country || '-'}
                    </span>
                  </td>
                  <td className="col-direction">
                    <span className={`direction-badge ${language.direction || 'ltr'}`}>
                      {language.direction || 'LTR'}
                    </span>
                  </td>
                  <td className="col-movies">
                    <span className="movie-count">{language.movieCount || 0}</span>
                  </td>
                  <td className="col-status">
                    <span className={`status-badge ${language.status === 'active' ? 'success' : 'secondary'}`}>
                      {language.status || 'active'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn toggle-status"
                        onClick={() => handleToggleStatus(language.id, language.status)}
                        title={language.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {language.status === 'active' ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <Link 
                        to={`/admin/languages/edit/${language.id}`}
                        className="action-btn edit"
                        title="Edit Language"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-btn delete"
                        title="Delete Language"
                        onClick={() => {
                          setLanguageToDelete(language);
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
        {showDeleteModal && languageToDelete && (
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
                <h3>Delete Language</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{languageToDelete.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(languageToDelete.id)}>
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

export default LanguagesManagement;
