import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
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
  limit,
  startAfter
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaStar,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaThumbsUp,
  FaThumbsDown,
  FaFlag,
  FaCheck,
  FaBan,
  FaUser,
  FaFilm,
  FaCalendarAlt,
  FaClock,
  FaReply,
  FaFire,
  FaEllipsisV,
  FaChevronDown,
  FaThumbtack
} from 'react-icons/fa';
import { format } from 'date-fns';

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = [];
      snapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() });
      });
      setReviews(reviewsData);
      setTotalReviews(reviewsData.length);
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
    
    const sorted = [...reviews].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setReviews(sorted);
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setShowDeleteModal(false);
      setReviewToDelete(null);
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleToggleStatus = async (reviewId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'hidden' : 'approved';
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling review status:', error);
    }
  };

  const handleToggleFeature = async (reviewId, currentFeatured) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        featured: !currentFeatured,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling review feature:', error);
    }
  };

  const handleTogglePin = async (reviewId, currentPinned) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        pinned: !currentPinned,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling review pin:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) return;

    try {
      const promises = selectedReviews.map(reviewId => {
        const reviewRef = doc(db, 'reviews', reviewId);
        let updateData = {};
        
        switch (action) {
          case 'approve':
            updateData = { status: 'approved', updatedAt: new Date() };
            break;
          case 'hide':
            updateData = { status: 'hidden', updatedAt: new Date() };
            break;
          case 'feature':
            updateData = { featured: true, updatedAt: new Date() };
            break;
          case 'unfeature':
            updateData = { featured: false, updatedAt: new Date() };
            break;
          case 'delete':
            return deleteDoc(reviewRef);
          default:
            return null;
        }
        
        if (updateData) {
          return updateDoc(reviewRef, updateData);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      setSelectedReviews([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleRowSelection = (reviewId) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(r => r.id));
    }
  };

  const toggleRowExpand = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const filteredReviews = reviews.filter(review => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      review.title?.toLowerCase().includes(search) ||
      review.content?.toLowerCase().includes(search) ||
      review.userName?.toLowerCase().includes(search) ||
      review.movieTitle?.toLowerCase().includes(search);
    
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const getStatusBadge = (status) => {
    const badges = {
      approved: { label: 'Approved', color: 'success', icon: FaCheck },
      pending: { label: 'Pending', color: 'warning', icon: FaClock },
      hidden: { label: 'Hidden', color: 'secondary', icon: FaEyeSlash },
      reported: { label: 'Reported', color: 'danger', icon: FaFlag }
    };
    return badges[status] || badges.pending;
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar 
            key={star} 
            className={star <= rating ? 'star-filled' : 'star-empty'}
          />
        ))}
        <span className="rating-number">{rating}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="reviews-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reviews</h1>
          <span className="page-count">{totalReviews} total</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search reviews..."
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="hidden">Hidden</option>
            <option value="reported">Reported</option>
          </select>
        </div>

        <div className="filter-container">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {selectedReviews.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">{selectedReviews.length} selected</span>
            <button 
              className="bulk-btn"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              <FaEllipsisV />
            </button>
            {showBulkActions && (
              <div className="bulk-dropdown">
                <button onClick={() => handleBulkAction('approve')}>
                  <FaCheck /> Approve
                </button>
                <button onClick={() => handleBulkAction('hide')}>
                  <FaEyeSlash /> Hide
                </button>
                <button onClick={() => handleBulkAction('feature')}>
                  <FaFire /> Feature
                </button>
                <button onClick={() => handleBulkAction('unfeature')}>
                  <FaFire /> Unfeature
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
                  checked={selectedReviews.length === reviews.length && reviews.length > 0}
                  onChange={toggleAllSelection}
                />
              </th>
              <th className="col-rating">Rating</th>
              <th className="col-review">Review</th>
              <th className="col-user">User</th>
              <th className="col-movie">Movie</th>
              <th className="col-status">Status</th>
              <th className="col-date" onClick={() => handleSort('createdAt')}>
                Date
                {sortConfig.key === 'createdAt' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <FaStar size={48} />
                    <h3>No reviews found</h3>
                    <p>Reviews will appear here when users post them</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => {
                const statusBadge = getStatusBadge(review.status || 'pending');
                const StatusIcon = statusBadge.icon;
                const isSelected = selectedReviews.includes(review.id);
                const isExpanded = expandedReviews[review.id];

                return (
                  <React.Fragment key={review.id}>
                    <tr className={`data-row ${isSelected ? 'selected' : ''}`}>
                      <td className="col-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(review.id)}
                        />
                      </td>
                      <td className="col-rating">
                        {renderStars(review.rating || 0)}
                      </td>
                      <td className="col-review">
                        <div className="review-content">
                          <h4>{review.title || 'Untitled Review'}</h4>
                          <p className="review-preview">
                            {review.content?.substring(0, 80)}
                            {review.content?.length > 80 && '...'}
                          </p>
                          {review.featured && (
                            <span className="featured-badge">
                              <FaFire /> Featured
                            </span>
                          )}
                          {review.pinned && (
                            <span className="pinned-badge">
                              <FaThumbtack /> Pinned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="col-user">
                        <span className="user-name">
                          {review.userName || 'Anonymous'}
                        </span>
                      </td>
                      <td className="col-movie">
                        <span className="movie-title">
                          {review.movieTitle || 'Unknown Movie'}
                        </span>
                      </td>
                      <td className="col-status">
                        <span className={`status-badge ${statusBadge.color}`}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                        </span>
                        {review.reports && review.reports > 0 && (
                          <span className="report-count">
                            <FaFlag /> {review.reports}
                          </span>
                        )}
                      </td>
                      <td className="col-date">
                        <span className="date-text">
                          {review.createdAt?.toDate?.() 
                            ? format(review.createdAt.toDate(), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-buttons">
                          <button
                            className="action-btn toggle-status"
                            onClick={() => handleToggleStatus(review.id, review.status)}
                            title={review.status === 'approved' ? 'Hide' : 'Approve'}
                          >
                            {review.status === 'approved' ? <FaEyeSlash /> : <FaCheck />}
                          </button>
                          <button
                            className="action-btn toggle-feature"
                            onClick={() => handleToggleFeature(review.id, review.featured)}
                            title={review.featured ? 'Unfeature' : 'Feature'}
                          >
                            <FaFire className={review.featured ? 'active' : ''} />
                          </button>
                          <button
                            className="action-btn toggle-pin"
                            onClick={() => handleTogglePin(review.id, review.pinned)}
                            title={review.pinned ? 'Unpin' : 'Pin'}
                          >
                            <FaThumbtack className={review.pinned ? 'active' : ''} />
                          </button>
                          <button 
                            className="action-btn delete"
                            title="Delete Review"
                            onClick={() => {
                              setReviewToDelete(review);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </button>
                          <button 
                            className="action-btn toggle"
                            onClick={() => toggleRowExpand(review.id)}
                          >
                            <FaChevronDown className={isExpanded ? 'rotated' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="expand-row">
                        <td colSpan="8">
                          <div className="expand-content">
                            <div className="expand-section">
                              <h5>Full Review</h5>
                              <div className="expand-details">
                                <div className="detail-item full-width">
                                  <label>Title</label>
                                  <p>{review.title || 'Untitled'}</p>
                                </div>
                                <div className="detail-item full-width">
                                  <label>Content</label>
                                  <p className="full-content">{review.content || 'No content'}</p>
                                </div>
                                <div className="detail-item">
                                  <label>User</label>
                                  <span>{review.userName || 'Anonymous'}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Movie</label>
                                  <span>{review.movieTitle || 'Unknown'}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Rating</label>
                                  <span>{renderStars(review.rating || 0)}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Likes</label>
                                  <span><FaThumbsUp /> {review.likes || 0}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Dislikes</label>
                                  <span><FaThumbsDown /> {review.dislikes || 0}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Reports</label>
                                  <span><FaFlag /> {review.reports || 0}</span>
                                </div>
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

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && reviewToDelete && (
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
                <h3>Delete Review</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete this review?</p>
                  <p className="warning-text">
                    <strong>"{reviewToDelete.title || 'Untitled'}"</strong> by {reviewToDelete.userName || 'Anonymous'}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(reviewToDelete.id)}>
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

export default ReviewsManagement;
