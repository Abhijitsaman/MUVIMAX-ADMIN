import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import all admin pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLayout from '../layouts/AdminLayout';
import MoviesManagement from '../pages/admin/MoviesManagement';
import MovieAdd from '../pages/admin/MovieAdd';
import MovieEdit from '../pages/admin/MovieEdit';
import BannersManagement from '../pages/admin/BannersManagement';
import BannerAdd from '../pages/admin/BannerAdd';
import BannerEdit from '../pages/admin/BannerEdit';
import CategoriesManagement from '../pages/admin/CategoriesManagement';
import CategoryAdd from '../pages/admin/CategoryAdd';
import CategoryEdit from '../pages/admin/CategoryEdit';
import GenresManagement from '../pages/admin/GenresManagement';
import GenreAdd from '../pages/admin/GenreAdd';
import GenreEdit from '../pages/admin/GenreEdit';
import LanguagesManagement from '../pages/admin/LanguagesManagement';
import LanguageAdd from '../pages/admin/LanguageAdd';
import LanguageEdit from '../pages/admin/LanguageEdit';
import UsersManagement from '../pages/admin/UsersManagement';
import UserProfile from '../pages/admin/UserProfile';
import ReviewsManagement from '../pages/admin/ReviewsManagement';
import CommentsManagement from '../pages/admin/CommentsManagement';
import NotificationsManagement from '../pages/admin/NotificationsManagement';
import NotificationAdd from '../pages/admin/NotificationAdd';
import AnalyticsDashboard from '../pages/admin/AnalyticsDashboard';
import SettingsManagement from '../pages/admin/SettingsManagement';
import StorageManagement from '../pages/admin/StorageManagement';
import BackupManagement from '../pages/admin/BackupManagement';
import ActivityLogs from '../pages/admin/ActivityLogs';
import SecurityLogs from '../pages/admin/SecurityLogs';
import AdminProfile from '../pages/admin/AdminProfile';
import AdminManagement from '../pages/admin/AdminManagement';
import AdminAdd from '../pages/admin/AdminAdd';
import AdminEdit from '../pages/admin/AdminEdit';
import TagsManagement from '../pages/admin/TagsManagement';
import TagAdd from '../pages/admin/TagAdd';
import TagEdit from '../pages/admin/TagEdit';
import CastManagement from '../pages/admin/CastManagement';
import CastAdd from '../pages/admin/CastAdd';
import CastEdit from '../pages/admin/CastEdit';
import SubtitleManagement from '../pages/admin/SubtitleManagement';
import MetadataManagement from '../pages/admin/MetadataManagement';
import HelpCenter from '../pages/admin/HelpCenter';

// Loading component for protected routes
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#141414',
    color: '#ffffff',
    fontSize: '18px',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #2a2a2a',
      borderTop: '3px solid #e50914',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p>Loading...</p>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Render children if authenticated
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Login route - accessible without authentication */}
      <Route path="login" element={<AdminLogin />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* Movie Management */}
        <Route path="movies" element={<MoviesManagement />} />
        <Route path="movies/add" element={<MovieAdd />} />
        <Route path="movies/edit/:id" element={<MovieEdit />} />
        
        {/* Banner Management */}
        <Route path="banners" element={<BannersManagement />} />
        <Route path="banners/add" element={<BannerAdd />} />
        <Route path="banners/edit/:id" element={<BannerEdit />} />
        
        {/* Category Management */}
        <Route path="categories" element={<CategoriesManagement />} />
        <Route path="categories/add" element={<CategoryAdd />} />
        <Route path="categories/edit/:id" element={<CategoryEdit />} />
        
        {/* Genre Management */}
        <Route path="genres" element={<GenresManagement />} />
        <Route path="genres/add" element={<GenreAdd />} />
        <Route path="genres/edit/:id" element={<GenreEdit />} />
        
        {/* Language Management */}
        <Route path="languages" element={<LanguagesManagement />} />
        <Route path="languages/add" element={<LanguageAdd />} />
        <Route path="languages/edit/:id" element={<LanguageEdit />} />
        
        {/* Tag Management */}
        <Route path="tags" element={<TagsManagement />} />
        <Route path="tags/add" element={<TagAdd />} />
        <Route path="tags/edit/:id" element={<TagEdit />} />
        
        {/* Cast Management */}
        <Route path="cast" element={<CastManagement />} />
        <Route path="cast/add" element={<CastAdd />} />
        <Route path="cast/edit/:id" element={<CastEdit />} />
        
        {/* Subtitle Management */}
        <Route path="subtitles" element={<SubtitleManagement />} />
        
        {/* Metadata Management */}
        <Route path="metadata" element={<MetadataManagement />} />
        
        {/* User Management */}
        <Route path="users" element={<UsersManagement />} />
        <Route path="users/:id" element={<UserProfile />} />
        
        {/* Reviews & Comments */}
        <Route path="reviews" element={<ReviewsManagement />} />
        <Route path="comments" element={<CommentsManagement />} />
        
        {/* Notifications */}
        <Route path="notifications" element={<NotificationsManagement />} />
        <Route path="notifications/add" element={<NotificationAdd />} />
        <Route path="notifications/edit/:id" element={<NotificationAdd />} />
        
        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsDashboard />} />
        
        {/* Settings */}
        <Route path="settings" element={<SettingsManagement />} />
        
        {/* Storage */}
        <Route path="storage" element={<StorageManagement />} />
        
        {/* Backup */}
        <Route path="backup" element={<BackupManagement />} />
        
        {/* Logs */}
        <Route path="activity" element={<ActivityLogs />} />
        <Route path="security" element={<SecurityLogs />} />
        
        {/* Admin Management */}
        <Route path="admins" element={<AdminManagement />} />
        <Route path="admins/add" element={<AdminAdd />} />
        <Route path="admins/edit/:id" element={<AdminEdit />} />
        
        {/* Admin Profile */}
        <Route path="profile" element={<AdminProfile />} />
        
        {/* Help */}
        <Route path="help" element={<HelpCenter />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
