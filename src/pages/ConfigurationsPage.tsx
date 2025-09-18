import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { configurationsApi } from '../services/api';
import { Configuration, ConfigurationFormData } from '../types';

const ConfigurationsPage: React.FC = () => {
  const { shortname, version } = useParams<{ shortname: string; version: string }>();
  const navigate = useNavigate();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
  const [formData, setFormData] = useState<ConfigurationFormData>({
    key: '',
    value: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const fetchConfigurations = async () => {
    if (!shortname || !version) return;
    
    setLoading(true);
    try {
      const response = await configurationsApi.getAll(shortname, version);
      setConfigurations(response.configurations);
      setError(null);
    } catch (err) {
      console.error('Error fetching configurations:', err);
      setError('Failed to load configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, [shortname, version]);

  const handleCreateConfiguration = () => {
    setIsEditing(false);
    setFormData({
      key: '',
      value: '',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleEditConfiguration = (config: Configuration) => {
    setIsEditing(true);
    setSelectedConfig(config);
    setFormData({
      key: config.key,
      value: config.value,
      description: config.description
    });
    setOpenDialog(true);
  };

  const handleDeleteConfiguration = (config: Configuration) => {
    setSelectedConfig(config);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      key: '',
      value: '',
      description: ''
    });
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedConfig(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    if (!shortname || !version) return;
    
    try {
      if (isEditing && selectedConfig) {
        await configurationsApi.update(shortname, version, selectedConfig.configId, formData);
      } else {
        await configurationsApi.create(shortname, version, formData);
      }
      handleCloseDialog();
      fetchConfigurations();
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} configuration. Please try again.`);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!shortname || !version || !selectedConfig) return;
    
    try {
      await configurationsApi.delete(shortname, version, selectedConfig.configId);
      handleCloseDeleteDialog();
      fetchConfigurations();
    } catch (err) {
      console.error('Error deleting configuration:', err);
      setError('Failed to delete configuration. Please try again.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Configurations for {shortname} v{version}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateConfiguration}
        >
          Add Configuration
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
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configurations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No configurations found. Add a new configuration to get started.
                  </TableCell>
                </TableRow>
              ) : (
                configurations.map((config) => (
                  <TableRow key={config.configId}>
                    <TableCell>{config.key}</TableCell>
                    <TableCell>{typeof config.value === 'object' ? JSON.stringify(config.value) : config.value}</TableCell>
                    <TableCell>{config.description}</TableCell>
                    <TableCell>{new Date(config.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(config.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEditConfiguration(config)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteConfiguration(config)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit Configuration' : 'Add Configuration'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="key"
            label="Key"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.key}
            onChange={handleInputChange}
            disabled={isEditing}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="value"
            label="Value"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.value}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Configuration</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the configuration "{selectedConfig?.key}"? This action cannot be undone.
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

export default ConfigurationsPage;
