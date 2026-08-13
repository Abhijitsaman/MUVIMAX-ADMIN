import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FaBars,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaChevronDown,
  FaUserCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onMenuToggle, onLogout, user }) => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0) return 'Dashboard';
    
    const titles = {
      'dashboard': 'Dashboard',
      'movies': 'Movies',
      'drafts': 'Drafts',
      'banners': 'Hero Banners',
      'categories': 'Categories',
      'genres': 'Genres',
      'languages': 'Languages',
      'cast': 'Cast & Crew',
      'profile': 'Profile'
    };
    
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === 'add') return `Add ${titles[segments[segments.length - 2]] || ''}`;
    if (lastSegment === 'edit') return `Edit ${titles[segments[segments.length - 2]] || ''}`;
    
    return titles[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
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

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
        </button>

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
