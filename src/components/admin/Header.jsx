import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FaBars,
  FaBell,
  FaUserCircle,
  FaSearch,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaQuestionCircle,
  FaChevronDown
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

const Header = ({ onMenuToggle, onLogout, user }) => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const getPageTitle = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0) return 'Dashboard';
    
    const titles = {
      'dashboard': 'Dashboard',
      'movies': 'Movies',
      'banners': 'Hero Banners',
      'categories': 'Categories',
      'genres': 'Genres',
      'languages': 'Languages',
      'tags': 'Tags',
      'cast': 'Cast & Crew',
      'users': 'Users',
      'reviews': 'Reviews',
      'comments': 'Comments',
      'notifications': 'Notifications',
      'analytics': 'Analytics',
      'settings': 'Settings',
      'storage': 'Storage',
      'backup': 'Backup',
      'activity': 'Activity Logs',
      'security': 'Security Logs',
      'admins': 'Admin Management',
      'profile': 'Profile',
      'help': 'Help Center'
    };
    
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === 'add') return `Add ${titles[segments[segments.length - 2]] || ''}`;
    if (lastSegment === 'edit') return `Edit ${titles[segments[segments.length - 2]] || ''}`;
    
    return titles[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    const breadcrumbs = [
      { label: 'Dashboard', path: '/admin/dashboard' }
    ];
    
    let currentPath = '/admin';
    for (let i = 1; i < segments.length; i++) {
      currentPath += '/' + segments[i];
      const label = segments[i].charAt(0).toUpperCase() + segments[i].slice(1);
      breadcrumbs.push({ label, path: currentPath });
    }
    
    return breadcrumbs;
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unreadNotifications = [];
      snapshot.forEach((doc) => {
        unreadNotifications.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(unreadNotifications);
      setUnreadCount(unreadNotifications.length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Search across multiple collections
    try {
      // This is a simplified search - in production, you might want to use Algolia or similar
      const searchTerms = query.toLowerCase().split(' ');
      // Mock search results for now
      setSearchResults([
        { type: 'movie', label: 'Movie 1', path: '/admin/movies' },
        { type: 'user', label: 'User 1', path: '/admin/users' }
      ]);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <header className={`admin-header ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <FaBars size={20} />
        </button>
        
        <div className="header-title">
          <h1>{getPageTitle()}</h1>
        </div>
      </div>

      <div className="header-center">
        <div className={`search-container ${isSearchOpen ? 'open' : ''}`}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search movies, users, categories..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            className="search-input"
          />
          
          <AnimatePresence>
            {isSearchOpen && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="search-results"
              >
                {searchResults.map((result, index) => (
                  <Link key={index} to={result.path} className="search-result-item">
                    <span className="result-type">{result.type}</span>
                    <span className="result-label">{result.label}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>
          
          <Link to="/admin/notifications" className="notification-btn">
            <FaBell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
        </div>

        <div className="profile-container">
          <button 
            className="profile-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="profile-avatar" />
            ) : (
              <FaUserCircle size={32} />
            )}
            <span className="profile-name">{user?.displayName || user?.email?.split('@')[0]}</span>
            <FaChevronDown size={12} className="profile-arrow" />
          </button>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="profile-menu"
              >
                <Link to="/admin/profile" className="profile-menu-item">
                  <FaUser size={16} />
                  <span>My Profile</span>
                </Link>
                <Link to="/admin/settings" className="profile-menu-item">
                  <FaCog size={16} />
                  <span>Settings</span>
                </Link>
                <Link to="/admin/help" className="profile-menu-item">
                  <FaQuestionCircle size={16} />
                  <span>Help Center</span>
                </Link>
                <hr className="profile-menu-divider" />
                <button className="profile-menu-item logout" onClick={onLogout}>
                  <FaSignOutAlt size={16} />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
