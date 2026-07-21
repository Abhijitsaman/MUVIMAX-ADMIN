import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaFilm,
  FaImage,
  FaTags,
  FaUsers,
  FaStar,
  FaComment,
  FaBell,
  FaChartBar,
  FaCog,
  FaDatabase,
  FaCloudUploadAlt,
  FaHistory,
  FaShieldAlt,
  FaUserCog,
  FaQuestionCircle,
  FaTimes,
  FaVideo,
  FaLanguage,
  FaUserTie,
  FaBox,
  FaMusic,
  FaGlobe,
  FaLayerGroup,
  FaScroll
} from 'react-icons/fa';
import { MdMovie } from 'react-icons/md';

const MobileSidebar = ({ isOpen, onClose, onLogout }) => {
  const menuItems = [
    { icon: FaHome, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: FaFilm, label: 'Movies', path: '/admin/movies' },
    { icon: FaImage, label: 'Hero Banners', path: '/admin/banners' },
    { icon: FaLayerGroup, label: 'Categories', path: '/admin/categories' },
    { icon: FaMusic, label: 'Genres', path: '/admin/genres' },
    { icon: FaLanguage, label: 'Languages', path: '/admin/languages' },
    { icon: FaTags, label: 'Tags', path: '/admin/tags' },
    { icon: FaUserTie, label: 'Cast & Crew', path: '/admin/cast' },
    { icon: FaScroll, label: 'Subtitles', path: '/admin/subtitles' },
    { icon: FaUsers, label: 'Users', path: '/admin/users' },
    { icon: FaStar, label: 'Reviews', path: '/admin/reviews' },
    { icon: FaComment, label: 'Comments', path: '/admin/comments' },
    { icon: FaBell, label: 'Notifications', path: '/admin/notifications' },
    { icon: FaChartBar, label: 'Analytics', path: '/admin/analytics' },
    { icon: FaCog, label: 'Settings', path: '/admin/settings' },
    { icon: FaDatabase, label: 'Storage', path: '/admin/storage' },
    { icon: FaCloudUploadAlt, label: 'Backup', path: '/admin/backup' },
    { icon: FaHistory, label: 'Activity Logs', path: '/admin/activity' },
    { icon: FaShieldAlt, label: 'Security Logs', path: '/admin/security' },
    { icon: FaUserCog, label: 'Admin Management', path: '/admin/admins' },
    { icon: FaQuestionCircle, label: 'Help Center', path: '/admin/help' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-sidebar-overlay"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="mobile-sidebar"
          >
            <div className="mobile-sidebar-header">
              <div className="sidebar-brand">
                <span className="brand-icon">🎬</span>
                <span className="brand-text">MUVIMAX</span>
                <span className="brand-badge">Admin</span>
              </div>
              <button className="close-btn" onClick={onClose}>
                <FaTimes size={24} />
              </button>
            </div>

            <nav className="mobile-sidebar-nav">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `mobile-sidebar-item ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <item.icon className="menu-icon" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mobile-sidebar-footer">
              <button className="logout-btn" onClick={onLogout}>
                <FaSignOutAlt size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;
