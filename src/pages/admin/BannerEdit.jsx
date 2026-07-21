import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  FaArrowLeft,
  FaSave,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';
import BannerForm from '../../components/admin/BannerForm';

const BannerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const docRef = doc(db, 'heroBanners', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBanner({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Banner not found');
        }
      } catch (err) {
        console.error('Error fetching banner:', err);
        setError('Failed to load banner');
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [id]);

  const handleUpdate = async (formData) => {
    setIsSaving(true);
    setError('');
    
    try {
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'heroBanners', id), updateData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating banner:', err);
      setError('Failed to update banner');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'heroBanners', id));
      navigate('/admin/banners');
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError('Failed to delete banner');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading banner...</p>
      </div>
    );
  }

  if (error || !banner) {
    return (
      <div className="page-error">
        <FaExclamationTriangle size={48} />
        <h2>{error || 'Banner not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/banners')}>
          <FaArrowLeft /> Back to Banners
        </button>
      </div>
    );
  }

  return (
    <div className="banner-edit-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/banners')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Edit Banner</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
            <FaTrash /> Delete
          </button>
          <button className="btn btn-primary" onClick={() => handleUpdate(banner)} disabled={isSaving}>
            {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Banner updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <BannerForm 
        initialData={banner}
        onSubmit={handleUpdate}
        isEditing={true}
      />

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Banner</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FaExclamationTriangle size={48} className="warning-icon" />
                <p>Are you sure you want to delete <strong>"{banner.title}"</strong>?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <FaTrash /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerEdit;
