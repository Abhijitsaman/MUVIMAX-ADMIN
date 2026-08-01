import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AdminRoutes from './routes/AdminRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/movie-form.css';
import './styles/banner.css';
import './styles/metadata.css';
import './styles/users.css';
import './styles/reviews.css';
import './styles/activity.css';
import './styles/settings.css';

// Debug: Log app startup
console.log('🚀 [App] Application starting...');

function App() {
  console.log('🚀 [App] Rendering App component');
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
