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
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaToggleOn,
  FaToggleOff,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaExclamationCircle,
  FaImage,
  FaCalendarAlt,
  FaLink,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import { MdMovie } from 'react-icons/md';
import { format } from 'date-fns';

const BannersManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalBanners, setTotalBanners] = useState(0);
  const [selectedBanners, setSelectedBanners] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'order', direction: 'asc' });

  useEffect(() => {
    const q = query(collection(db, 'heroBanners'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannersData = [];
      snapshot.forEach((doc) => {
        bannersData.push({ id: doc.id, ...doc.data() });
      });
      setBanners(bannersData);
      setTotalBanners(bannersData.length);
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
    
    const sorted = [...banners].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setBanners(sorted);
  };

  const handleDelete = async (bannerId) => {
    try {
      await deleteDoc(doc(db, 'heroBanners', bannerId));
      setShowDeleteModal(false);
      setBannerToDelete(null);
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleToggleStatus = async (bannerId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await updateDoc(doc(db, 'heroBanners', bannerId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling banner status:', error);
    }
  };

  const handleToggleVisibility = async (bannerId, currentVisibility) => {
    try {
      const newVisibility = currentVisibility === 'visible' ? 'hidden' : 'visible';
      await updateDoc(doc(db, 'heroBanners', bannerId), {
        visibility: newVisibility,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling banner visibility:', error);
    }
  };

  const handleReorder = async (bannerId, direction) => {
    const index = banners.findIndex(b => b.id === bannerId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];

    // Update order in Firebase
    try {
      const updates = newBanners.map((b, i) => ({
        id: b.id,
        order: i
      }));
      
      await Promise.all(updates.map(({ id, order }) => 
        updateDoc(doc(db, 'heroBanners', id), { order })
      ));
    } catch (error) {
      console.error('Error reordering banners:', error);
    }
  };

  const filteredBanners = banners.filter(banner => {
    const search = searchTerm.toLowerCase();
    return (
      banner.title?.toLowerCase().includes(search) ||
      banner.subtitle?.toLowerCase().includes(search) ||
      banner.movieTitle?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return <span className="status-badge success"><FaEye /> Published</span>;
    }
    return <span className="status-badge warning"><FaEyeSlash /> Draft</span>;
  };

  const getVisibilityBadge = (visibility) => {
    if (visibility === 'visible') {
      return <span className="status-badge success">Visible</span>;
    }
    return <span className="status-badge secondary">Hidden</span>;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading banners...</p>
      </div>
    );
  }

  return (
    <div className="banners-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Hero Banners</h1>
          <span className="page-count">{totalBanners} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/banners/add" className="btn btn-primary">
            <FaPlus /> Add Banner
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search banners..."
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
              <th className="col-order" onClick={() => handleSort('order')}>
                Order
                {sortConfig.key === 'order' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-image">Image</th>
              <th className="col-title" onClick={() => handleSort('title')}>
                Title
                {sortConfig.key === 'title' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-movie">Movie</th>
              <th className="col-status">Status</th>
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
            {filteredBanners.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <FaImage size={48} />
                    <h3>No banners found</h3>
                    <p>Create your first hero banner to showcase content</p>
                    <Link to="/admin/banners/add" className="btn btn-primary">
                      <FaPlus /> Add Banner
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBanners.map((banner) => (
                <tr key={banner.id} className="data-row">
                  <td className="col-order">
                    <div className="order-controls">
                      <button
                        className="order-btn"
                        onClick={() => handleReorder(banner.id, 'up')}
                        disabled={banners.indexOf(banner) === 0}
                      >
                        ↑
                      </button>
                      <span>{banner.order || 0}</span>
                      <button
                        className="order-btn"
                        onClick={() => handleReorder(banner.id, 'down')}
                        disabled={banners.indexOf(banner) === banners.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="col-image">
                    {banner.image ? (
                      <img 
                        src={banner.image} 
                        alt={banner.title}
                        className="banner-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="banner-thumb-placeholder">
                        <FaImage />
                      </div>
                    )}
                  </td>
                  <td className="col-title">
                    <div className="banner-title-info">
                      <h4>{banner.title}</h4>
                      {banner.subtitle && (
                        <span className="banner-subtitle">{banner.subtitle}</span>
                      )}
                      {banner.ctaText && (
                        <span className="banner-cta">CTA: {banner.ctaText}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-movie">
                    {banner.movieTitle ? (
                      <span className="movie-link">
                        <MdMovie /> {banner.movieTitle}
                      </span>
                    ) : (
                      <span className="no-movie">Not linked</span>
                    )}
                  </td>
                  <td className="col-status">
                    {getStatusBadge(banner.status)}
                  </td>
                  <td className="col-visibility">
                    {getVisibilityBadge(banner.visibility)}
                  </td>
                  <td className="col-date">
                    <span className="date-text">
                      {banner.createdAt?.toDate?.() 
                        ? format(banner.createdAt.toDate(), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn toggle-status"
                        onClick={() => handleToggleStatus(banner.id, banner.status)}
                        title={banner.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {banner.status === 'published' ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button
                        className="action-btn toggle-visibility"
                        onClick={() => handleToggleVisibility(banner.id, banner.visibility)}
                        title={banner.visibility === 'visible' ? 'Hide' : 'Show'}
                      >
                        {banner.visibility === 'visible' ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <Link 
                        to={`/admin/banners/edit/${banner.id}`}
                        className="action-btn edit"
                        title="Edit Banner"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-btn duplicate"
                        title="Duplicate Banner"
                      >
                        <FaCopy />
                      </button>
                      <button 
                        className="action-btn delete"
                        title="Delete Banner"
                        onClick={() => {
                          setBannerToDelete(banner);
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && bannerToDelete && (
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
                <h3>Delete Banner</h3>
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
                  <p>Are you sure you want to delete <strong>"{bannerToDelete.title}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone.</p>
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
                  onClick={() => handleDelete(bannerToDelete.id)}
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

export default BannersManagement;
