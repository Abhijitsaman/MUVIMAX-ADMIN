import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  count,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  FaFilm,
  FaUsers,
  FaStar,
  FaComment,
  FaEye,
  FaClock,
  FaTrendingUp,
  FaCalendarAlt,
  FaPlay,
  FaHeart,
  FaBookmark,
  FaImage,
  FaTag,
  FaMusic,
  FaGlobe,
  FaBell,
  FaDatabase,
  FaCloudUploadAlt,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import {
  MdMovie,
  MdTheaters,
  MdVideoLibrary,
  MdTimeline
} from 'react-icons/md';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
    totalViews: 0,
    watchTime: 0,
    storageUsed: 0,
    storageLimit: 0
  });
  
  const [recentMovies, setRecentMovies] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewStats, setViewStats] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load movies count
        const moviesSnapshot = await getDocs(collection(db, 'movies'));
        const publishedMoviesSnap = await getDocs(
          query(collection(db, 'movies'), where('status', '==', 'published'))
        );
        const draftMoviesSnap = await getDocs(
          query(collection(db, 'movies'), where('status', '==', 'draft'))
        );

        // Load users
        const usersSnapshot = await getDocs(collection(db, 'users'));

        // Load reviews
        const reviewsSnapshot = await getDocs(collection(db, 'reviews'));

        // Load comments
        const commentsSnapshot = await getDocs(collection(db, 'comments'));

        // Load banners
        const bannersSnapshot = await getDocs(collection(db, 'heroBanners'));

        // Load categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));

        // Load genres
        const genresSnapshot = await getDocs(collection(db, 'genres'));

        // Load languages
        const languagesSnapshot = await getDocs(collection(db, 'languages'));

        // Load tags
        const tagsSnapshot = await getDocs(collection(db, 'tags'));

        // Load cast
        const castSnapshot = await getDocs(collection(db, 'cast'));

        // Load recent movies
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

        // Load recent users
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

        // Load recent reviews
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

        // Load recent comments
        const recentCommentsQuery = query(
          collection(db, 'comments'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentCommentsSnap = await getDocs(recentCommentsQuery);
        const recentCommentsData = [];
        recentCommentsSnap.forEach((doc) => {
          recentCommentsData.push({ id: doc.id, ...doc.data() });
        });
        setRecentComments(recentCommentsData);

        // Calculate storage
        let storageUsed = 0;
        const storageSnap = await getDocs(collection(db, 'storage'));
        storageSnap.forEach((doc) => {
          storageUsed += doc.data().size || 0;
        });

        setStats({
          totalMovies: moviesSnapshot.size,
          publishedMovies: publishedMoviesSnap.size,
          draftMovies: draftMoviesSnap.size,
          totalUsers: usersSnapshot.size,
          activeUsers: 0, // Will be updated with real-time listener
          totalReviews: reviewsSnapshot.size,
          totalComments: commentsSnapshot.size,
          totalBanners: bannersSnapshot.size,
          totalCategories: categoriesSnapshot.size,
          totalGenres: genresSnapshot.size,
          totalLanguages: languagesSnapshot.size,
          totalTags: tagsSnapshot.size,
          totalCast: castSnapshot.size,
          totalViews: 0,
          watchTime: 0,
          storageUsed: storageUsed,
          storageLimit: 10000000000 // 10GB
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();

    // Real-time listeners for active users
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
    });

    return () => {
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
      title: 'Languages & Tags', 
      value: stats.totalLanguages + stats.totalTags, 
      icon: FaGlobe, 
      color: '#9C27B0',
      bgColor: 'rgba(156, 39, 176, 0.1)',
      subtitle: `${stats.totalLanguages} languages, ${stats.totalTags} tags`
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
    },
    { 
      title: 'Storage Usage', 
      value: (stats.storageUsed / (1024 * 1024 * 1024)).toFixed(2), 
      icon: FaDatabase, 
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      subtitle: `${(stats.storageUsed / (1024 * 1024)).toFixed(0)} MB used`
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
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
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
                      {movie.views && (
                        <span className="movie-views">
                          <FaEye size={12} /> {movie.views}
                        </span>
                      )}
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
                      {user.role && (
                        <span className="user-role">{user.role}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="dashboard-widget recent-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="widget-header">
            <h3>Recent Activity</h3>
            <Link to="/admin/activity" className="widget-view-all">
              View All <FaArrowRight size={12} />
            </Link>
          </div>
          <div className="widget-content">
            <div className="activity-timeline">
              {recentActivity.length === 0 ? (
                <div className="widget-empty">
                  <FaClock size={32} />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'login' && <FaUsers />}
                      {activity.type === 'movie_added' && <FaFilm />}
                      {activity.type === 'movie_edited' && <MdTheaters />}
                      {activity.type === 'user_joined' && <FaUserPlus />}
                      {activity.type === 'review_posted' && <FaStar />}
                      {activity.type === 'comment_posted' && <FaComment />}
                    </div>
                    <div className="activity-content">
                      <p>{activity.description}</p>
                      <span className="activity-time">
                        {activity.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                  <span className="metric-status warning">Slow</span>
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
