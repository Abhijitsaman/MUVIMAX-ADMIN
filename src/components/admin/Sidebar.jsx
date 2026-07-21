import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
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
  FaVideo,
  FaLanguage,
  FaUserTie,
  FaBox,
  FaMusic,
  FaGlobe,
  FaLayerGroup,
  FaScroll
} from 'react-icons/fa';
import { MdMovie, MdTheaters } from 'react-icons/md';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar, isDarkMode } = useTheme();
  const { adminRole, checkPermission } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();

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
      path: '/admin/dashboard',
      module: 'dashboard'
    },
    {
      key: 'content',
      icon: FaFilm,
      label: 'Content',
      children: [
        { key: 'movies', icon: MdMovie, label: 'Movies', path: '/admin/movies', module: 'movies' },
        { key: 'banners', icon: FaImage, label: 'Hero Banners', path: '/admin/banners', module: 'banners' },
        { key: 'subtitles', icon: FaScroll, label: 'Subtitles', path: '/admin/subtitles', module: 'subtitles' }
      ]
    },
    {
      key: 'metadata',
      icon: FaTags,
      label: 'Metadata',
      children: [
        { key: 'categories', icon: FaLayerGroup, label: 'Categories', path: '/admin/categories', module: 'categories' },
        { key: 'genres', icon: FaMusic, label: 'Genres', path: '/admin/genres', module: 'genres' },
        { key: 'languages', icon: FaLanguage, label: 'Languages', path: '/admin/languages', module: 'languages' },
        { key: 'tags', icon: FaTags, label: 'Tags', path: '/admin/tags', module: 'tags' },
        { key: 'cast', icon: FaUserTie, label: 'Cast & Crew', path: '/admin/cast', module: 'cast' },
        { key: 'metadata', icon: FaBox, label: 'Metadata Settings', path: '/admin/metadata', module: 'metadata' }
      ]
    },
    {
      key: 'users',
      icon: FaUsers,
      label: 'Users',
      path: '/admin/users',
      module: 'users'
    },
    {
      key: 'engagement',
      icon: FaStar,
      label: 'Engagement',
      children: [
        { key: 'reviews', icon: FaStar, label: 'Reviews', path: '/admin/reviews', module: 'reviews' },
        { key: 'comments', icon: FaComment, label: 'Comments', path: '/admin/comments', module: 'comments' }
      ]
    },
    {
      key: 'notifications',
      icon: FaBell,
      label: 'Notifications',
      path: '/admin/notifications',
      module: 'notifications'
    },
    {
      key: 'analytics',
      icon: FaChartBar,
      label: 'Analytics',
      path: '/admin/analytics',
      module: 'analytics'
    },
    {
      key: 'system',
      icon: FaCog,
      label: 'System',
      children: [
        { key: 'settings', icon: FaCog, label: 'Settings', path: '/admin/settings', module: 'settings' },
        { key: 'storage', icon: FaDatabase, label: 'Storage', path: '/admin/storage', module: 'storage' },
        { key: 'backup', icon: FaCloudUploadAlt, label: 'Backup', path: '/admin/backup', module: 'backup' },
        { key: 'activity', icon: FaHistory, label: 'Activity Logs', path: '/admin/activity', module: 'activity' },
        { key: 'security', icon: FaShieldAlt, label: 'Security Logs', path: '/admin/security', module: 'security' }
      ]
    },
    {
      key: 'admins',
      icon: FaUserCog,
      label: 'Admin Management',
      path: '/admin/admins',
      module: 'admins'
    },
    {
      key: 'help',
      icon: FaQuestionCircle,
      label: 'Help Center',
      path: '/admin/help',
      module: 'help'
    }
  ];

  const hasPermission = (module, action = 'view') => {
    if (adminRole === 'super_admin') return true;
    return checkPermission(module, action);
  };

  const renderMenuItem = (item, depth = 0) => {
    const isExpanded = expandedMenus[item.key];
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.path && location.pathname === item.path;
    const isChildActive = hasChildren && item.children.some(
      child => location.pathname === child.path
    );

    if (hasChildren) {
      const visibleChildren = item.children.filter(child => 
        hasPermission(child.module, 'view')
      );
      
      if (visibleChildren.length === 0) return null;

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
              {visibleChildren.map(child => renderMenuItem(child, depth + 1))}
            </motion.div>
          )}
        </div>
      );
    }

    if (!hasPermission(item.module, 'view')) return null;

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
