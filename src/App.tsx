import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import theme from './config/theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ShortnamesPage from './pages/ShortnamesPage';
import ShortnamePage from './pages/ShortnamePage';
import VersionsPage from './pages/VersionsPage';
import VersionPage from './pages/VersionPage';
import ConfigurationsPage from './pages/ConfigurationsPage';
import NotFoundPage from './pages/NotFoundPage';
import AllVersionsPage from './pages/AllVersionsPage';
import VersionShortnamesPage from './pages/VersionShortnamesPage';
import VersionConfigurationsPage from './pages/VersionConfigurationsPage';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary'
        }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Version-first approach routes */}
            <Route path="versions" element={<AllVersionsPage />} />
            <Route path="versions/:version/shortnames" element={<VersionShortnamesPage />} />
            <Route path="versions/:version/configurations" element={<VersionConfigurationsPage />} />
            <Route path="versions/:version/shortnames/:shortname" element={<ShortnamePage />} />
            <Route path="versions/:version/shortnames/:shortname/configurations" element={<ConfigurationsPage />} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="shortnames" element={<ShortnamesPage />} />
            <Route path="shortnames/new" element={<ShortnamesPage />} />
            <Route path="shortnames/:shortname" element={<ShortnamePage />} />
            <Route path="shortnames/:shortname/versions" element={<VersionsPage />} />
            <Route path="shortnames/:shortname/versions/:version" element={<VersionPage />} />
            <Route path="shortnames/:shortname/versions/:version/configurations" element={<ConfigurationsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
