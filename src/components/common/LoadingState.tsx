import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

/**
 * Props for the LoadingState component
 */
export interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorTitle?: string;
  minHeight?: number | string;
  showPaper?: boolean;
  centerContent?: boolean;
}

/**
 * A reusable component for handling loading and error states
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  loading, error, children, loadingMessage = 'Loading...', errorTitle = 'Error',
  minHeight = 200, showPaper = false, centerContent = false,
}) => {
  const content = (
    <>
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', 
                   justifyContent: 'center', minHeight }}>
          <CircularProgress />
          {loadingMessage && <Typography variant="body1" sx={{ mt: 2 }}>{loadingMessage}</Typography>}
        </Box>
      )}

      {!loading && error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', 
                   justifyContent: 'center', minHeight, p: 2 }}>
          <Typography variant="h6" color="error" gutterBottom>{errorTitle}</Typography>
          <Typography variant="body1" color="error" align="center">{error}</Typography>
        </Box>
      )}

      {!loading && !error && (
        <Box sx={{ minHeight, display: centerContent ? 'flex' : 'block',
                   flexDirection: 'column', justifyContent: centerContent ? 'center' : 'flex-start',
                   alignItems: centerContent ? 'center' : 'stretch' }}>
          {children}
        </Box>
      )}
    </>
  );

  if (showPaper) return <Paper sx={{ p: 2 }}>{content}</Paper>;
  return content;
};

export default LoadingState;
