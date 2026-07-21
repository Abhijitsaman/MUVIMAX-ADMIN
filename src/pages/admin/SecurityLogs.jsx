import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  limit,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUser,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFilter,
  FaTimes,
  FaLock,
  FaUnlock,
  FaUserSlash,
  FaUserCheck,
  FaKey,
  FaEnvelope,
  FaGlobe,
  FaDesktop
} from 'react-icons/fa';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'securityLogs'), orderBy('timestamp', 'desc'), limit(100));
    
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    const sorted = [...logs].sort((a, b) => {
      const aVal = a[key] || '';
      const bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setLogs(sorted);
  };

  const getEventIcon = (type) => {
    const icons = {
      login_success: FaCheckCircle,
      login_failure: FaTimesCircle,
      logout: FaUnlock,
      password_reset: FaKey,
      password_change: FaKey,
      email_change: FaEnvelope,
      account_lock: FaLock,
      account_unlock: FaUnlock,
      user_suspended: FaUserSlash,
      user_unsuspended: FaUserCheck,
      suspicious_activity: FaExclamationTriangle,
      permission_change: FaShieldAlt,
      admin_login: FaUser,
      admin_logout: FaUser,
      ip_blocked: FaGlobe,
      ip_unblocked: FaGlobe
    };
    return icons[type] || FaShieldAlt;
  };

  const getEventColor = (type) => {
    if (type.includes('success') || type.includes('unlock') || type.includes('check')) return 'success';
    if (type.includes('failure') || type.includes('lock') || type.includes('suspend')) return 'danger';
    if (type.includes('warning') || type.includes('suspicious')) return 'warning';
    if (type.includes('change') || type.includes('reset')) return 'info';
    return 'primary';
  };

  const getEventLabel = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusBadge = (status) => {
    if (status === 'success') {
      return <span className="status-badge success"><FaCheckCircle /> Success</span>;
    }
    if (status === 'failure') {
      return <span className="status-badge danger"><FaTimesCircle /> Failed</span>;
    }
    if (status === 'warning') {
      return <span className="status-badge warning"><FaExclamationTriangle /> Warning</span>;
    }
    return <span className="status-badge secondary">{status}</span>;
  };

  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      log.type?.toLowerCase().includes(search) ||
      log.email?.toLowerCase().includes(search) ||
      log.userId?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search) ||
      log.ip?.toLowerCase().includes(search);
    
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const logTypes = [...new Set(logs.map(log => log.type))].filter(Boolean);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading security logs...</p>
      </div>
    );
  }

  return (
    <div className="security-logs">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Security Logs</h1>
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
            placeholder="Search security logs..."
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
            <option value="all">All Events</option>
            {logTypes.map(type => (
              <option key={type} value={type}>{getEventLabel(type)}</option>
            ))}
          </select>
        </div>

        <div className="filter-container">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-event">Event</th>
              <th className="col-user">User</th>
              <th className="col-details">Details</th>
              <th className="col-ip">IP Address</th>
              <th className="col-status">Status</th>
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
                <td colSpan="6">
                  <div className="empty-state">
                    <FaShieldAlt size={48} />
                    <h3>No security logs found</h3>
                    <p>Security events will appear here</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const Icon = getEventIcon(log.type);
                const color = getEventColor(log.type);
                const label = getEventLabel(log.type);

                return (
                  <tr 
                    key={log.id} 
                    className="data-row clickable"
                    onClick={() => {
                      setSelectedLog(log);
                      setShowDetailsModal(true);
                    }}
                  >
                    <td className="col-event">
                      <span className={`event-badge ${color}`}>
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
                    <td className="col-status">
                      {getStatusBadge(log.status)}
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

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedLog && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Security Event Details</h3>
                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="security-details">
                  <div className="detail-row">
                    <label>Event Type</label>
                    <span className="event-type">{getEventLabel(selectedLog.type)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status</label>
                    <span>{getStatusBadge(selectedLog.status)}</span>
                  </div>
                  <div className="detail-row">
                    <label>User</label>
                    <span>{selectedLog.email || selectedLog.userId || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <label>IP Address</label>
                    <span className="ip-address">{selectedLog.ip || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>User Agent</label>
                    <span className="user-agent">{selectedLog.userAgent || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Details</label>
                    <span className="details-full">{selectedLog.details || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Timestamp</label>
                    <span>
                      {selectedLog.timestamp?.toDate?.() 
                        ? format(selectedLog.timestamp.toDate(), 'MMM d, yyyy h:mm:ss a')
                        : 'N/A'}
                    </span>
                  </div>
                  {selectedLog.metadata && (
                    <div className="detail-row full-width">
                      <label>Metadata</label>
                      <pre className="metadata-json">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecurityLogs;
