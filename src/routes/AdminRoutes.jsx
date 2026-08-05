import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Core Admin Pages
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminLayout from '../layouts/AdminLayout';
import AdminProfile from '../pages/admin/AdminProfile';

// Movies
import MoviesManagement from '../pages/admin/MoviesManagement';
import MovieAdd from '../pages/admin/MovieAdd';

// Banners
import BannersManagement from '../pages/admin/BannersManagement';
import BannerAdd from '../pages/admin/BannerAdd';

// Categories
import CategoriesManagement from '../pages/admin/CategoriesManagement';
import CategoryAdd from '../pages/admin/CategoryAdd';
import CategoryEdit from '../pages/admin/CategoryEdit';

// Genres
import GenresManagement from '../pages/admin/GenresManagement';
import GenreAdd from '../pages/admin/GenreAdd';
import GenreEdit from '../pages/admin/GenreEdit';

// Languages
import LanguagesManagement from '../pages/admin/LanguagesManagement';
import LanguageAdd from '../pages/admin/LanguageAdd';
import LanguageEdit from '../pages/admin/LanguageEdit';

// Cast
import CastManagement from '../pages/admin/CastManagement';
import CastAdd from '../pages/admin/CastAdd';
import CastEdit from '../pages/admin/CastEdit';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#141414',
    color: '#ffffff',
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

  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/admin/login" replace />;

  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        
        {/* Movies */}
        <Route path="movies" element={<MoviesManagement />} />
        <Route path="movies/add" element={<MovieAdd />} />
        <Route path="movies/edit/:id" element={<MovieAdd />} />
        
        {/* Banners */}
        <Route path="banners" element={<BannersManagement />} />
        <Route path="banners/add" element={<BannerAdd />} />
        <Route path="banners/edit/:id" element={<BannerAdd />} />
        
        {/* Categories */}
        <Route path="categories" element={<CategoriesManagement />} />
        <Route path="categories/add" element={<CategoryAdd />} />
        <Route path="categories/edit/:id" element={<CategoryEdit />} />
        
        {/* Genres */}
        <Route path="genres" element={<GenresManagement />} />
        <Route path="genres/add" element={<GenreAdd />} />
        <Route path="genres/edit/:id" element={<GenreEdit />} />
        
        {/* Languages */}
        <Route path="languages" element={<LanguagesManagement />} />
        <Route path="languages/add" element={<LanguageAdd />} />
        <Route path="languages/edit/:id" element={<LanguageEdit />} />
        
        {/* Cast */}
        <Route path="cast" element={<CastManagement />} />
        <Route path="cast/add" element={<CastAdd />} />
        <Route path="cast/edit/:id" element={<CastEdit />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
