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
  FaUserTie,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaUsers,
  FaFilm,
  FaCalendarAlt
} from 'react-icons/fa';
import { format } from 'date-fns';

const CastManagement = () => {
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [castToDelete, setCastToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const q = query(collection(db, 'cast'), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const castData = [];
      snapshot.forEach((doc) => {
        castData.push({ id: doc.id, ...doc.data() });
      });
      setCast(castData);
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
    
    const sorted = [...cast].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setCast(sorted);
  };

  const handleDelete = async (castId) => {
    try {
      await deleteDoc(doc(db, 'cast', castId));
      setShowDeleteModal(false);
      setCastToDelete(null);
    } catch (error) {
      console.error('Error deleting cast member:', error);
    }
  };

  const handleToggleStatus = async (castId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'cast', castId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling cast status:', error);
    }
  };

  const filteredCast = cast.filter(member => {
    const search = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(search) ||
      member.originalName?.toLowerCase().includes(search) ||
      member.knownFor?.toLowerCase().includes(search) ||
      member.nationality?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading cast members...</p>
      </div>
    );
  }

  return (
    <div className="cast-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Cast & Crew</h1>
          <span className="page-count">{cast.length} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/cast/add" className="btn btn-primary">
            <FaPlus /> Add Cast Member
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search cast members..."
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
              <th className="col-photo">Photo</th>
              <th className="col-name" onClick={() => handleSort('name')}>
                Name
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-known">Known For</th>
              <th className="col-nationality">Nationality</th>
              <th className="col-movies">Movies</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCast.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaUserTie size={48} />
                    <h3>No cast members found</h3>
                    <p>Add cast and crew members to your content</p>
                    <Link to="/admin/cast/add" className="btn btn-primary">
                      <FaPlus /> Add Cast Member
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCast.map((member) => (
                <tr key={member.id} className="data-row">
                  <td className="col-photo">
                    {member.photo ? (
                      <img 
                        src={member.photo} 
                        alt={member.name}
                        className="cast-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="cast-thumb-placeholder">
                        <FaUserTie />
                      </div>
                    )}
                  </td>
                  <td className="col-name">
                    <div className="cast-name-info">
                      <h4>{member.name}</h4>
                      {member.originalName && (
                        <span className="original-name">{member.originalName}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-known">
                    <span className="known-for">{member.knownFor || '-'}</span>
                  </td>
                  <td className="col-nationality">
                    <span className="nationality">{member.nationality || '-'}</span>
                  </td>
                  <td className="col-movies">
                    <span className="movie-count">{member.movieCount || 0}</span>
                  </td>
                  <td className="col-status">
                    <span className={`status-badge ${member.status === 'active' ? 'success' : 'secondary'}`}>
                      {member.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn toggle-status"
                        onClick={() => handleToggleStatus(member.id, member.status)}
                        title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {member.status === 'active' ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <Link 
                        to={`/admin/cast/edit/${member.id}`}
                        className="action-btn edit"
                        title="Edit Cast Member"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-btn delete"
                        title="Delete Cast Member"
                        onClick={() => {
                          setCastToDelete(member);
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
        {showDeleteModal && castToDelete && (
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
                <h3>Delete Cast Member</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{castToDelete.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(castToDelete.id)}>
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

export default CastManagement;
