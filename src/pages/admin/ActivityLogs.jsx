import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  limit,
  startAfter,
  onSnapshot
} from 'firebase/firestore';
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUser,
  FaFilm,
  FaImage,
  FaTags,
  FaUsers,
  FaStar,
  FaBell,
  FaCog,
  FaDatabase,
  FaCloudUploadAlt,
  FaTrash,
  FaEdit,
  FaPlus,
  FaSignInAlt,
  FaSignOutAlt,
  FaClock,
  FaFilter,
  FaTimes
} from 'react-icons/fa';
import { format } from 'date-fns';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsData);
      setTotalLogs(logsData.length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const getActionIcon = (action) => {
    const icons = {
      login: FaSignInAlt,
      logout: FaSignOutAlt,
      movie_created: FaPlus,
      movie_updated: FaEdit,
      movie_deleted: FaTrash,
      banner_created: FaImage,
      banner_updated: FaEdit,
      banner_deleted: FaTrash,
      category_created: FaTags,
      category_updated: FaEdit,
      category_deleted: FaTrash,
      user_created: FaUsers,
      user_updated: FaEdit,
      user_deleted: FaTrash,
      user_suspended: FaUsers,
      notification_sent: FaBell,
      settings_updated: FaCog,
      backup_created: FaCloudUploadAlt,
      backup_restored: FaDatabase
    };
    return icons[action] || FaClock;
  };

  const getActionColor = (action) => {
    if (action.includes('deleted')) return 'danger';
    if (action.includes('created')) return 'success';
    if (action.includes('updated')) return 'warning';
    if (action.includes('login')) return 'info';
    if (action.includes('logout')) return 'secondary';
    return 'primary';
  };

  const getActionLabel = (action) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(search) ||
      log.email?.toLowerCase().includes(search) ||
      log.userId?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="activity-logs">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Activity Logs</h1>
          <span className="page-count">{totalLogs} entries</span>
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
            placeholder="Search logs..."
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
              <th className="col-action">Action</th>
              <th className="col-user">User</th>
              <th className="col-details">Details</th>
              <th className="col-ip">IP Address</th>
              <th className="col-date" onClick={() => handleSort('timestamp')}>
                Time
                {sortConfig.key === 'timestamp' && (
                  sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <FaClock size={48} />
                    <h3>No activity logs found</h3>
                    <p>Logs will appear when admin actions are performed</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                const color = getActionColor(log.action);
                const label = getActionLabel(log.action);

                return (
                  <tr key={log.id} className="data-row">
                    <td className="col-action">
                      <span className={`action-badge ${color}`}>
                        <Icon size={12} />
                        {label}
                      </span>
                    </td>
                    <td className="col-user">
                      <span className="user-email">
                        {log.email || log.userId || 'Unknown'}
                      </span>
                    </td>
                    <td className="col-details">
                      <span className="details-text">
                        {log.details || '-'}
                      </span>
                    </td>
                    <td className="col-ip">
                      <span className="ip-address">{log.ip || '-'}</span>
                    </td>
                    <td className="col-date">
                      <span className="date-text">
                        {log.timestamp?.toDate?.() 
                          ? format(log.timestamp.toDate(), 'MMM d, yyyy h:mm a')
                          : 'N/A'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs;
