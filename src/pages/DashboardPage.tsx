import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { shortnamesApi } from '../services/api';
import { Shortname } from '../models';

const DashboardPage: React.FC = () => {
  const [shortnames, setShortnames] = useState<Shortname[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const fetchShortnames = async () => {
      try {
        setLoading(true);
        const response = await shortnamesApi.getAll();
        if (isMounted) {
          setShortnames(response.shortnames || []);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch shortnames');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchShortnames();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/shortnames/new"
          startIcon={<AddIcon />}
        >
          New Shortname
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        Welcome, {authState.user?.email}!
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Your Shortnames
          </Typography>
          {shortnames.length === 0 ? (
            <Alert severity="info">
              You don't have any shortnames yet. Create your first shortname to get started.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {shortnames.map((shortname) => (
                <Grid item xs={12} sm={6} md={4} key={shortname.shortname}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {shortname.shortname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {shortname.description || 'No description'}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Created: {new Date(shortname.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        component={Link}
                        to={`/shortnames/${shortname.shortname}`}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        component={Link}
                        to={`/shortnames/${shortname.shortname}/versions`}
                      >
                        Versions
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
