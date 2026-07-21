import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
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
  FaUserCog,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaClock,
  FaBan,
  FaCheck,
  FaKey,
  FaUserShield,
  FaLock,
  FaUnlock
} from 'react-icons/fa';
import { format } from 'date-fns';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [totalAdmins, setTotalAdmins] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminsData = [];
      snapshot.forEach((doc) => {
        adminsData.push({ id: doc.id, ...doc.data() });
      });
      setAdmins(adminsData);
      setTotalAdmins(adminsData.length);
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
    
    const sorted = [...admins].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setAdmins(sorted);
  };

  const handleDelete = async (adminId) => {
    try {
      await deleteDoc(doc(db, 'admins', adminId));
      setShowDeleteModal(false);
      setAdminToDelete(null);
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'admins', adminId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      admin.name?.toLowerCase().includes(search) ||
      admin.email?.toLowerCase().includes(search) ||
      admin.role?.toLowerCase().includes(search);
    
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    const matchesStatus = filterStatus === 'all' || admin.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role) => {
    const roles = {
      super_admin: { label: 'Super Admin', color: 'danger' },
      admin: { label: 'Admin', color: 'primary' },
      moderator: { label: 'Moderator', color: 'info' },
      editor: { label: 'Editor', color: 'warning' },
      content_manager: { label: 'Content Manager', color: 'success' },
      viewer: { label: 'Viewer', color: 'secondary' }
    };
    return roles[role] || roles.viewer;
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="status-badge success"><FaCheck /> Active</span>;
    }
    return <span className="status-badge secondary"><FaBan /> Inactive</span>;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Admin Management</h1>
          <span className="page-count">{totalAdmins} admins</span>
        </div>
        <div className="page-header-right">
          <Link to="/admin/admins/add" className="btn btn-primary">
            <FaPlus /> Add Admin
          </Link>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search admins..."
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
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="editor">Editor</option>
            <option value="content_manager">Content Manager</option>
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
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-avatar">Avatar</th>
              <th className="col-name" onClick={() => handleSort('name')}>
                Name
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
              <th className="col-email">Email</th>
              <th className="col-role">Role</th>
              <th className="col-status">Status</th>
              <th className="col-last-login">Last Login</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FaUserCog size={48} />
                    <h3>No admins found</h3>
                    <p>Add administrators to manage the platform</p>
                    <Link to="/admin/admins/add" className="btn btn-primary">
                      <FaPlus /> Add Admin
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => {
                const roleBadge = getRoleBadge(admin.role);
                const isSuperAdmin = admin.role === 'super_admin';

                return (
                  <tr key={admin.id} className="data-row">
                    <td className="col-avatar">
                      {admin.photoURL ? (
                        <img 
                          src={admin.photoURL} 
                          alt={admin.name}
                          className="admin-avatar-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="admin-avatar-placeholder">
                          {admin.name?.charAt(0) || admin.email?.charAt(0) || 'A'}
                        </div>
                      )}
                    </td>
                    <td className="col-name">
                      <div className="admin-name-info">
                        <h4>{admin.name || 'Admin'}</h4>
                        {isSuperAdmin && (
                          <span className="super-admin-badge">
                            <FaShieldAlt /> Super Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="col-email">
                      <span className="admin-email">
                        <FaEnvelope size={12} />
                        {admin.email}
                      </span>
                    </td>
                    <td className="col-role">
                      <span className={`role-badge ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="col-status">
                      {getStatusBadge(admin.status)}
                    </td>
                    <td className="col-last-login">
                      <span className="last-login">
                        {admin.lastLogin?.toDate?.() 
                          ? format(admin.lastLogin.toDate(), 'MMM d, yyyy h:mm a')
                          : 'Never'}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <button
                          className="action-btn toggle-status"
                          onClick={() => handleToggleStatus(admin.id, admin.status)}
                          title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {admin.status === 'active' ? <FaBan /> : <FaCheck />}
                        </button>
                        <Link 
                          to={`/admin/admins/edit/${admin.id}`}
                          className="action-btn edit"
                          title="Edit Admin"
                        >
                          <FaEdit />
                        </Link>
                        {!isSuperAdmin && (
                          <button 
                            className="action-btn delete"
                            title="Delete Admin"
                            onClick={() => {
                              setAdminToDelete(admin);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </button>
                        )}
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
        {showDeleteModal && adminToDelete && (
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
                <h3>Delete Admin</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <FaExclamationCircle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete <strong>"{adminToDelete.name || adminToDelete.email}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone. The admin will lose all access.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(adminToDelete.id)}>
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

export default AdminManagement;
