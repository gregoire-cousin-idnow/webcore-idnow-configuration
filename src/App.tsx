import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ShortnamesPage from './pages/ShortnamesPage';
import ShortnamePage from './pages/ShortnamesPage';
import VersionsPage from './pages/VersionsPage';
import VersionPage from './pages/VersionPage';
import ConfigurationsPage from './pages/ConfigurationsPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="shortnames" element={<ShortnamesPage />} />
            <Route path="shortnames/:shortname" element={<ShortnamePage />} />
            <Route path="shortnames/:shortname/versions" element={<VersionsPage />} />
            <Route path="shortnames/:shortname/versions/:version" element={<VersionPage />} />
            <Route path="shortnames/:shortname/versions/:version/configurations" element={<ConfigurationsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </AuthProvider>
  );
};

export default App;
