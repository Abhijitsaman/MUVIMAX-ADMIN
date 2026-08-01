import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
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
  FaChevronLeft,
  FaChevronRight,
  FaLanguage,
  FaUserTie,
  FaBox,
  FaMusic,
  FaLayerGroup,
  FaScroll
} from 'react-icons/fa';
import { MdMovie } from 'react-icons/md';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar, isDarkMode } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();

  console.log('📂 [Sidebar] Rendering, path:', location.pathname);

  const toggleMenu = (menuKey) => {
    if (sidebarCollapsed) return;
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: FaHome,
      label: 'Dashboard',
      path: '/admin/dashboard'
    },
    {
      key: 'content',
      icon: FaFilm,
      label: 'Content',
      children: [
        { key: 'movies', icon: MdMovie, label: 'Movies', path: '/admin/movies' },
        { key: 'banners', icon: FaImage, label: 'Hero Banners', path: '/admin/banners' },
        { key: 'subtitles', icon: FaScroll, label: 'Subtitles', path: '/admin/subtitles' }
      ]
    },
    {
      key: 'metadata',
      icon: FaTags,
      label: 'Metadata',
      children: [
        { key: 'categories', icon: FaLayerGroup, label: 'Categories', path: '/admin/categories' },
        { key: 'genres', icon: FaMusic, label: 'Genres', path: '/admin/genres' },
        { key: 'languages', icon: FaLanguage, label: 'Languages', path: '/admin/languages' },
        { key: 'tags', icon: FaTags, label: 'Tags', path: '/admin/tags' },
        { key: 'cast', icon: FaUserTie, label: 'Cast & Crew', path: '/admin/cast' },
        { key: 'metadata', icon: FaBox, label: 'Metadata Settings', path: '/admin/metadata' }
      ]
    },
    {
      key: 'users',
      icon: FaUsers,
      label: 'Users',
      path: '/admin/users'
    },
    {
      key: 'engagement',
      icon: FaStar,
      label: 'Engagement',
      children: [
        { key: 'reviews', icon: FaStar, label: 'Reviews', path: '/admin/reviews' },
        { key: 'comments', icon: FaComment, label: 'Comments', path: '/admin/comments' }
      ]
    },
    {
      key: 'notifications',
      icon: FaBell,
      label: 'Notifications',
      path: '/admin/notifications'
    },
    {
      key: 'analytics',
      icon: FaChartBar,
      label: 'Analytics',
      path: '/admin/analytics'
    },
    {
      key: 'system',
      icon: FaCog,
      label: 'System',
      children: [
        { key: 'settings', icon: FaCog, label: 'Settings', path: '/admin/settings' },
        { key: 'storage', icon: FaDatabase, label: 'Storage', path: '/admin/storage' },
        { key: 'backup', icon: FaCloudUploadAlt, label: 'Backup', path: '/admin/backup' },
        { key: 'activity', icon: FaHistory, label: 'Activity Logs', path: '/admin/activity' },
        { key: 'security', icon: FaShieldAlt, label: 'Security Logs', path: '/admin/security' }
      ]
    },
    {
      key: 'admins',
      icon: FaUserCog,
      label: 'Admin Management',
      path: '/admin/admins'
    },
    {
      key: 'help',
      icon: FaQuestionCircle,
      label: 'Help Center',
      path: '/admin/help'
    }
  ];

  const renderMenuItem = (item, depth = 0) => {
    const isExpanded = expandedMenus[item.key];
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.path && location.pathname === item.path;
    const isChildActive = hasChildren && item.children.some(
      child => location.pathname === child.path
    );

    if (hasChildren) {
      return (
        <div key={item.key} className="sidebar-menu-group">
          <button
            className={`sidebar-menu-button ${isChildActive ? 'active' : ''}`}
            onClick={() => toggleMenu(item.key)}
            style={{ paddingLeft: `${depth * 16 + 16}px` }}
          >
            <item.icon className="menu-icon" />
            {!sidebarCollapsed && (
              <>
                <span className="menu-label">{item.label}</span>
                <motion.span 
                  className="menu-arrow"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaChevronRight size={12} />
                </motion.span>
              </>
            )}
          </button>
          
          {!sidebarCollapsed && (
            <motion.div
              initial={false}
              animate={{ 
                height: isExpanded ? 'auto' : 0,
                opacity: isExpanded ? 1 : 0
              }}
              transition={{ duration: 0.2 }}
              className="sidebar-submenu"
            >
              {item.children.map(child => renderMenuItem(child, depth + 1))}
            </motion.div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.key}
        to={item.path}
        className={({ isActive }) => 
          `sidebar-menu-item ${isActive ? 'active' : ''}`
        }
        style={{ paddingLeft: `${depth * 16 + 16}px` }}
      >
        <item.icon className="menu-icon" />
        {!sidebarCollapsed && <span className="menu-label">{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="sidebar-header">
        {!sidebarCollapsed && (
          <div className="sidebar-brand">
            <span className="brand-icon">🎬</span>
            <span className="brand-text">MUVIMAX</span>
            <span className="brand-badge">Admin</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="sidebar-brand-collapsed">
            <span className="brand-icon">🎬</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;
