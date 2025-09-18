import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  ButtonGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { versionsApi } from '../services/api';
import { Version, VersionFormData } from '../models';

const AllVersionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<VersionFormData>({
    version: '',
    description: '',
    isActive: true
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);
  const [duplicateFromVersion, setDuplicateFromVersion] = useState<string>('');
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await versionsApi.getAllVersions();
      setVersions(response.versions);
      setError(null);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError('Failed to load versions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleCreateVersion = () => {
    setIsDuplicating(false);
    setDuplicateFromVersion('');
    setFormData({
      version: '',
      description: '',
      isActive: true
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      version: '',
      description: '',
      isActive: true
    });
    setIsDuplicating(false);
    setDuplicateFromVersion('');
  };
  
  const handleDuplicateToggle = (checked: boolean) => {
    setIsDuplicating(checked);
    if (!checked) {
      setDuplicateFromVersion('');
    } else if (versions.length > 0) {
      setDuplicateFromVersion(versions[0].version);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value
    });
  };

  const handleSubmit = async () => {
    try {
      if (isDuplicating && duplicateFromVersion) {
        // Duplicate version
        await versionsApi.duplicateVersion(duplicateFromVersion, formData);
      } else {
        // Create new version
        await versionsApi.createVersion(formData);
      }
      handleCloseDialog();
      fetchVersions();
    } catch (err) {
      console.error('Error creating version:', err);
      setError('Failed to create version. Please try again.');
    }
  };

  const handleVersionClick = (version: Version) => {
    navigate(`/versions/${version.version}/shortnames`);
  };
  
  const handleViewConfigurations = (event: React.MouseEvent<HTMLButtonElement>, version: Version) => {
    event.stopPropagation();
    navigate(`/versions/${version.version}/configurations`);
  };
  
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>, version: Version) => {
    event.stopPropagation();
    setVersionToDelete(version.version);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setVersionToDelete(null);
  };
  
  const handleDeleteConfirm = async () => {
    if (!versionToDelete) return;
    
    try {
      setLoading(true);
      await versionsApi.deleteVersion(versionToDelete);
      setDeleteConfirmOpen(false);
      setVersionToDelete(null);
      fetchVersions();
    } catch (err) {
      console.error('Error deleting version:', err);
      setError('Failed to delete version. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">All Versions</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateVersion}
        >
          Create Version
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
                <TableCell>Version</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No versions found. Create a new version to get started.
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((version) => (
                  <TableRow 
                    key={version.versionId} 
                    hover 
                    onClick={() => handleVersionClick(version)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{version.version}</TableCell>
                    <TableCell>{version.description}</TableCell>
                    <TableCell>{version.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(version.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <ButtonGroup size="small">
                        <Button 
                          variant="outlined" 
                          onClick={(e) => handleViewConfigurations(e, version)}
                        >
                          Configurations
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error"
                          onClick={(e) => handleDeleteClick(e, version)}
                        >
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create New Version</DialogTitle>
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
            sx={{ mb: 2, display: 'block' }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={isDuplicating}
                onChange={(e, checked) => handleDuplicateToggle(checked)}
              />
            }
            label="Duplicate from existing version"
            sx={{ mb: 2, display: 'block' }}
          />
          
          {isDuplicating && versions.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="duplicate-version-label">Source Version</InputLabel>
              <Select
                labelId="duplicate-version-label"
                value={duplicateFromVersion}
                label="Source Version"
                onChange={(e) => setDuplicateFromVersion(e.target.value)}
              >
                {versions.map((version) => (
                  <MenuItem key={version.version} value={version.version}>
                    {version.version}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                All shortnames and configurations from this version will be copied to the new version
              </FormHelperText>
            </FormControl>
          )}
          
          {isDuplicating && versions.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No existing versions to duplicate from. Create a regular version first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Version</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete version "{versionToDelete}"? This will remove the version from all shortnames. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllVersionsPage;
