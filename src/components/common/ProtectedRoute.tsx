import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps { children?: React.ReactNode; }

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authState } = useAuth();
  const { isAuthenticated, loading } = authState;

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', 
               alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
      <CircularProgress color="primary" size={60} />
      <Box sx={{ mt: 2, color: 'text.secondary' }}>Loading...</Box>
    </Box>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children || <Outlet />}</>;
};

export default ProtectedRoute;
