import React, { useState, useEffect } from 'react';
import { storage, db } from '../../firebase/config';
import { ref, listAll, getMetadata, deleteObject, getDownloadURL } from 'firebase/storage';
import {
  FaDatabase,
  FaFile,
  FaFolder,
  FaImage,
  FaVideo,
  FaFileAudio,
  FaFileCode,
  FaTrash,
  FaDownload,
  FaSearch,
  FaTimes,
  FaUpload,
  FaPlus,
  FaFolderOpen,
  FaFilePdf,
  FaFileArchive,
  FaFileWord
} from 'react-icons/fa';
import { format } from 'date-fns';

const StorageManagement = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [storageStats, setStorageStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    storageUsed: 0,
    storageLimit: 10737418240, // 10GB
    fileTypes: {}
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const storageRef = ref(storage, currentPath);
        const result = await listAll(storageRef);
        
        const itemsData = [];
        let totalSize = 0;
        let fileTypes = {};

        for (const item of result.items) {
          const metadata = await getMetadata(item);
          const url = await getDownloadURL(item);
          const fileType = item.name.split('.').pop()?.toLowerCase() || 'unknown';
          
          fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;
          totalSize += metadata.size;

          itemsData.push({
            name: item.name,
            fullPath: item.fullPath,
            size: metadata.size,
            contentType: metadata.contentType,
            updated: metadata.updated,
            url: url,
            type: 'file'
          });
        }

        // Add folders
        for (const folder of result.prefixes) {
          itemsData.push({
            name: folder.name,
            fullPath: folder.fullPath,
            type: 'folder'
          });
        }

        setItems(itemsData);
        setStorageStats(prev => ({
          ...prev,
          totalFiles: itemsData.filter(i => i.type === 'file').length,
          totalSize: totalSize,
          storageUsed: prev.storageUsed + totalSize,
          fileTypes: fileTypes
        }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching storage:', error);
        setLoading(false);
      }
    };

    fetchStorage();
  }, [currentPath]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const icons = {
      'jpg': FaImage,
      'jpeg': FaImage,
      'png': FaImage,
      'gif': FaImage,
      'webp': FaImage,
      'svg': FaImage,
      'mp4': FaVideo,
      'webm': FaVideo,
      'ogg': FaVideo,
      'mp3': FaFileAudio,
      'wav': FaFileAudio,
      'flac': FaFileAudio,
      'pdf': FaFilePdf,
      'zip': FaFileArchive,
      'rar': FaFileArchive,
      '7z': FaFileArchive,
      'doc': FaFileWord,
      'docx': FaFileWord,
      'txt': FaFileCode,
      'js': FaFileCode,
      'html': FaFileCode,
      'css': FaFileCode,
      'json': FaFileCode
    };
    return icons[ext] || FaFile;
  };

  const getFileColor = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const colors = {
      'jpg': '#ff6b35',
      'jpeg': '#ff6b35',
      'png': '#2196f3',
      'gif': '#9c27b0',
      'webp': '#4caf50',
      'mp4': '#e50914',
      'webm': '#e50914',
      'mp3': '#ff9800',
      'wav': '#ff9800',
      'pdf': '#f44336',
      'zip': '#ffd700',
      'doc': '#2196f3',
      'docx': '#2196f3',
      'txt': '#9e9e9e',
      'js': '#ffd700',
      'html': '#ff6b35',
      'css': '#2196f3',
      'json': '#9e9e9e'
    };
    return colors[ext] || '#666';
  };

  const handleDelete = async (path) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const fileRef = ref(storage, path);
        await deleteObject(fileRef);
        setItems(prev => prev.filter(item => item.fullPath !== path));
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const handleNavigate = (folderPath) => {
    setCurrentPath(folderPath);
  };

  const handleBreadcrumb = (index) => {
    const parts = currentPath.split('/');
    const newPath = parts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
  };

  const filteredItems = items.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading storage...</p>
      </div>
    );
  }

  return (
    <div className="storage-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Storage Management</h1>
          <span className="page-count">{formatFileSize(storageStats.storageUsed)} used</span>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">
            <FaUpload /> Upload
          </button>
          <button className="btn btn-secondary">
            <FaPlus /> New Folder
          </button>
        </div>
      </div>

      <div className="storage-stats">
        <div className="storage-bar">
          <div 
            className="storage-progress"
            style={{ 
              width: `${(storageStats.storageUsed / storageStats.storageLimit) * 100}%`,
              background: (storageStats.storageUsed / storageStats.storageLimit) > 0.8 ? '#f44336' : '#4caf50'
            }}
          />
        </div>
        <div className="storage-info">
          <span>{formatFileSize(storageStats.storageUsed)} used</span>
          <span>{formatFileSize(storageStats.storageLimit)} total</span>
          <span>{Math.round((storageStats.storageUsed / storageStats.storageLimit) * 100)}% used</span>
        </div>
        <div className="storage-stats-grid">
          <div className="stat-item">
            <FaFile />
            <span>{storageStats.totalFiles} files</span>
          </div>
          <div className="stat-item">
            <FaFolder />
            <span>{items.filter(i => i.type === 'folder').length} folders</span>
          </div>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search files..."
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
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      <div className="breadcrumb">
        <span onClick={() => setCurrentPath('')}>Root</span>
        {currentPath.split('/').filter(Boolean).map((part, index, arr) => (
          <span key={index}>
            <span className="separator">/</span>
            <span onClick={() => handleBreadcrumb(index)}>{part}</span>
          </span>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <FaFolderOpen size={48} />
          <h3>Empty folder</h3>
          <p>No files or folders found in this location</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="storage-grid">
          {filteredItems.map((item, index) => {
            const Icon = item.type === 'folder' ? FaFolder : getFileIcon(item.name);
            const color = item.type === 'folder' ? '#ffd700' : getFileColor(item.name);
            
            return (
              <div 
                key={index} 
                className={`storage-item ${item.type === 'folder' ? 'folder' : 'file'}`}
                onClick={() => item.type === 'folder' && handleNavigate(item.fullPath)}
              >
                <div className="item-icon" style={{ color: color }}>
                  <Icon size={48} />
                </div>
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  {item.type === 'file' && (
                    <span className="item-size">{formatFileSize(item.size)}</span>
                  )}
                </div>
                {item.type === 'file' && (
                  <div className="item-actions">
                    <button 
                      className="action-btn download"
                      onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                    >
                      <FaDownload />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.fullPath); }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => {
                const Icon = item.type === 'folder' ? FaFolder : getFileIcon(item.name);
                return (
                  <tr key={index} onClick={() => item.type === 'folder' && handleNavigate(item.fullPath)}>
                    <td>
                      <div className="file-name">
                        <Icon /> {item.name}
                      </div>
                    </td>
                    <td>{item.type}</td>
                    <td>{item.type === 'file' ? formatFileSize(item.size) : '--'}</td>
                    <td>{item.type === 'file' && item.updated ? format(new Date(item.updated), 'MMM d, yyyy') : '--'}</td>
                    <td>
                      {item.type === 'file' && (
                        <div className="action-buttons">
                          <button className="action-btn download" onClick={() => window.open(item.url, '_blank')}>
                            <FaDownload />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(item.fullPath)}>
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StorageManagement;
