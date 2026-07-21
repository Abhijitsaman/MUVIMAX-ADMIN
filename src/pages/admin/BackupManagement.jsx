import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
  onSnapshot
} from 'firebase/firestore';
import {
  FaCloudUploadAlt,
  FaDownload,
  FaTrash,
  FaRefresh,
  FaHistory,
  FaDatabase,
  FaUsers,
  FaFilm,
  FaTags,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaTimes,
  FaSave
} from 'react-icons/fa';
import { format } from 'date-fns';

const BackupManagement = () => {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'backups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const backupsData = [];
      snapshot.forEach((doc) => {
        backupsData.push({ id: doc.id, ...doc.data() });
      });
      setBackups(backupsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      const collections = ['movies', 'users', 'categories', 'genres', 'languages', 'tags', 'reviews', 'comments'];
      const backupData = {};

      for (let i = 0; i < collections.length; i++) {
        const col = collections[i];
        const snapshot = await getDocs(collection(db, col));
        backupData[col] = [];
        snapshot.forEach((doc) => {
          backupData[col].push({ id: doc.id, ...doc.data() });
        });
        setBackupProgress(((i + 1) / collections.length) * 100);
      }

      await addDoc(collection(db, 'backups'), {
        data: backupData,
        collections: collections,
        size: JSON.stringify(backupData).length,
        createdAt: serverTimestamp(),
        status: 'completed'
      });

      setBackupProgress(100);
      setTimeout(() => {
        setIsBackingUp(false);
        setBackupProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error creating backup:', error);
      setIsBackingUp(false);
    }
  };

  const restoreBackup = async (backup) => {
    if (!backup) return;
    
    try {
      const data = backup.data;
      for (const [collectionName, items] of Object.entries(data)) {
        for (const item of items) {
          const { id, ...itemData } = item;
          await addDoc(collection(db, collectionName), itemData);
        }
      }
      setShowRestoreModal(false);
    } catch (error) {
      console.error('Error restoring backup:', error);
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      await deleteDoc(doc(db, 'backups', backupId));
      setShowDeleteModal(false);
      setBackupToDelete(null);
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <span className="status-badge success"><FaCheckCircle /> Completed</span>;
    }
    if (status === 'in-progress') {
      return <span className="status-badge warning"><FaSpinner className="spinning" /> In Progress</span>;
    }
    if (status === 'failed') {
      return <span className="status-badge danger"><FaExclamationTriangle /> Failed</span>;
    }
    return <span className="status-badge secondary">{status}</span>;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading backups...</p>
      </div>
    );
  }

  return (
    <div className="backup-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Backup Management</h1>
          <span className="page-count">{backups.length} backups</span>
        </div>
        <div className="page-header-right">
          <button 
            className="btn btn-primary" 
            onClick={createBackup} 
            disabled={isBackingUp}
          >
            {isBackingUp ? <FaSpinner className="spinning" /> : <FaCloudUploadAlt />}
            {isBackingUp ? `Backing up... ${Math.round(backupProgress)}%` : 'Create Backup'}
          </button>
        </div>
      </div>

      {isBackingUp && (
        <div className="backup-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${backupProgress}%` }} />
          </div>
          <span>{Math.round(backupProgress)}%</span>
        </div>
      )}

      <div className="backup-stats">
        <div className="stat-card">
          <FaDatabase size={24} />
          <div>
            <h4>{backups.length}</h4>
            <p>Total Backups</p>
          </div>
        </div>
        <div className="stat-card">
          <FaHistory size={24} />
          <div>
            <h4>{backups.filter(b => b.status === 'completed').length}</h4>
            <p>Successful</p>
          </div>
        </div>
        <div className="stat-card">
          <FaClock size={24} />
          <div>
            <h4>{backups.length > 0 ? format(new Date(backups[0].createdAt?.toDate?.() || Date.now()), 'MMM d, yyyy') : 'N/A'}</h4>
            <p>Latest Backup</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Backup ID</th>
              <th>Collections</th>
              <th>Size</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <FaCloudUploadAlt size={48} />
                    <h3>No backups found</h3>
                    <p>Create your first backup to secure your data</p>
                    <button className="btn btn-primary" onClick={createBackup}>
                      <FaCloudUploadAlt /> Create Backup
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.id}>
                  <td>
                    <span className="backup-id">#{backup.id.slice(0, 8)}</span>
                  </td>
                  <td>
                    <div className="collection-tags">
                      {backup.collections?.map((col, i) => (
                        <span key={i} className="collection-tag">{col}</span>
                      ))}
                    </div>
                  </td>
                  <td>{formatFileSize(backup.size || 0)}</td>
                  <td>{getStatusBadge(backup.status)}</td>
                  <td>
                    <span className="date-text">
                      {backup.createdAt?.toDate?.() 
                        ? format(backup.createdAt.toDate(), 'MMM d, yyyy h:mm a')
                        : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {backup.status === 'completed' && (
                        <button 
                          className="action-btn restore"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRestoreModal(true);
                          }}
                          title="Restore Backup"
                        >
                          <FaRefresh />
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={() => {
                          setBackupToDelete(backup);
                          setShowDeleteModal(true);
                        }}
                        title="Delete Backup"
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

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Restore Backup</h3>
              <button className="modal-close" onClick={() => setShowRestoreModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="restore-warning">
                <FaExclamationTriangle size={48} className="warning-icon" />
                <p>Are you sure you want to restore this backup?</p>
                <p className="warning-text">
                  This will restore all data from backup #{selectedBackup.id.slice(0, 8)}.
                  Current data will not be deleted, but duplicate entries may occur.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRestoreModal(false)}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={() => restoreBackup(selectedBackup)}>
                <FaRefresh /> Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && backupToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Backup</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FaExclamationTriangle size={48} className="warning-icon" />
                <p>Are you sure you want to delete this backup?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => deleteBackup(backupToDelete.id)}>
                <FaTrash /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;
