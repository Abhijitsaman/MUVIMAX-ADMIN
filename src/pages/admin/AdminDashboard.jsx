import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import {
  FaFilm,
  FaImage,
  FaTags,
  FaMusic,
  FaLanguage,
  FaUserTie,
  FaArrowRight
} from 'react-icons/fa';
import { MdMovie } from 'react-icons/md';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalBanners: 0,
    totalCategories: 0,
    totalGenres: 0,
    totalLanguages: 0,
    totalCast: 0
  });
  const [recentMovies, setRecentMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Count collections
        const moviesSnap = await getDocs(collection(db, 'movies'));
        const bannersSnap = await getDocs(collection(db, 'heroBanners'));
        const categoriesSnap = await getDocs(collection(db, 'categories'));
        const genresSnap = await getDocs(collection(db, 'genres'));
        const languagesSnap = await getDocs(collection(db, 'languages'));
        const castSnap = await getDocs(collection(db, 'cast'));

        // Recent movies
        const recentQuery = query(
          collection(db, 'movies'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnap = await getDocs(recentQuery);
        const recentData = [];
        recentSnap.forEach((doc) => {
          recentData.push({ id: doc.id, ...doc.data() });
        });

        setStats({
          totalMovies: moviesSnap.size,
          totalBanners: bannersSnap.size,
          totalCategories: categoriesSnap.size,
          totalGenres: genresSnap.size,
          totalLanguages: languagesSnap.size,
          totalCast: castSnap.size
        });
        setRecentMovies(recentData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    { 
      title: 'Total Movies', 
      value: stats.totalMovies, 
      icon: FaFilm, 
      color: '#e50914',
      bgColor: 'rgba(229, 9, 20, 0.15)'
    },
    { 
      title: 'Hero Banners', 
      value: stats.totalBanners, 
      icon: FaImage, 
      color: '#FF5722',
      bgColor: 'rgba(255, 87, 34, 0.15)'
    },
    { 
      title: 'Categories', 
      value: stats.totalCategories, 
      icon: FaTags, 
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.15)'
    },
    { 
      title: 'Genres', 
      value: stats.totalGenres, 
      icon: FaMusic, 
      color: '#9C27B0',
      bgColor: 'rgba(156, 39, 176, 0.15)'
    },
    { 
      title: 'Languages', 
      value: stats.totalLanguages, 
      icon: FaLanguage, 
      color: '#2196F3',
      bgColor: 'rgba(33, 150, 243, 0.15)'
    },
    { 
      title: 'Cast Members', 
      value: stats.totalCast, 
      icon: FaUserTie, 
      color: '#795548',
      bgColor: 'rgba(121, 85, 72, 0.15)'
    }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
        color: '#ffffff'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #2a2a2a',
          borderTop: '3px solid #e50914',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p>Loading dashboard...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your OTT platform</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/admin/movies/add" className="quick-action-btn primary">
            <FaFilm />
            <span>Add Movie</span>
          </Link>
          <Link to="/admin/banners/add" className="quick-action-btn secondary">
            <FaImage />
            <span>Add Banner</span>
          </Link>
        </div>
      </div>

      <div className="stat-cards-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-widget recent-movies">
          <div className="widget-header">
            <h3>Recent Movies</h3>
            <Link to="/admin/movies" className="widget-view-all">
              View All <FaArrowRight size={12} />
            </Link>
          </div>
          <div className="widget-content">
            {recentMovies.length === 0 ? (
              <div className="widget-empty">
                <FaFilm size={32} />
                <p>No movies found. Start adding movies!</p>
                <Link to="/admin/movies/add" className="empty-action">
                  Add Movie
                </Link>
              </div>
            ) : (
              <div className="movie-list">
                {recentMovies.map((movie) => (
                  <Link 
                    key={movie.id} 
                    to={`/admin/movies/edit/${movie.id}`}
                    className="movie-list-item"
                  >
                    <div className="movie-thumb">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title} />
                      ) : (
                        <div className="movie-thumb-placeholder">
                          <MdMovie size={24} />
                        </div>
                      )}
                    </div>
                    <div className="movie-info">
                      <h4>{movie.title}</h4>
                      <span className={`movie-status status-${movie.status || 'draft'}`}>
                        {movie.status || 'draft'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-widget quick-actions">
          <div className="widget-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="widget-content">
            <div className="quick-actions-grid">
              <Link to="/admin/movies/add" className="quick-action-card">
                <FaFilm size={24} />
                <span>Add Movie</span>
              </Link>
              <Link to="/admin/banners/add" className="quick-action-card">
                <FaImage size={24} />
                <span>Add Banner</span>
              </Link>
              <Link to="/admin/categories/add" className="quick-action-card">
                <FaTags size={24} />
                <span>Add Category</span>
              </Link>
              <Link to="/admin/genres/add" className="quick-action-card">
                <FaMusic size={24} />
                <span>Add Genre</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
