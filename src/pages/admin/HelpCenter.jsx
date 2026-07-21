import React, { useState } from 'react';
import {
  FaSearch,
  FaQuestionCircle,
  FaFilm,
  FaImage,
  FaUsers,
  FaBell,
  FaCog,
  FaDatabase,
  FaShieldAlt,
  FaUserCog,
  FaVideo,
  FaTags,
  FaLanguage,
  FaStar,
  FaComment,
  FaCloudUploadAlt,
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaExternalLinkAlt,
  FaEnvelope,
  FaPhone,
  FaBook,
  FaLightbulb,
  FaGraduationCap,
  FaLifeRing
} from 'react-icons/fa';

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: FaGraduationCap,
      articles: [
        { title: 'Welcome to MUVIMAX Admin Panel', description: 'Overview of the admin dashboard and its features' },
        { title: 'Admin Login & Security', description: 'How to securely access the admin panel' },
        { title: 'Understanding the Dashboard', description: 'Navigate through statistics and widgets' }
      ]
    },
    {
      id: 'movies',
      title: 'Movie Management',
      icon: FaFilm,
      articles: [
        { title: 'Adding a New Movie', description: 'Step-by-step guide to add movies with all details' },
        { title: 'Managing Movie Content', description: 'Edit, update, and organize your movie library' },
        { title: 'Uploading Videos & Subtitles', description: 'Best practices for video and subtitle uploads' },
        { title: 'Movie SEO & Metadata', description: 'Optimize movies for search engines' }
      ]
    },
    {
      id: 'banners',
      title: 'Banner Management',
      icon: FaImage,
      articles: [
        { title: 'Creating Hero Banners', description: 'Design and create engaging hero banners' },
        { title: 'Banner Image Guidelines', description: 'Recommended sizes and formats' },
        { title: 'Scheduling Banners', description: 'Set publish and expiry dates for banners' }
      ]
    },
    {
      id: 'metadata',
      title: 'Metadata Management',
      icon: FaTags,
      articles: [
        { title: 'Categories & Genres', description: 'Organize content with categories and genres' },
        { title: 'Languages & Subtitles', description: 'Manage languages and subtitle tracks' },
        { title: 'Tags & Keywords', description: 'Use tags for better content discovery' }
      ]
    },
    {
      id: 'users',
      title: 'User Management',
      icon: FaUsers,
      articles: [
        { title: 'Managing Users', description: 'View, edit, and manage user accounts' },
        { title: 'User Roles & Permissions', description: 'Understand user roles and access levels' },
        { title: 'User Activity & Analytics', description: 'Track user engagement and behavior' }
      ]
    },
    {
      id: 'engagement',
      title: 'Reviews & Comments',
      icon: FaStar,
      articles: [
        { title: 'Moderating Reviews', description: 'Approve, hide, and feature user reviews' },
        { title: 'Managing Comments', description: 'Moderate and respond to user comments' },
        { title: 'Handling Reports', description: 'Process user reports and take action' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: FaBell,
      articles: [
        { title: 'Sending Notifications', description: 'Create and send notifications to users' },
        { title: 'Notification Types', description: 'Different notification types and their uses' },
        { title: 'Scheduling Notifications', description: 'Schedule notifications for later delivery' }
      ]
    },
    {
      id: 'settings',
      title: 'System Settings',
      icon: FaCog,
      articles: [
        { title: 'Platform Configuration', description: 'Configure general platform settings' },
        { title: 'Appearance Settings', description: 'Customize the look and feel' },
        { title: 'Security Settings', description: 'Configure security and access controls' }
      ]
    },
    {
      id: 'storage',
      title: 'Storage & Backup',
      icon: FaDatabase,
      articles: [
        { title: 'Managing Storage', description: 'Monitor and manage storage usage' },
        { title: 'Backup & Restore', description: 'Create and restore backups' },
        { title: 'Storage Optimization', description: 'Best practices for storage management' }
      ]
    },
    {
      id: 'security',
      title: 'Security & Logs',
      icon: FaShieldAlt,
      articles: [
        { title: 'Activity Logs', description: 'Monitor admin activities' },
        { title: 'Security Logs', description: 'Track security events and alerts' },
        { title: 'Security Best Practices', description: 'Keep your platform secure' }
      ]
    }
  ];

  const filteredSections = sections.filter(section => {
    const search = searchTerm.toLowerCase();
    if (section.title.toLowerCase().includes(search)) return true;
    return section.articles.some(article => 
      article.title.toLowerCase().includes(search) ||
      article.description.toLowerCase().includes(search)
    );
  });

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="help-center">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Help Center</h1>
          <span className="page-count">Support & Documentation</span>
        </div>
      </div>

      <div className="help-search">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="help-quick-links">
        <div className="quick-link-card">
          <FaBook />
          <h4>Documentation</h4>
          <p>Complete admin guide</p>
        </div>
        <div className="quick-link-card">
          <FaLightbulb />
          <h4>Tips & Tricks</h4>
          <p>Best practices</p>
        </div>
        <div className="quick-link-card">
          <FaEnvelope />
          <h4>Email Support</h4>
          <p>support@muvimax.com</p>
        </div>
        <div className="quick-link-card">
          <FaLifeRing />
          <h4>Live Support</h4>
          <p>Available 24/7</p>
        </div>
      </div>

      <div className="help-sections">
        {filteredSections.length === 0 ? (
          <div className="empty-state">
            <FaSearch size={48} />
            <h3>No results found</h3>
            <p>Try adjusting your search terms</p>
          </div>
        ) : (
          filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div key={section.id} className="help-section">
                <button 
                  className="help-section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="section-title">
                    <Icon size={20} />
                    <h3>{section.title}</h3>
                    <span className="article-count">{section.articles.length} articles</span>
                  </div>
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                {isExpanded && (
                  <div className="help-articles">
                    {section.articles.map((article, index) => (
                      <div key={index} className="help-article">
                        <div className="article-content">
                          <h4>{article.title}</h4>
                          <p>{article.description}</p>
                        </div>
                        <button className="read-more">
                          Read More <FaExternalLinkAlt size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="help-footer">
        <div className="help-contact">
          <h3>Need more help?</h3>
          <p>Contact our support team for assistance</p>
          <div className="contact-options">
            <div className="contact-option">
              <FaEnvelope />
              <span>support@muvimax.com</span>
            </div>
            <div className="contact-option">
              <FaPhone />
              <span>+1 (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
