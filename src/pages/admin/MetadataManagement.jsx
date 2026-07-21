import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaBox,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaGlobe,
  FaTag,
  FaFilm,
  FaUsers,
  FaStar
} from 'react-icons/fa';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const MetadataManagement = () => {
  const [activeTab, setActiveTab] = useState('countries');
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', value: '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const tabs = [
    { id: 'countries', label: 'Countries', icon: FaGlobe },
    { id: 'ageRatings', label: 'Age Ratings', icon: FaFilm },
    { id: 'videoCodecs', label: 'Video Codecs', icon: FaFilm },
    { id: 'audioCodecs', label: 'Audio Codecs', icon: FaTag },
    { id: 'aspectRatios', label: 'Aspect Ratios', icon: FaBox },
    { id: 'licenseTypes', label: 'License Types', icon: FaTag }
  ];

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const collections = ['countries', 'ageRatings', 'videoCodecs', 'audioCodecs', 'aspectRatios', 'licenseTypes'];
        const data = {};
        
        for (const col of collections) {
          const snapshot = await getDocs(collection(db, `metadata_${col}`));
          data[col] = [];
          snapshot.forEach((doc) => {
            data[col].push({ id: doc.id, ...doc.data() });
          });
        }
        
        setMetadata(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const handleAdd = async () => {
    if (!formData.name) {
      setErrors({ name: 'Name is required' });
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, `metadata_${activeTab}`), {
        name: formData.name,
        value: formData.value || formData.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setSuccess(true);
      setShowAddModal(false);
      setFormData({ name: '', value: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding metadata:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.name) {
      setErrors({ name: 'Name is required' });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, `metadata_${activeTab}`, selectedItem.id), {
        name: formData.name,
        value: formData.value || formData.name,
        updatedAt: serverTimestamp()
      });
      
      setSuccess(true);
      setShowEditModal(false);
      setSelectedItem(null);
      setFormData({ name: '', value: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating metadata:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, `metadata_${activeTab}`, itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting metadata:', error);
    }
  };

  const currentItems = metadata[activeTab] || [];
  
  const filteredItems = currentItems.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.name?.toLowerCase().includes(search) ||
           item.value?.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading metadata...</p>
      </div>
    );
  }

  return (
    <div className="metadata-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Metadata Management</h1>
          <span className="page-count">{currentItems.length} items</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Add {activeTab.slice(0, -1)}
          </button>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Metadata updated successfully!</span>
        </div>
      )}

      <div className="metadata-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`metadata-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className="tab-count">{metadata[tab.id]?.length || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-name">Name</th>
              <th className="col-value">Value</th>
              <th className="col-date">Created</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="4">
                  <div className="empty-state">
                    <FaBox size={48} />
                    <h3>No {activeTab} found</h3>
                    <p>Add your first {activeTab.slice(0, -1)}</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                      <FaPlus /> Add {activeTab.slice(0, -1)}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="data-row">
                  <td className="col-name">
                    <span className="item-name">{item.name}</span>
                  </td>
                  <td className="col-value">
                    <span className="item-value">{item.value || item.name}</span>
                  </td>
                  <td className="col-date">
                    <span className="date-text">
                      {item.createdAt?.toDate?.() 
                        ? format(item.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button 
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedItem(item);
                          setFormData({ name: item.name, value: item.value || '' });
                          setShowEditModal(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => {
                          setItemToDelete(item);
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

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Add {activeTab.slice(0, -1)}</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`Enter ${activeTab.slice(0, -1)} name`}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Value (optional)</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Value (if different from name)"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={isSaving}>
                  {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
                  {isSaving ? 'Adding...' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedItem && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Edit {activeTab.slice(0, -1)}</h3>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Value (optional)</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEdit} disabled={isSaving}>
                  {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && itemToDelete && (
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
                <h3>Delete {activeTab.slice(0, -1)}</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{itemToDelete.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
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

export default MetadataManagement;
