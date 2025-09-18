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
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VersionsIcon from '@mui/icons-material/Collections';
import { shortnamesApi } from '../services/api';
import { Shortname, ShortnameFormData } from '../models';

const ShortnamePage: React.FC = () => {
  const { shortname } = useParams<{ shortname: string }>();
  const navigate = useNavigate();
  const [shortnameData, setShortnameData] = useState<Shortname | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<ShortnameFormData>({
    shortname: '',
    description: ''
  });

  const fetchShortname = async () => {
    if (!shortname) return;
    
    setLoading(true);
    try {
      const response = await shortnamesApi.getOne(shortname);
      setShortnameData(response);
      setFormData({
        shortname: response.shortname,
        description: response.description
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching shortname:', err);
      setError('Failed to load shortname details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortname();
  }, [shortname]);

  const handleVersionsClick = () => {
    if (!shortname) return;
    navigate(`/shortnames/${shortname}/versions`);
  };

  const handleEditClick = () => {
    setOpenEditDialog(true);
  };

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    if (shortnameData) {
      setFormData({
        shortname: shortnameData.shortname,
        description: shortnameData.description
      });
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdateSubmit = async () => {
    if (!shortname) return;
    
    try {
      await shortnamesApi.update(shortname, formData);
      setOpenEditDialog(false);
      fetchShortname();
    } catch (err) {
      console.error('Error updating shortname:', err);
      setError('Failed to update shortname. Please try again.');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!shortname) return;
    
    try {
      await shortnamesApi.delete(shortname);
      navigate('/shortnames');
    } catch (err) {
      console.error('Error deleting shortname:', err);
      setError('Failed to delete shortname. Please try again.');
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

  if (!shortnameData) {
    return (
      <Box>
        <Typography variant="h5" color="error">
          Shortname not found
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/shortnames')}
          sx={{ mt: 2 }}
        >
          Back to Shortnames
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
          Shortname: {shortnameData.shortname}
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
            startIcon={<VersionsIcon />}
            onClick={handleVersionsClick}
          >
            Versions
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shortname Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Shortname
                  </Typography>
                  <Typography variant="body1">
                    {shortnameData.shortname}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">
                    {shortnameData.createdBy}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(shortnameData.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(shortnameData.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {shortnameData.description}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Shortname</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="shortname"
            label="Shortname"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.shortname}
            onChange={handleInputChange}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            autoFocus
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
        <DialogTitle>Delete Shortname</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the shortname "{shortnameData.shortname}"? This action cannot be undone and will delete all associated versions and configurations.
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

export default ShortnamePage;
