import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/dashboard/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', {
    reason: event.reason,
    promise: event.promise
  });
});

function App() {
  const location = useLocation();
  
  // Log route changes
  React.useEffect(() => {
    console.log('📍 Route changed to:', location.pathname);
    console.log('📊 Current timestamp:', new Date().toISOString());
  }, [location]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
