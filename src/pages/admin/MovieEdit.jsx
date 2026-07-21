import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaSave,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlay,
  FaCopy,
  FaArchive,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import MovieForm from '../../components/admin/MovieForm';

const MovieEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const docRef = doc(db, 'movies', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setMovie({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Movie not found');
        }
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('Failed to load movie');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleUpdate = async (formData) => {
    setIsSaving(true);
    setError('');
    
    try {
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'movies', id), updateData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating movie:', err);
      setError('Failed to update movie');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'movies', id));
      navigate('/admin/movies');
    } catch (err) {
      console.error('Error deleting movie:', err);
      setError('Failed to delete movie');
      setShowDeleteModal(false);
    }
  };

  const handleDuplicate = async () => {
    if (!movie) return;
    
    try {
      const { id: _, ...movieData } = movie;
      const duplicateData = {
        ...movieData,
        title: `${movieData.title} (Copy)`,
        slug: `${movieData.slug}-copy-${Date.now()}`,
        status: 'draft',
        views: 0,
        likes: 0,
        favorites: 0,
        watchlistAdds: 0,
        shares: 0,
        averageRating: 0,
        totalReviews: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'movies'), duplicateData);
      navigate('/admin/movies');
    } catch (err) {
      console.error('Error duplicating movie:', err);
      setError('Failed to duplicate movie');
    }
  };

  const handleToggleStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'movies', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setMovie(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading movie...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="page-error">
        <FaExclamationTriangle size={48} />
        <h2>{error || 'Movie not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/movies')}>
          <FaArrowLeft /> Back to Movies
        </button>
      </div>
    );
  }

  return (
    <div className="movie-edit-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/movies')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Edit Movie</h1>
          <span className="movie-status-badge">{movie.status}</span>
        </div>
        <div className="page-header-right">
          <div className="action-group">
            <button className="btn btn-secondary" onClick={() => handleToggleStatus('published')}>
              <FaPlay /> Publish
            </button>
            <button className="btn btn-secondary" onClick={handleDuplicate}>
              <FaCopy /> Duplicate
            </button>
            <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
              <FaTrash /> Delete
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => handleUpdate(movie)} disabled={isSaving}>
            {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Movie updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <MovieForm 
        initialData={movie}
        onSubmit={handleUpdate}
        isEditing={true}
      />

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Movie</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FaExclamationTriangle size={48} className="warning-icon" />
                <p>Are you sure you want to delete <strong>"{movie.title}"</strong>?</p>
                <p className="warning-text">
                  This action cannot be undone. All associated data including reviews, 
                  ratings, and watch history will be permanently removed.
                </p>
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

export default MovieEdit;
