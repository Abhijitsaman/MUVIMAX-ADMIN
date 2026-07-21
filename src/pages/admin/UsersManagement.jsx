import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
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
import { deleteUser, updatePassword, sendEmailVerification } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaExclamationCircle,
  FaUsers,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaClock,
  FaBan,
  FaCheck,
  FaShieldAlt,
  FaUserTag,
  FaFlag,
  FaGlobe
} from 'react-icons/fa';
import { format } from 'date-fns';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
      setTotalUsers(usersData.length);
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
    
    const sorted = [...users].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setUsers(sorted);
  };

  const handleDelete = async (userId) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // Try to delete from Auth (if we have the user)
      try {
        const user = auth.currentUser;
        if (user && user.uid === userId) {
          await deleteUser(user);
        }
      } catch (authError) {
        console.log('Could not delete auth user:', authError);
      }
      
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    try {
      const promises = selectedUsers.map(userId => {
        const userRef = doc(db, 'users', userId);
        let updateData = {};
        
        switch (action) {
          case 'suspend':
            updateData = { status: 'suspended', updatedAt: new Date() };
            break;
          case 'activate':
            updateData = { status: 'active', updatedAt: new Date() };
            break;
          case 'delete':
            return deleteDoc(userRef);
          default:
            return null;
        }
        
        if (updateData) {
          return updateDoc(userRef, updateData);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      setSelectedUsers([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleRowSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.phoneNumber?.toLowerCase().includes(search);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Active', color: 'success', icon: FaCheck },
      suspended: { label: 'Suspended', color: 'warning', icon: FaBan },
      banned: { label: 'Banned', color: 'danger', icon: FaBan },
      inactive: { label: 'Inactive', color: 'secondary', icon: FaEyeSlash }
    };
    const badge = badges[status] || badges.inactive;
    return badge;
  };

  const getRoleBadge = (role) => {
    const roles = {
      admin: { label: 'Admin', color: 'primary' },
      moderator: { label: 'Moderator', color: 'info' },
      user: { label: 'User', color: 'secondary' },
      premium: { label: 'Premium', color: 'success' }
    };
    return roles[role] || roles.user;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Users</h1>
          <span className="page-count">{totalUsers} total</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/users/add" className="btn btn-primary">
            <FaPlus /> Add User
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
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
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="premium">Premium</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="filter-container">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">{selectedUsers.length} selected</span>
            <button 
              className="bulk-btn"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              <FaEllipsisV />
            </button>
            {showBulkActions && (
              <div className="bulk-dropdown">
                <button onClick={() => handleBulkAction('activate')}>
                  <FaCheck /> Activate
                </button>
                <button onClick={() => handleBulkAction('suspend')}>
                  <FaBan /> Suspend
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
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={toggleAllSelection}
                />
              </th>
              <th className="col-avatar">Avatar</th>
              <th className="col-name" onClick={() => handleSort('displayName')}>
                Name
                {sortConfig.key === 'displayName' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-email">Email</th>
              <th className="col-role">Role</th>
              <th className="col-status">Status</th>
              <th className="col-joined" onClick={() => handleSort('createdAt')}>
                Joined
                {sortConfig.key === 'createdAt' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <FaUsers size={48} />
                    <h3>No users found</h3>
                    <p>Users will appear here when they register</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const statusBadge = getStatusBadge(user.status || 'active');
                const StatusIcon = statusBadge.icon;
                const roleBadge = getRoleBadge(user.role || 'user');
                const isSelected = selectedUsers.includes(user.id);

                return (
                  <tr key={user.id} className={`data-row ${isSelected ? 'selected' : ''}`}>
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(user.id)}
                      />
                    </td>
                    <td className="col-avatar">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName}
                          className="user-avatar-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                      )}
                    </td>
                    <td className="col-name">
                      <div className="user-name-info">
                        <h4>{user.displayName || 'User'}</h4>
                        {user.username && (
                          <span className="username">@{user.username}</span>
                        )}
                      </div>
                    </td>
                    <td className="col-email">
                      <span className="user-email">
                        <FaEnvelope size={12} />
                        {user.email}
                      </span>
                      {user.emailVerified && (
                        <span className="verified-badge">
                          <FaCheck size={10} /> Verified
                        </span>
                      )}
                    </td>
                    <td className="col-role">
                      <span className={`role-badge ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${statusBadge.color}`}>
                        <StatusIcon size={12} />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="col-joined">
                      <span className="joined-date">
                        {user.createdAt?.toDate?.() 
                          ? format(user.createdAt.toDate(), 'MMM d, yyyy')
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <button
                          className="action-btn toggle-status"
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          title={user.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          {user.status === 'active' ? <FaBan /> : <FaCheck />}
                        </button>
                        <Link 
                          to={`/admin/users/${user.id}`}
                          className="action-btn view"
                          title="View Profile"
                        >
                          <FaEye />
                        </Link>
                        <button 
                          className="action-btn delete"
                          title="Delete User"
                          onClick={() => {
                            setUserToDelete(user);
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
        {showDeleteModal && userToDelete && (
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
                <h3>Delete User</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{userToDelete.displayName || userToDelete.email}"</strong>?</p>
                  <p className="warning-text">
                    This action cannot be undone. All user data including watch history, 
                    reviews, and comments will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(userToDelete.id)}>
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

export default UsersManagement;
