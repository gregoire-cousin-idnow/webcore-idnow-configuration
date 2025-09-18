import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The page you are looking for does not exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/"
            startIcon={<HomeIcon />}
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
