import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/admin/Sidebar';
import Header from '../components/admin/Header';
import MobileSidebar from '../components/admin/MobileSidebar';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const { isDarkMode } = useTheme();
  const { currentUser, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  console.log('📐 [AdminLayout] Rendering, user:', currentUser?.uid || 'none', 'path:', location.pathname);

  useEffect(() => {
    console.log('📐 [AdminLayout] Location changed to:', location.pathname);
    setIsMobileSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    if (!currentUser) {
      console.log('📐 [AdminLayout] No user, redirecting to login');
      navigate('/admin/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    console.log('📐 [AdminLayout] Logout clicked');
    const result = await logout();
    if (result.success) {
      navigate('/admin/login', { replace: true });
    }
  };

  // If no user, don't render anything
  if (!currentUser) {
    console.log('📐 [AdminLayout] No user, returning null');
    return null;
  }

  console.log('📐 [AdminLayout] Rendering full layout');

  return (
    <div className={`admin-layout ${isDarkMode ? 'dark' : 'light'}`}>
      <Sidebar />
      
      <div className="admin-main">
        <Header 
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onLogout={handleLogout}
          user={currentUser}
        />
        
        <main className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="admin-page-wrapper"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      <MobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default AdminLayout;
