import React, { useState, useEffect } from 'react';
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
import {
  FaUsers,
  FaFilm,
  FaEye,
  FaClock,
  FaStar,
  FaComment,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaDownload,
  FaPrint
} from 'react-icons/fa';
import {
  Line,
  Bar,
  Doughnut,
  PolarArea
} from 'react-chartjs-2';
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
  ArcElement,
  RadialLinearScale
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
  ArcElement,
  RadialLinearScale
);

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMovies: 0,
    totalViews: 0,
    totalWatchTime: 0,
    totalReviews: 0,
    totalComments: 0,
    averageRating: 0
  });
  const [userGrowth, setUserGrowth] = useState([]);
  const [viewStats, setViewStats] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch users count
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const activeUsers = usersSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.status === 'active';
        });

        // Fetch movies count
        const moviesSnapshot = await getDocs(collection(db, 'movies'));

        // Fetch reviews
        const reviewsSnapshot = await getDocs(collection(db, 'reviews'));

        // Fetch comments
        const commentsSnapshot = await getDocs(collection(db, 'comments'));

        setStats({
          totalUsers: usersSnapshot.size,
          activeUsers: activeUsers.length,
          totalMovies: moviesSnapshot.size,
          totalViews: 0,
          totalWatchTime: 0,
          totalReviews: reviewsSnapshot.size,
          totalComments: commentsSnapshot.size,
          averageRating: 0
        });

        // Mock chart data
        setUserGrowth([
          { month: 'Jan', users: 120 },
          { month: 'Feb', users: 150 },
          { month: 'Mar', users: 180 },
          { month: 'Apr', users: 220 },
          { month: 'May', users: 280 },
          { month: 'Jun', users: 340 }
        ]);

        setViewStats([
          { day: 'Mon', views: 450 },
          { day: 'Tue', views: 520 },
          { day: 'Wed', views: 490 },
          { day: 'Thu', views: 580 },
          { day: 'Fri', views: 620 },
          { day: 'Sat', views: 700 },
          { day: 'Sun', views: 650 }
        ]);

        setCategoryDistribution([
          { label: 'Action', value: 35 },
          { label: 'Drama', value: 25 },
          { label: 'Comedy', value: 20 },
          { label: 'Thriller', value: 15 },
          { label: 'Romance', value: 5 }
        ]);

        setRatingDistribution([
          { label: '5 Stars', value: 30 },
          { label: '4 Stars', value: 25 },
          { label: '3 Stars', value: 20 },
          { label: '2 Stars', value: 15 },
          { label: '1 Star', value: 10 }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const userGrowthData = {
    labels: userGrowth.map(item => item.month),
    datasets: [
      {
        label: 'Users',
        data: userGrowth.map(item => item.users),
        borderColor: '#e50914',
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const viewStatsData = {
    labels: viewStats.map(item => item.day),
    datasets: [
      {
        label: 'Views',
        data: viewStats.map(item => item.views),
        backgroundColor: 'rgba(229, 9, 20, 0.6)',
        borderColor: '#e50914',
        borderWidth: 1
      }
    ]
  };

  const categoryData = {
    labels: categoryDistribution.map(item => item.label),
    datasets: [
      {
        data: categoryDistribution.map(item => item.value),
        backgroundColor: [
          '#e50914',
          '#ff6b35',
          '#ffd700',
          '#2196f3',
          '#9c27b0'
        ]
      }
    ]
  };

  const ratingData = {
    labels: ratingDistribution.map(item => item.label),
    datasets: [
      {
        data: ratingDistribution.map(item => item.value),
        backgroundColor: [
          '#4caf50',
          '#8bc34a',
          '#ffeb3b',
          '#ff9800',
          '#f44336'
        ]
      }
    ]
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: FaUsers, color: '#e50914' },
    { label: 'Active Users', value: stats.activeUsers, icon: FaUsers, color: '#4caf50' },
    { label: 'Total Movies', value: stats.totalMovies, icon: FaFilm, color: '#2196f3' },
    { label: 'Total Views', value: stats.totalViews, icon: FaEye, color: '#ff9800' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: FaStar, color: '#ffd700' },
    { label: 'Total Comments', value: stats.totalComments, icon: FaComment, color: '#9c27b0' }
  ];

  return (
    <div className="analytics-dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics Dashboard</h1>
          <span className="page-count">Platform Insights</span>
        </div>
        <div className="page-header-right">
          <div className="date-range-selector">
            <button 
              className={`date-btn ${dateRange === 'week' ? 'active' : ''}`}
              onClick={() => setDateRange('week')}
            >
              Week
            </button>
            <button 
              className={`date-btn ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => setDateRange('month')}
            >
              Month
            </button>
            <button 
              className={`date-btn ${dateRange === 'year' ? 'active' : ''}`}
              onClick={() => setDateRange('year')}
            >
              Year
            </button>
          </div>
          <button className="btn btn-secondary">
            <FaDownload /> Export
          </button>
          <button className="btn btn-secondary">
            <FaPrint /> Print
          </button>
        </div>
      </div>

      <div className="stat-cards-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-card-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-card-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="chart-card full-width">
          <h3>User Growth</h3>
          <Line data={userGrowthData} options={{ responsive: true }} />
        </div>

        <div className="chart-card">
          <h3>Daily Views</h3>
          <Bar data={viewStatsData} options={{ responsive: true }} />
        </div>

        <div className="chart-card">
          <h3>Category Distribution</h3>
          <Doughnut data={categoryData} options={{ responsive: true }} />
        </div>

        <div className="chart-card">
          <h3>Rating Distribution</h3>
          <PolarArea data={ratingData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
