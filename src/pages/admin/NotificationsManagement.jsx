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
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus,
  FaSearch,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaBell,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaEnvelope,
  FaBullhorn,
  FaUsers,
  FaUser,
  FaGlobe,
  FaCalendarAlt,
  FaClock,
  FaPaperPlane,
  FaBan,
  FaInfoCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaStar
} from 'react-icons/fa';
import { format } from 'date-fns';

const NotificationsManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [totalNotifications, setTotalNotifications] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = [];
      snapshot.forEach((doc) => {
        notificationsData.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notificationsData);
      setTotalNotifications(notificationsData.length);
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
    
    const sorted = [...notifications].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setNotifications(sorted);
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleToggleStatus = async (notificationId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling notification status:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) return;

    try {
      const promises = selectedNotifications.map(notificationId => {
        const notificationRef = doc(db, 'notifications', notificationId);
        let updateData = {};
        
        switch (action) {
          case 'publish':
            updateData = { status: 'published', publishedAt: serverTimestamp(), updatedAt: new Date() };
            break;
          case 'unpublish':
            updateData = { status: 'draft', updatedAt: new Date() };
            break;
          case 'delete':
            return deleteDoc(notificationRef);
          default:
            return null;
        }
        
        if (updateData) {
          return updateDoc(notificationRef, updateData);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      setSelectedNotifications([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleRowSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      notification.title?.toLowerCase().includes(search) ||
      notification.message?.toLowerCase().includes(search) ||
      notification.type?.toLowerCase().includes(search);
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type) => {
    const icons = {
      system: FaInfoCircle,
      movie: FaStar,
      announcement: FaBullhorn,
      promotion: FaBullhorn,
      security: FaShieldAlt,
      warning: FaExclamationTriangle,
      information: FaInfoCircle
    };
    return icons[type] || FaBell;
  };

  const getTypeColor = (type) => {
    const colors = {
      system: 'info',
      movie: 'success',
      announcement: 'primary',
      promotion: 'warning',
      security: 'danger',
      warning: 'warning',
      information: 'info'
    };
    return colors[type] || 'secondary';
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: { label: 'Published', color: 'success', icon: FaCheck },
      draft: { label: 'Draft', color: 'secondary', icon: FaEyeSlash },
      scheduled: { label: 'Scheduled', color: 'warning', icon: FaClock },
      archived: { label: 'Archived', color: 'dark', icon: FaEyeSlash }
    };
    return badges[status] || badges.draft;
  };

  const getTargetLabel = (target) => {
    if (target === 'all') return 'All Users';
    if (target === 'admins') return 'Admins Only';
    if (target === 'premium') return 'Premium Users';
    if (target === 'guests') return 'Guest Users';
    return target || 'All Users';
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Notifications</h1>
          <span className="page-count">{totalNotifications} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/notifications/add" className="btn btn-primary">
            <FaPlus /> Send Notification
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search notifications..."
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="system">System</option>
            <option value="movie">Movie</option>
            <option value="announcement">Announcement</option>
            <option value="promotion">Promotion</option>
            <option value="security">Security</option>
            <option value="warning">Warning</option>
            <option value="information">Information</option>
          </select>
        </div>

        <div className="filter-container">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {selectedNotifications.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">{selectedNotifications.length} selected</span>
            <button 
              className="bulk-btn"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              <FaEllipsisV />
            </button>
            {showBulkActions && (
              <div className="bulk-dropdown">
                <button onClick={() => handleBulkAction('publish')}>
                  <FaCheck /> Publish
                </button>
                <button onClick={() => handleBulkAction('unpublish')}>
                  <FaEyeSlash /> Unpublish
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
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={toggleAllSelection}
                />
              </th>
              <th className="col-type">Type</th>
              <th className="col-title" onClick={() => handleSort('title')}>
                Title
                {sortConfig.key === 'title' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-target">Target</th>
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
            {filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaBell size={48} />
                    <h3>No notifications found</h3>
                    <p>Send notifications to keep users engaged</p>
                    <Link to="/admin/notifications/add" className="btn btn-primary">
                      <FaPlus /> Send Notification
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredNotifications.map((notification) => {
                const TypeIcon = getTypeIcon(notification.type);
                const typeColor = getTypeColor(notification.type);
                const statusBadge = getStatusBadge(notification.status || 'draft');
                const StatusIcon = statusBadge.icon;
                const isSelected = selectedNotifications.includes(notification.id);

                return (
                  <tr key={notification.id} className={`data-row ${isSelected ? 'selected' : ''}`}>
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(notification.id)}
                      />
                    </td>
                    <td className="col-type">
                      <span className={`type-badge ${typeColor}`}>
                        <TypeIcon size={12} />
                        {notification.type || 'system'}
                      </span>
                    </td>
                    <td className="col-title">
                      <div className="notification-title-info">
                        <h4>{notification.title || 'Untitled'}</h4>
                        <p className="notification-preview">
                          {notification.message?.substring(0, 60)}
                          {notification.message?.length > 60 && '...'}
                        </p>
                      </div>
                    </td>
                    <td className="col-target">
                      <span className="target-badge">
                        {notification.target === 'all' ? <FaGlobe /> : <FaUser />}
                        {getTargetLabel(notification.target)}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${statusBadge.color}`}>
                        <StatusIcon size={12} />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="col-date">
                      <span className="date-text">
                        {notification.createdAt?.toDate?.() 
                          ? format(notification.createdAt.toDate(), 'MMM d, yyyy')
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <button
                          className="action-btn toggle-status"
                          onClick={() => handleToggleStatus(notification.id, notification.status)}
                          title={notification.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {notification.status === 'published' ? <FaEyeSlash /> : <FaCheck />}
                        </button>
                        <button 
                          className="action-btn delete"
                          title="Delete Notification"
                          onClick={() => {
                            setNotificationToDelete(notification);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && notificationToDelete && (
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
                <h3>Delete Notification</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete this notification?</p>
                  <p className="warning-text">
                    <strong>"{notificationToDelete.title}"</strong>
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(notificationToDelete.id)}>
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

export default NotificationsManagement;
