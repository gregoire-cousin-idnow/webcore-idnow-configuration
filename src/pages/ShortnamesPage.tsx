import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { shortnamesApi } from '../services/api';
import { Shortname, ShortnameFormData } from '../types';

const ShortnamesPage: React.FC = () => {
  const [shortnames, setShortnames] = useState<Shortname[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<ShortnameFormData>({
    shortname: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<{
    shortname?: string;
    description?: string;
  }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [shortnameToDelete, setShortnameToDelete] = useState<string | null>(null);

  const { state } = useAuth();
  const navigate = useNavigate();

  const fetchShortnames = async () => {
    try {
      setLoading(true);
      const response = await shortnamesApi.getAll();
      setShortnames(response.shortnames || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shortnames');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortnames();
  }, []);

  const handleOpenDialog = () => {
    setFormData({ shortname: '', description: '' });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const validateForm = (): boolean => {
    const errors: { shortname?: string; description?: string } = {};
    let isValid = true;

    if (!formData.shortname) {
      errors.shortname = 'Shortname is required';
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(formData.shortname)) {
      errors.shortname = 'Shortname can only contain lowercase letters, numbers, and hyphens';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await shortnamesApi.create(formData);
      setOpenDialog(false);
      fetchShortnames();
    } catch (err: any) {
      setError(err.message || 'Failed to create shortname');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (shortname: string) => {
    setShortnameToDelete(shortname);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!shortnameToDelete) return;

    try {
      setLoading(true);
      await shortnamesApi.delete(shortnameToDelete);
      fetchShortnames();
    } catch (err: any) {
      setError(err.message || 'Failed to delete shortname');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setShortnameToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setShortnameToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shortnames
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Shortname
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : shortnames.length === 0 ? (
        <Alert severity="info">
          No shortnames found. Create your first shortname to get started.
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
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Button
                      size="small"
                      component={Link}
                      to={`/shortnames/${shortname.shortname}`}
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      component={Link}
                      to={`/shortnames/${shortname.shortname}/versions`}
                    >
                      Versions
                    </Button>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      component={Link}
                      to={`/shortnames/${shortname.shortname}/edit`}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(shortname.shortname)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Shortname Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create New Shortname</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="shortname"
            label="Shortname"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.shortname}
            onChange={(e) => setFormData({ ...formData, shortname: e.target.value })}
            error={!!formErrors.shortname}
            helperText={formErrors.shortname}
            disabled={submitting}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={!!formErrors.description}
            helperText={formErrors.description}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="contained">
            {submitting ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the shortname "{shortnameToDelete}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShortnamesPage;
