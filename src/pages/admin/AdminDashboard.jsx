import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  FaFilm,
  FaUsers,
  FaStar,
  FaComment,
  FaEye,
  FaClock,
  FaImage,
  FaTag,
  FaMusic,
  FaGlobe,
  FaBell,
  FaDatabase,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { MdMovie } from 'react-icons/md';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    publishedMovies: 0,
    draftMovies: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalReviews: 0,
    totalComments: 0,
    totalBanners: 0,
    totalCategories: 0,
    totalGenres: 0,
    totalLanguages: 0,
    totalTags: 0,
    totalCast: 0,
    storageUsed: 0
  });
  
  const [recentMovies, setRecentMovies] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('📊 [AdminDashboard] Rendering, loading:', loading);

  useEffect(() => {
    console.log('📊 [AdminDashboard] Loading dashboard data...');
    const loadDashboardData = async () => {
      try {
        console.log('📊 [AdminDashboard] Fetching movies count...');
        const moviesSnapshot = await getDocs(collection(db, 'movies'));
        console.log('📊 [AdminDashboard] Movies count:', moviesSnapshot.size);
        
        const publishedMoviesSnap = await getDocs(
          query(collection(db, 'movies'), where('status', '==', 'published'))
        );
        const draftMoviesSnap = await getDocs(
          query(collection(db, 'movies'), where('status', '==', 'draft'))
        );

        console.log('📊 [AdminDashboard] Fetching users...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log('📊 [AdminDashboard] Users count:', usersSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching reviews...');
        const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
        console.log('📊 [AdminDashboard] Reviews count:', reviewsSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching comments...');
        const commentsSnapshot = await getDocs(collection(db, 'comments'));
        console.log('📊 [AdminDashboard] Comments count:', commentsSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching banners...');
        const bannersSnapshot = await getDocs(collection(db, 'heroBanners'));
        console.log('📊 [AdminDashboard] Banners count:', bannersSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching categories...');
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        console.log('📊 [AdminDashboard] Categories count:', categoriesSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching genres...');
        const genresSnapshot = await getDocs(collection(db, 'genres'));
        console.log('📊 [AdminDashboard] Genres count:', genresSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching languages...');
        const languagesSnapshot = await getDocs(collection(db, 'languages'));
        console.log('📊 [AdminDashboard] Languages count:', languagesSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching tags...');
        const tagsSnapshot = await getDocs(collection(db, 'tags'));
        console.log('📊 [AdminDashboard] Tags count:', tagsSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching cast...');
        const castSnapshot = await getDocs(collection(db, 'cast'));
        console.log('📊 [AdminDashboard] Cast count:', castSnapshot.size);

        console.log('📊 [AdminDashboard] Fetching recent movies...');
        const recentMoviesQuery = query(
          collection(db, 'movies'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentMoviesSnap = await getDocs(recentMoviesQuery);
        const recentMoviesData = [];
        recentMoviesSnap.forEach((doc) => {
          recentMoviesData.push({ id: doc.id, ...doc.data() });
        });
        setRecentMovies(recentMoviesData);
        console.log('📊 [AdminDashboard] Recent movies:', recentMoviesData.length);

        console.log('📊 [AdminDashboard] Fetching recent users...');
        const recentUsersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentUsersSnap = await getDocs(recentUsersQuery);
        const recentUsersData = [];
        recentUsersSnap.forEach((doc) => {
          recentUsersData.push({ id: doc.id, ...doc.data() });
        });
        setRecentUsers(recentUsersData);
        console.log('📊 [AdminDashboard] Recent users:', recentUsersData.length);

        console.log('📊 [AdminDashboard] Fetching recent reviews...');
        const recentReviewsQuery = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentReviewsSnap = await getDocs(recentReviewsQuery);
        const recentReviewsData = [];
        recentReviewsSnap.forEach((doc) => {
          recentReviewsData.push({ id: doc.id, ...doc.data() });
        });
        setRecentReviews(recentReviewsData);
        console.log('📊 [AdminDashboard] Recent reviews:', recentReviewsData.length);

        // Calculate active users
        let activeCount = 0;
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.lastActive && data.lastActive.toDate() > fiveMinutesAgo) {
            activeCount++;
          }
        });
        console.log('📊 [AdminDashboard] Active users:', activeCount);

        setStats({
          totalMovies: moviesSnapshot.size,
          publishedMovies: publishedMoviesSnap.size,
          draftMovies: draftMoviesSnap.size,
          totalUsers: usersSnapshot.size,
          activeUsers: activeCount,
          totalReviews: reviewsSnapshot.size,
          totalComments: commentsSnapshot.size,
          totalBanners: bannersSnapshot.size,
          totalCategories: categoriesSnapshot.size,
          totalGenres: genresSnapshot.size,
          totalLanguages: languagesSnapshot.size,
          totalTags: tagsSnapshot.size,
          totalCast: castSnapshot.size,
          storageUsed: 0
        });

        setLoading(false);
        console.log('📊 [AdminDashboard] Dashboard data loaded successfully');
      } catch (error) {
        console.error('📊 [AdminDashboard] Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();

    // Real-time listeners for active users
    console.log('📊 [AdminDashboard] Setting up real-time users listener');
    const usersListener = onSnapshot(collection(db, 'users'), (snapshot) => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      let activeCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastActive && data.lastActive.toDate() > fiveMinutesAgo) {
          activeCount++;
        }
      });
      
      setStats(prev => ({
        ...prev,
        activeUsers: activeCount
      }));
      console.log('📊 [AdminDashboard] Active users updated:', activeCount);
    }, (error) => {
      console.error('📊 [AdminDashboard] Users listener error:', error);
    });

    return () => {
      console.log('📊 [AdminDashboard] Cleaning up users listener');
      usersListener();
    };
  }, []);

  const statCards = [
    { 
      title: 'Total Movies', 
      value: stats.totalMovies, 
      icon: FaFilm, 
      color: '#e50914',
      bgColor: 'rgba(229, 9, 20, 0.1)',
      subtitle: `${stats.publishedMovies} published, ${stats.draftMovies} draft`
    },
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: FaUsers, 
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      subtitle: `${stats.activeUsers} active now`
    },
    { 
      title: 'Reviews & Comments', 
      value: stats.totalReviews + stats.totalComments, 
      icon: FaStar, 
      color: '#FFD700',
      bgColor: 'rgba(255, 215, 0, 0.1)',
      subtitle: `${stats.totalReviews} reviews, ${stats.totalComments} comments`
    },
    { 
      title: 'Content Categories', 
      value: stats.totalCategories + stats.totalGenres, 
      icon: FaTag, 
      color: '#2196F3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
      subtitle: `${stats.totalCategories} categories, ${stats.totalGenres} genres`
    },
    { 
      title: 'Hero Banners', 
      value: stats.totalBanners, 
      icon: FaImage, 
      color: '#FF5722',
      bgColor: 'rgba(255, 87, 34, 0.1)',
      subtitle: 'Active hero banners'
    },
    { 
      title: 'Cast Members', 
      value: stats.totalCast, 
      icon: FaUsers, 
      color: '#795548',
      bgColor: 'rgba(121, 85, 72, 0.1)',
      subtitle: 'Total cast & crew'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    console.log('📊 [AdminDashboard] Showing loading state');
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

  console.log('📊 [AdminDashboard] Rendering dashboard content');
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
          <Link to="/admin/notifications/add" className="quick-action-btn tertiary">
            <FaBell />
            <span>Send Notification</span>
          </Link>
        </div>
      </div>

      <motion.div 
        className="stat-cards-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statCards.map((stat, index) => (
          <motion.div 
            key={index} 
            className="stat-card"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="stat-card-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.title}</p>
              {stat.subtitle && (
                <span className="stat-subtitle">{stat.subtitle}</span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="dashboard-grid">
        <motion.div 
          className="dashboard-widget recent-movies"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
        </motion.div>

        <motion.div 
          className="dashboard-widget recent-users"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="widget-header">
            <h3>Recent Users</h3>
            <Link to="/admin/users" className="widget-view-all">
              View All <FaArrowRight size={12} />
            </Link>
          </div>
          <div className="widget-content">
            {recentUsers.length === 0 ? (
              <div className="widget-empty">
                <FaUsers size={32} />
                <p>No users registered yet</p>
              </div>
            ) : (
              <div className="user-list">
                {recentUsers.map((user) => (
                  <Link 
                    key={user.id} 
                    to={`/admin/users/${user.id}`}
                    className="user-list-item"
                  >
                    <div className="user-avatar">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <h4>{user.displayName || 'User'}</h4>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-widget recent-reviews"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="widget-header">
            <h3>Recent Reviews</h3>
            <Link to="/admin/reviews" className="widget-view-all">
              View All <FaArrowRight size={12} />
            </Link>
          </div>
          <div className="widget-content">
            {recentReviews.length === 0 ? (
              <div className="widget-empty">
                <FaStar size={32} />
                <p>No reviews yet</p>
              </div>
            ) : (
              <div className="review-list">
                {recentReviews.map((review) => (
                  <div key={review.id} className="review-list-item">
                    <div className="review-info">
                      <h4>{review.title || 'Untitled Review'}</h4>
                      <p className="review-content">{review.content?.substring(0, 60)}...</p>
                      <span className="review-meta">
                        <FaStar style={{ color: '#FFD700' }} /> {review.rating || 0} · {review.userName || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-widget platform-health"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="widget-header">
            <h3>Platform Health</h3>
          </div>
          <div className="widget-content">
            <div className="health-metrics">
              <div className="health-metric">
                <div className="metric-icon success">
                  <FaCheckCircle />
                </div>
                <div className="metric-info">
                  <h4>Firestore</h4>
                  <span className="metric-status online">Online</span>
                </div>
              </div>
              <div className="health-metric">
                <div className="metric-icon success">
                  <FaCheckCircle />
                </div>
                <div className="metric-info">
                  <h4>Authentication</h4>
                  <span className="metric-status online">Online</span>
                </div>
              </div>
              <div className="health-metric">
                <div className="metric-icon success">
                  <FaCheckCircle />
                </div>
                <div className="metric-info">
                  <h4>Storage</h4>
                  <span className="metric-status online">Online</span>
                </div>
              </div>
              <div className="health-metric">
                <div className="metric-icon warning">
                  <FaExclamationTriangle />
                </div>
                <div className="metric-info">
                  <h4>API Response</h4>
                  <span className="metric-status warning">Normal</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
