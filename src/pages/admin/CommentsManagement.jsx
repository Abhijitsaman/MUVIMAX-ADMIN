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
  onSnapshot
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaComment,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaThumbsUp,
  FaFlag,
  FaCheck,
  FaUser,
  FaFilm,
  FaReply,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { format } from 'date-fns';

const CommentsManagement = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedComments, setSelectedComments] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() });
      });
      setComments(commentsData);
      setTotalComments(commentsData.length);
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
    
    const sorted = [...comments].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setComments(sorted);
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setShowDeleteModal(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleToggleStatus = async (commentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'hidden' : 'approved';
      await updateDoc(doc(db, 'comments', commentId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling comment status:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedComments.length === 0) return;

    try {
      const promises = selectedComments.map(commentId => {
        const commentRef = doc(db, 'comments', commentId);
        let updateData = {};
        
        switch (action) {
          case 'approve':
            updateData = { status: 'approved', updatedAt: new Date() };
            break;
          case 'hide':
            updateData = { status: 'hidden', updatedAt: new Date() };
            break;
          case 'delete':
            return deleteDoc(commentRef);
          default:
            return null;
        }
        
        if (updateData) {
          return updateDoc(commentRef, updateData);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      setSelectedComments([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleRowSelection = (commentId) => {
    setSelectedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(c => c.id));
    }
  };

  const toggleRowExpand = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const filteredComments = comments.filter(comment => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      comment.content?.toLowerCase().includes(search) ||
      comment.userName?.toLowerCase().includes(search) ||
      comment.movieTitle?.toLowerCase().includes(search);
    
    const matchesStatus = filterStatus === 'all' || comment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
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

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="comments-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Comments</h1>
          <span className="page-count">{totalComments} total</span>
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
            placeholder="Search comments..."
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

        {selectedComments.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">{selectedComments.length} selected</span>
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
                  checked={selectedComments.length === comments.length && comments.length > 0}
                  onChange={toggleAllSelection}
                />
              </th>
              <th className="col-comment">Comment</th>
              <th className="col-user">User</th>
              <th className="col-movie">Movie</th>
              <th className="col-replies">Replies</th>
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
            {filteredComments.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <FaComment size={48} />
                    <h3>No comments found</h3>
                    <p>Comments will appear here when users post them</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredComments.map((comment) => {
                const statusBadge = getStatusBadge(comment.status || 'pending');
                const StatusIcon = statusBadge.icon;
                const isSelected = selectedComments.includes(comment.id);
                const isExpanded = expandedComments[comment.id];

                return (
                  <React.Fragment key={comment.id}>
                    <tr className={`data-row ${isSelected ? 'selected' : ''}`}>
                      <td className="col-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(comment.id)}
                        />
                      </td>
                      <td className="col-comment">
                        <div className="comment-content">
                          <p className="comment-preview">
                            {comment.content?.substring(0, 100)}
                            {comment.content?.length > 100 && '...'}
                          </p>
                          {comment.isReply && (
                            <span className="reply-badge">
                              <FaReply /> Reply
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="col-user">
                        <span className="user-name">
                          {comment.userName || 'Anonymous'}
                        </span>
                      </td>
                      <td className="col-movie">
                        <span className="movie-title">
                          {comment.movieTitle || 'Unknown Movie'}
                        </span>
                      </td>
                      <td className="col-replies">
                        <span className="replies-count">
                          {comment.repliesCount || 0}
                          {comment.repliesCount > 0 && (
                            <span className="replies-link"> replies</span>
                          )}
                        </span>
                      </td>
                      <td className="col-status">
                        <span className={`status-badge ${statusBadge.color}`}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                        </span>
                        {comment.reports && comment.reports > 0 && (
                          <span className="report-count">
                            <FaFlag /> {comment.reports}
                          </span>
                        )}
                      </td>
                      <td className="col-date">
                        <span className="date-text">
                          {comment.createdAt?.toDate?.() 
                            ? format(comment.createdAt.toDate(), 'MMM d, yyyy')
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-buttons">
                          <button
                            className="action-btn toggle-status"
                            onClick={() => handleToggleStatus(comment.id, comment.status)}
                            title={comment.status === 'approved' ? 'Hide' : 'Approve'}
                          >
                            {comment.status === 'approved' ? <FaEyeSlash /> : <FaCheck />}
                          </button>
                          <button 
                            className="action-btn delete"
                            title="Delete Comment"
                            onClick={() => {
                              setCommentToDelete(comment);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </button>
                          <button 
                            className="action-btn toggle"
                            onClick={() => toggleRowExpand(comment.id)}
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
                              <h5>Full Comment</h5>
                              <div className="expand-details">
                                <div className="detail-item full-width">
                                  <label>Content</label>
                                  <p className="full-content">{comment.content || 'No content'}</p>
                                </div>
                                <div className="detail-item">
                                  <label>User</label>
                                  <span>{comment.userName || 'Anonymous'}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Movie</label>
                                  <span>{comment.movieTitle || 'Unknown'}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Likes</label>
                                  <span><FaThumbsUp /> {comment.likes || 0}</span>
                                </div>
                                <div className="detail-item">
                                  <label>Reports</label>
                                  <span><FaFlag /> {comment.reports || 0}</span>
                                </div>
                                {comment.parentId && (
                                  <div className="detail-item full-width">
                                    <label>Parent Comment ID</label>
                                    <span className="mono">{comment.parentId}</span>
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

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && commentToDelete && (
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
                <h3>Delete Comment</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete this comment?</p>
                  <p className="warning-text">
                    "{commentToDelete.content?.substring(0, 50)}..."
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(commentToDelete.id)}>
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

export default CommentsManagement;
