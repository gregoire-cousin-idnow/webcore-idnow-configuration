import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { versionsApi } from '../services/api';
import { Version, VersionFormData } from '../types';

const VersionPage: React.FC = () => {
  const { shortname, version: versionId } = useParams<{ shortname: string; version: string }>();
  const navigate = useNavigate();
  const [versionData, setVersionData] = useState<Version | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<VersionFormData>({
    version: '',
    description: '',
    isActive: true
  });

  const fetchVersion = async () => {
    if (!shortname || !versionId) return;
    
    setLoading(true);
    try {
      const response = await versionsApi.getOne(shortname, versionId);
      setVersionData(response);
      setFormData({
        version: response.version,
        description: response.description,
        isActive: response.isActive
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching version:', err);
      setError('Failed to load version details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersion();
  }, [shortname, versionId]);

  const handleConfigurationsClick = () => {
    if (!shortname || !versionId) return;
    navigate(`/shortnames/${shortname}/versions/${versionId}/configurations`);
  };

  const handleEditClick = () => {
    setOpenEditDialog(true);
  };

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    if (versionData) {
      setFormData({
        version: versionData.version,
        description: versionData.description,
        isActive: versionData.isActive
      });
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value
    });
  };

  const handleUpdateSubmit = async () => {
    if (!shortname || !versionId) return;
    
    try {
      await versionsApi.update(shortname, versionId, formData);
      setOpenEditDialog(false);
      fetchVersion();
    } catch (err) {
      console.error('Error updating version:', err);
      setError('Failed to update version. Please try again.');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!shortname || !versionId) return;
    
    try {
      await versionsApi.delete(shortname, versionId);
      navigate(`/shortnames/${shortname}/versions`);
    } catch (err) {
      console.error('Error deleting version:', err);
      setError('Failed to delete version. Please try again.');
      setOpenDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!versionData) {
    return (
      <Box>
        <Typography variant="h5" color="error">
          Version not found
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(`/shortnames/${shortname}/versions`)}
          sx={{ mt: 2 }}
        >
          Back to Versions
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {shortname} - Version {versionData.version}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<EditIcon />}
            onClick={handleEditClick}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            sx={{ mr: 1 }}
          >
            Delete
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SettingsIcon />}
            onClick={handleConfigurationsClick}
          >
            Configurations
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Version Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body1">
                    {versionData.version}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {versionData.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">
                    {versionData.createdBy}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(versionData.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(versionData.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {versionData.description}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Version</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="version"
            label="Version"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.version}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleInputChange}
                name="isActive"
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateSubmit} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Version</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete version {versionData.version}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSubmit} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VersionPage;
